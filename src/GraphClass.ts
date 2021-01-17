import * as PIXI from 'pixi.js';
import strip from 'strip-comments';
import { Viewport } from 'pixi-viewport';
import * as dat from 'dat.gui';

import { CONNECTION_COLOR_HEX, PP_VERSION } from './constants';
import { PPNodeConstructor, SerializedGraph } from './interfaces';
import PPNode from './NodeClass';
import InputSocket from './InputSocketClass';
import OutputSocket from './OutputSocketClass';
import PPLink from './LinkClass';

let gui: dat.GUI;

export default class PPGraph {
  app: PIXI.Application;
  viewport: Viewport;

  lastNodeId: number;

  lastLinkId: number;

  _links: { [key: number]: PPLink };
  _registeredNodeTypes: Record<string, PPNodeConstructor>;
  customNodeTypes: Record<string, string>;

  selectedNodes: string[];
  clickedOutputRef: null | OutputSocket;
  overInputRef: null | InputSocket;
  dragSourcePoint: null | PIXI.Point;

  tempConnection: PIXI.Graphics;
  tempContainer: PIXI.Container;
  backgroundCanvas: PIXI.Container;
  foregroundCanvas: PIXI.Container;
  connectionContainer: PIXI.Container;
  nodeContainer: PIXI.Container;

  onSelectionChange: ((selectedNodes: string[]) => void) | null;

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    console.log('Graph created');

    this.clickedOutputRef = null;
    this.overInputRef = null;
    this.dragSourcePoint = null;

    this.tempConnection = new PIXI.Graphics();
    this.tempContainer = new PIXI.Container();
    this.backgroundCanvas = new PIXI.Container();
    this.backgroundCanvas.name = 'backgroundCanvas';
    this.connectionContainer = new PIXI.Container();
    this.connectionContainer.name = 'connectionContainer';
    this.nodeContainer = new PIXI.Container();
    this.nodeContainer.name = 'nodeContainer';
    this.foregroundCanvas = new PIXI.Container();
    this.foregroundCanvas.name = 'foregroundCanvas';

    this.viewport.addChild(
      this.backgroundCanvas,
      this.connectionContainer,
      this.tempContainer,
      this.nodeContainer,
      this.foregroundCanvas
    );
    this.tempContainer.addChild(this.tempConnection);
    this.tempConnection.name = 'tempConnection';

    this.viewport.on('pointerdown', this._onPointerDown.bind(this));

    // clear the stage
    this.clear();
    this.customNodeTypes = {};
    this._registeredNodeTypes = {};

    // define callbacks
    this.onSelectionChange = null; //called if the selection changes
  }

  // SETUP

  _onPointerDown(): void {
    this.deselectAllNodes();
  }

  _onNodePointerDown(event: PIXI.InteractionEvent): void {
    console.log('_onNodePointerDown');
    // stop propagation so viewport does not get dragged
    event.stopPropagation();

    const node = event.currentTarget as PPNode;
    console.log(node.id);

    if (this.clickedOutputRef === null) {
      // clicked on the node, but not on a slot
      this.selectNode(node);
    } else {
      // event.data.global delivers the mouse coordinates from the top left corner in pixel
      node.interactionData = event.data;

      const dragSourceRect = this.clickedOutputRef.children[0].getBounds();
      const dragSourcePoint = new PIXI.Point(
        dragSourceRect.x + dragSourceRect.width / 2,
        dragSourceRect.y + dragSourceRect.height / 2
      );
      // change dragSourcePoint coordinates from screen to world space
      this.dragSourcePoint = this.viewport.toWorld(dragSourcePoint);
    }

    // subscribe to pointermove
    this.viewport.on('pointermove', this.onNodeDragMove.bind(this));
  }

  onNodeDragMove(event: PIXI.InteractionEvent): void {
    // console.log('onNodeDragMove');

    if (this.clickedOutputRef !== null) {
      // temporarily draw connection while dragging
      const sourcePointX = this.dragSourcePoint.x;
      const sourcePointY = this.dragSourcePoint.y;

      // change mouse coordinates from screen to world space
      const mousePoint = this.viewport.toWorld(event.data.global);
      const mousePointX = mousePoint.x;
      const mousePointY = mousePoint.y;

      // draw curve from 0,0 as PIXI.thisics originates from 0,0
      const toX = mousePointX - sourcePointX;
      const toY = mousePointY - sourcePointY;
      const cpX = Math.abs(toX) / 2;
      const cpY = 0;
      const cpX2 = toX - cpX;
      const cpY2 = toY;
      // console.log(sourcePointX, toX);

      this.tempConnection.clear();
      this.tempConnection.lineStyle(2, CONNECTION_COLOR_HEX, 1);
      this.tempConnection.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

      // offset curve to start from source
      this.tempConnection.x = sourcePointX;
      this.tempConnection.y = sourcePointY;
    }
  }

  _onNodePointerUpAndUpOutside(event: PIXI.InteractionEvent): void {
    console.log('_onNodePointerUpAndUpOutside');

    const node = event.currentTarget as PPNode;
    console.log(node.id);

    // unsubscribe from pointermove
    this.viewport.removeListener('pointermove', this.onNodeDragMove);

    if (this !== null) {
      if (this.clickedOutputRef === null) {
        // this.viewport.plugins.resume('drag');
      } else {
        // check if over input
        console.log(this.overInputRef);
        if (this.overInputRef !== null) {
          console.log(
            'connecting Output:',
            this.clickedOutputRef.name,
            'of',
            this.clickedOutputRef.parent.name,
            'with Input:',
            this.overInputRef.name,
            'of',
            this.overInputRef.parent.name
          );
          this.connect(this.clickedOutputRef, this.overInputRef, this.viewport);
        }
      }
    }
    this.tempConnection.clear();
    this.clickedOutputRef = null;
    this.overInputRef = null;
  }

  _onNodePointerOver(event: PIXI.InteractionEvent): void {
    console.log('_onNodePointerOver');

    const node = event.currentTarget as PPNode;
    console.log(node.id);
  }

  // GETTERS & SETTERS

  get registeredNodeTypes(): Record<string, PPNodeConstructor> {
    return this._registeredNodeTypes;
  }

  get nodes(): PPNode[] {
    return this.nodeContainer.children as PPNode[];
  }

  // METHODS

  getNodeById(id: string): PPNode {
    return this.nodes.find((node) => node.id === id);
  }

  registerNodeType(type: string, nodeConstructor: PPNodeConstructor): void {
    nodeConstructor.type = type;
    console.log('Node registered: ' + type);
    console.log(this._registeredNodeTypes);

    // create/update node type
    this._registeredNodeTypes[type] = nodeConstructor;
  }

  registerCustomNodeType(code: string): string {
    const func = this.convertStringToFunction(code);
    const nodeConstructor = this.convertFunctionToNodeConstructor(func);
    // register or update node type
    this.registerNodeType(func.name, nodeConstructor);
    return func.name;
  }

  createNode<T extends PPNode = PPNode>(type: string, customId = ''): T {
    // console.log(this._registeredNodeTypes);
    const nodeConstructor = this._registeredNodeTypes[type];
    if (!nodeConstructor) {
      console.log('GraphNode type "' + type + '" not registered.');
      return null;
    }

    const title = type;
    console.log(this);
    console.log(nodeConstructor);
    const node = new nodeConstructor(title, this, customId) as T;
    return node;
  }

  addNode<T extends PPNode = PPNode>(node: T): T {
    // if (!node) {
    //   return;
    // }

    node
      .on('pointerdown', this._onNodePointerDown.bind(this))
      .on('pointerupoutside', this._onNodePointerUpAndUpOutside.bind(this))
      .on('pointerup', this._onNodePointerUpAndUpOutside.bind(this))
      .on('pointerover', this._onNodePointerOver.bind(this));

    // change add id to title
    const newName = `${node.nodeName} : ${node.id}`;
    node.nodeName = newName;
    console.log(node.nodeName);

    // add the node to the canvas
    this.nodeContainer.addChild(node);

    // move to center of canvas
    node.x = this.viewport.center.x;
    node.y = this.viewport.center.y;

    return node; //to chain actions
  }

  createAndAddNode<T extends PPNode = PPNode>(
    type: string,
    customId?: string
  ): T {
    const node = this.createNode(type, customId) as T;
    // if (node) {
    this.addNode(node);
    console.log(node);
    return node;
    // }
  }

  connect(
    output: OutputSocket,
    input: InputSocket,
    viewport: Viewport
  ): PPLink {
    // check if this input already has a connection
    this.checkIfSocketHasConnectionAndDeleteIt(input, true);

    let link = null;

    // //this slots cannot be connected (different types)
    // if (!LiteGraph.isValidConnection(output.type, input.type)) {
    //   this.setDirtyCanvas(false, true);
    //   if (changed) this.graph.connectionChange(this, link);
    //   return null;
    // }

    //create link class
    link = new PPLink(
      (this.lastLinkId += 1),
      input.type,
      output,
      input,
      viewport
    );

    //add to graph links list
    this._links[link.id] = link;

    //add link to output
    output.links.push(link);
    //add link to input
    input.link = link;

    this.connectionContainer.addChild(link);

    return link;
  }

  checkOldSocketAndUpdateIt<T extends InputSocket | OutputSocket>(
    oldSocket: T,
    newSocket: T,
    isInput: boolean
  ): boolean {
    // check if this socket already has a connection
    Object.entries(this._links).forEach(([key, link]) => {
      if (isInput ? link.target === oldSocket : link.source === oldSocket) {
        console.log('updating link:', isInput ? link.target : link.source);

        if (isInput) {
          link.updateTarget(newSocket as InputSocket);
          (newSocket as InputSocket).link = link;
        } else {
          link.updateSource(newSocket as OutputSocket);
          (newSocket as OutputSocket).links.push(link);
        }
        return true;
      }
    });
    return false;
  }

  checkIfSocketHasConnectionAndDeleteIt(
    socket: InputSocket | OutputSocket,
    isInput: boolean
  ): boolean {
    // check if this socket already has a connection
    Object.entries(this._links).forEach(([key, link]) => {
      if (isInput ? link.target === socket : link.source === socket) {
        console.log('deleting link:', isInput ? link.target : link.source);

        // remove link from source and target socket
        link.getTarget().removeLink();
        link.getSource().removeLink(link);

        // remove link from graph
        this.connectionContainer.removeChild(this._links[key]);
        return delete this._links[key];
      }
    });
    return false;
  }

  clear(): void {
    this.lastNodeId = 0;
    this.lastLinkId = 0;

    // remove all links
    this.connectionContainer.removeChildren();
    this._links = {};

    // remove all nodes from container
    this.nodeContainer.removeChildren();

    // clearn back and foreground canvas
    this.backgroundCanvas.removeChildren();
    this.foregroundCanvas.removeChildren();

    // remove selected nodes
    this.deselectAllNodes();
  }

  selectNode(node: PPNode): void {
    if (node === null) {
      this.deselectAllNodes();
    } else {
      this.deselectAllNodes();
      node.select(true);
      this.selectedNodes = [node.id];

      // add node gui
      gui = new dat.GUI();
      const data = {};
      node.inputSocketArray.forEach((item) => {
        data[item.name] = item.value;
        console.log(item);
        console.log(item.value);
        // console.log(data);
        switch (item.type) {
          case 'number':
            gui.add(data, item.name, 0, 100, 1).onChange((value) => {
              console.log(item, value);
              item.value = value;
            });
            break;
          case 'string':
            gui.add(data, item.name).onChange((value) => {
              console.log(item, value);
              item.value = value;
            });
            break;
          case 'color':
            gui.addColor(data, item.name).onChange((value) => {
              console.log(item, value);
              item.value = value;
            });
            break;

          default:
            break;
        }
      });

      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedNodes);
      }
    }
  }

  deselectAllNodes(): void {
    if (gui instanceof dat.GUI) {
      gui.destroy();
      gui = undefined;
    }

    Object.entries(this.nodes).forEach(([, node]) => {
      if (node.selected) {
        node.select(false);
      }
    });
    this.selectedNodes = [];

    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedNodes);
    }
  }

  serialize(): SerializedGraph {
    // get serialized nodes
    const nodesSerialized = [];
    for (const node of Object.values(this.nodes)) {
      nodesSerialized.push(node.serialize());
    }

    // get serialized links
    const linksSerialized = [];
    for (const link of Object.values(this._links)) {
      linksSerialized.push(link.serialize());
    }

    const data = {
      customNodeTypes: this.customNodeTypes,
      nodes: nodesSerialized,
      links: linksSerialized,
      version: PP_VERSION,
    };

    return data;
  }

  configure(data: SerializedGraph, keep_old?: boolean): boolean {
    if (!data) {
      return;
    }

    if (!keep_old) {
      this.clear();
    }

    let error = false;

    // register custom node types only
    // standard nodes types are already registered on load
    console.log('standard node types: ', this._registeredNodeTypes);
    Object.values(data.customNodeTypes).forEach((value) => {
      this.registerCustomNodeType(value);
    });

    // store customNodeTypes
    this.customNodeTypes = data.customNodeTypes;

    //create nodes
    const nodes = data.nodes;
    if (nodes) {
      for (let i = 0, l = nodes.length; i < l; ++i) {
        const n_info = nodes[i]; //stored info
        const node = this.createAndAddNode(n_info.type, n_info.id);
        if (!node) {
          error = true;
          console.log('Node not found or has errors: ' + n_info.type);
        }
        console.log(n_info);
        node.configure(n_info);
      }
    }

    // connect nodes
    const links = data.links;
    this._links = [];
    if (links) {
      for (let i = 0, l = links.length; i < l; ++i) {
        const l_info = links[i]; //stored info
        const outputRef = this.getOutputRef(
          l_info.sourceNodeId,
          l_info.sourceSocketIndex
        );
        const inputRef = this.getInputRef(
          l_info.targetNodeId,
          l_info.targetSocketIndex
        );
        console.log(outputRef, inputRef);
        if (outputRef === undefined || inputRef === undefined) {
          error = true;
          console.log('In or Output socket not found: ' + l_info.type);
        } else {
          this.connect(outputRef, inputRef, this.viewport);
        }
      }
    }
    return error;
  }

  getOutputRef(
    sourceNodeId: string,
    sourceSocketIndex: number
  ): OutputSocket | undefined {
    const sourceNode = this.getNodeById(sourceNodeId);
    if (sourceNode !== undefined) {
      const sourceSocket = sourceNode.outputSocketArray[sourceSocketIndex];
      return sourceSocket;
    }
  }

  getInputRef(
    targetNodeId: string,
    targetSocketIndex: number
  ): InputSocket | undefined {
    const targetNode = this.getNodeById(targetNodeId);
    if (targetNode !== undefined) {
      const targetSocket = targetNode.inputSocketArray[targetSocketIndex];
      return targetSocket;
    }
  }

  runStep(): void {
    const nodes = this.nodes;
    if (!nodes) {
      return;
    }

    // currently nodes are executed not in the order of hierarchy, but order of key/creation
    // would need to start with the ones having no input
    // and then continue from there

    Object.entries(nodes).forEach(([key, node]) => {
      try {
        node.onExecute(); //hard to send elapsed time
        if (true) {
          node.drawComment();
        }
        node.onAfterExecute();
      } catch (error) {
        console.error('Error onExecute', error);
      }
    });
  }

  createOrUpdateNodeFromCode(code: string): void {
    const functionName = this.registerCustomNodeType(code);
    const isNodeTypeRegistered = this.checkIfFunctionIsRegistered(functionName);
    console.log('isNodeTypeRegistered: ', isNodeTypeRegistered);

    let newNode: PPNode;
    const nodesWithTheSameType = this.nodes.filter(
      (node) => node.type === functionName
    );
    if (nodesWithTheSameType.length > 0) {
      nodesWithTheSameType.forEach((node) => {
        console.log('I am of the same type', node);

        newNode = this.createAndAddNode(functionName);
        newNode.configure(node.serialize());
        this.reconnectLinksToNewNode(node, newNode);

        // remove previous node
        this.removeNode(node);
      });
    } else {
      // canvas is empty and node does not yet exist on graph
      newNode = this.createAndAddNode(functionName);
    }

    // store function code string on graph
    this.customNodeTypes[functionName] = code;
  }

  convertStringToFunction(code: string): (...args: any[]) => any {
    // remove comments and possible empty line from start
    const cleanCode = strip(code).replace(/^\n/, '');
    console.log(cleanCode);
    return new Function('return ' + cleanCode)();
  }

  checkIfFunctionIsRegistered(functionName: string): boolean {
    if (this._registeredNodeTypes[functionName] === undefined) {
      return false;
    }
    return true;
  }

  convertFunctionToNodeConstructor(
    // type: string, // node name with namespace (e.g.: 'math/sum')
    func: (...args: any[]) => any,
    param_types?: string[],
    return_type?: string
  ): PPNodeConstructor {
    const functionName = func.name;
    const params = Array(func.length);
    let code = '';

    const names = this.getParameterNames(func);
    console.log(names);
    for (let i = 0; i < names.length; ++i) {
      code += `
      this.addInput('${names[i]}', '${
        param_types && param_types[i] ? param_types[i] : 0
      }');`;
    }
    code += `
      this.addOutput('out', '${return_type ? return_type : 0}');\n`;
    console.log(code);
    console.log(this);
    // https://stackoverflow.com/a/46519949
    const classobj = new Function(
      'PPNode',
      `return class ${functionName} extends PPNode {
    constructor(type, graph, customId) {
      super(type, graph, customId);
      ${code}
    }
        }
    `
    )(PPNode) as PPNodeConstructor;
    console.log(classobj);
    (classobj as any).description = 'Generated from ' + func.name;
    (classobj as any).prototype.onExecute = function onExecute() {
      for (let i = 0; i < params.length; ++i) {
        params[i] = this.getInputData(i);
      }
      const r = func.apply(this, params);
      this.setOutputData(0, r);
    };
    return classobj;
  }

  //used to create nodes from wrapping functions
  getParameterNames(func: any): Array<string> {
    const parameterArray = (func + '')
      .replace(/[/][/].*$/gm, '') // strip single-line comments
      .replace(/\s+/g, '') // strip white space
      .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  /**/
      .split('){', 1)[0]
      .replace(/^[^(]*[(]/, '') // extract the parameters
      .replace(/=[^,]+/g, '') // strip any ES6 defaults
      .split(',')
      .filter(Boolean); // split & filter [""]
    console.log(parameterArray);
    return parameterArray;
  }

  reconnectLinksToNewNode(oldNode: PPNode, newNode: PPNode): void {
    //disconnect inputs
    for (let i = 0; i < oldNode.inputSocketArray.length; i++) {
      const oldInputSocket = oldNode.inputSocketArray[i];
      const newInputSocket = newNode.inputSocketArray[i];
      this.checkOldSocketAndUpdateIt(oldInputSocket, newInputSocket, true);
    }

    //disconnect outputs
    for (let i = 0; i < oldNode.outputSocketArray.length; i++) {
      const oldOutputSocket = oldNode.outputSocketArray[i];
      const newOutputSocket = newNode.outputSocketArray[i];
      this.checkOldSocketAndUpdateIt(oldOutputSocket, newOutputSocket, false);
    }
  }

  removeNode(node: PPNode): void {
    //disconnect inputs
    for (let i = 0; i < node.inputSocketArray.length; i++) {
      const inputSocket = node.inputSocketArray[i];
      this.checkIfSocketHasConnectionAndDeleteIt(inputSocket, true);
    }

    //disconnect outputs
    for (let i = 0; i < node.outputSocketArray.length; i++) {
      const outputSocket = node.outputSocketArray[i];
      this.checkIfSocketHasConnectionAndDeleteIt(outputSocket, false);
    }

    // remove node
    this.nodeContainer.removeChild(node);
  }

  deleteSelectedNodes(): void {
    console.log(this.selectedNodes);
    console.log(this.nodes);

    // loop through selected nodes
    this.selectedNodes.forEach((nodeId) => {
      const node = this.getNodeById(nodeId);

      // deselect node
      node.select(false);

      this.removeNode(node);
    });
    this.deselectAllNodes();
  }
}

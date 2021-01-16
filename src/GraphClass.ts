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

  _nodes: { [key: number]: PPNode };
  _links: { [key: number]: PPLink };
  _registeredNodeTypes: Record<string, PPNodeConstructor>;

  selected_nodes: number[];
  clickedOutputRef: null | OutputSocket;
  overInputRef: null | InputSocket;
  dragSourcePoint: null | PIXI.Point;

  tempConnection: PIXI.Graphics;
  tempContainer: PIXI.Container;
  backgroundCanvas: PIXI.Container;
  foregroundCanvas: PIXI.Container;
  connectionContainer: PIXI.Container;
  nodeContainer: PIXI.Container;

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
    this._registeredNodeTypes = {};
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

  // METHODS

  registerNodeType(type: string, baseClass: PPNodeConstructor): void {
    baseClass.type = type;
    console.log('Node registered: ' + type);
    console.log(this._registeredNodeTypes);

    // create/update node type
    this._registeredNodeTypes[type] = baseClass;
  }

  // createNode(type: string): PPNode {
  createNode<T extends PPNode = PPNode>(type: string): T {
    // console.log(this._registeredNodeTypes);
    const baseClass = this._registeredNodeTypes[type];
    if (!baseClass) {
      console.log('GraphNode type "' + type + '" not registered.');
      return null;
    }

    const title = type;
    console.log(this);
    console.log(baseClass);
    const node = new baseClass(title, this) as T;
    return node;
  }

  addNode<T extends PPNode = PPNode>(node: T, customId?: number): T {
    // if (!node) {
    //   return;
    // }

    node
      .on('pointerdown', this._onNodePointerDown.bind(this))
      .on('pointerupoutside', this._onNodePointerUpAndUpOutside.bind(this))
      .on('pointerup', this._onNodePointerUpAndUpOutside.bind(this))
      .on('pointerover', this._onNodePointerOver.bind(this));

    // give the node an id
    node.id = customId || ++this.lastNodeId;

    // change add id to title
    const newName = `${node.nodeName} : ${node.id}`;
    node.nodeName = newName;
    console.log(node.nodeName);

    // add the node to the canvas
    this.nodeContainer.addChild(node);

    // add the node to the _nodes object
    this._nodes[node.id] = node;

    return node; //to chain actions
  }

  createAndAdd<T extends PPNode = PPNode>(type: string): T {
    const node = this.createNode(type) as T;
    // if (node) {
    this.addNode(node);
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
    this._nodes = {};

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
      this.selected_nodes = [node.id];

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
    }
  }

  deselectAllNodes(): void {
    if (gui instanceof dat.GUI) {
      gui.destroy();
      gui = undefined;
    }

    const nodes = this._nodes;
    Object.entries(nodes).forEach(([, node]) => {
      if (node.selected) {
        node.select(false);
      }
    });
    this.selected_nodes = [];
  }

  serialize(): SerializedGraph {
    // get serialized nodes
    const nodesSerialized = [];
    for (const node of Object.values(this._nodes)) {
      nodesSerialized.push(node.serialize());
    }

    // get serialized links
    const linksSerialized = [];
    for (const link of Object.values(this._links)) {
      linksSerialized.push(link.serialize());
    }

    const data = {
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

    //create nodes
    const nodes = data.nodes;
    this._nodes = [];
    if (nodes) {
      for (let i = 0, l = nodes.length; i < l; ++i) {
        const n_info = nodes[i]; //stored info
        const node = this.createAndAdd(n_info.type);
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
    sourceNodeId: number,
    sourceSocketIndex: number
  ): OutputSocket | undefined {
    const sourceNode = this._nodes[sourceNodeId];
    if (sourceNode !== undefined) {
      const sourceSocket = sourceNode.outputSocketArray[sourceSocketIndex];
      return sourceSocket;
    }
  }

  getInputRef(
    targetNodeId: number,
    targetSocketIndex: number
  ): InputSocket | undefined {
    const targetNode = this._nodes[targetNodeId];
    if (targetNode !== undefined) {
      const targetSocket = targetNode.inputSocketArray[targetSocketIndex];
      return targetSocket;
    }
  }

  runStep(): void {
    const nodes = this._nodes;
    if (!nodes) {
      return;
    }

    // currently nodes are executed not in the order of hierarchy, but order of key/creation
    // would need to start with the ones having no input
    // and then continue from there

    Object.entries(nodes).forEach(([key, node]) => {
      node.onExecute(); //hard to send elapsed time
      if (true) {
        node.drawComment();
      }
      node.onAfterExecute();
    });
  }

  createOrUpdateNodeFromCode(code: string): void {
    const {
      functionName,
      doesNodeTypeExist,
    } = this.convertFunctionStringToNode(code);
    console.log('doesNodeTypeExist: ', doesNodeTypeExist);

    // if it exists, then replace all instances
    if (doesNodeTypeExist) {
      // get nodes of this type
      // replace node with new instance
      // move it to right position
      // apply links and values if possible

      const nodes = this._nodes;
      console.log(nodes);
      Object.entries(nodes).forEach(([id, oldNode]) => {
        if (oldNode.type === functionName) {
          console.log('I am of the same type', oldNode);

          const newNode = this.createNode(functionName);
          this.addNode(newNode);
          newNode.configure(oldNode.serialize());
          this.reconnectLinksToNewNode(oldNode, newNode);

          // remove previous node
          this.removeNode(oldNode);
        }
      });
    } else {
      // if it is new, then just create it
      this.createAndAdd(functionName);
    }
  }

  convertFunctionStringToNode(
    code: string
  ): { functionName: string; doesNodeTypeExist: boolean } {
    // remove comments and possible empty line from start
    const cleanCode = strip(code).replace(/^\n/, '');
    console.log(cleanCode);
    const func = new Function('return ' + cleanCode)();
    console.log(func);

    // check if class already exists
    let doesNodeTypeExist = true;
    if (this._registeredNodeTypes[func.name] === undefined) {
      doesNodeTypeExist = false;
    }
    const functionName = this.wrapFunctionAsNode(func);
    return { functionName, doesNodeTypeExist };
  }

  wrapFunctionAsNode(
    // type: string, // node name with namespace (e.g.: 'math/sum')
    func: (...args: any[]) => any,
    param_types?: string[],
    return_type?: string
  ): string {
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
    constructor(type, graph) {
      super(type, graph);
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

    this.registerNodeType(functionName, classobj);
    return functionName;
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

    // add the node to the canvas
    this.nodeContainer.removeChild(node);

    // remove node from graph
    delete this._nodes[node.id];
  }

  deleteSelectedNodes(): void {
    console.log(this.selected_nodes);
    console.log(this._nodes);

    // loop through selected nodes
    this.selected_nodes.forEach((nodeId) => {
      const node = this._nodes[nodeId];

      // deselect node
      node.select(false);

      this.removeNode(node);
    });
    this.deselectAllNodes();
  }
}

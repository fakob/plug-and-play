import * as PIXI from 'pixi.js';
import strip from 'strip-comments';
import { Viewport } from 'pixi-viewport';

import {
  CONNECTION_COLOR_HEX,
  DEFAULT_EDITOR_DATA,
  NODE_WIDTH,
  PP_VERSION,
} from '../utils/constants';
import {
  CustomArgs,
  PPNodeConstructor,
  SerializedGraph,
} from '../utils/interfaces';
import PPNode from './NodeClass';
import Socket from './SocketClass';
import PPLink from './LinkClass';

export default class PPGraph {
  app: PIXI.Application;
  viewport: Viewport;

  lastLinkId: number;

  _links: { [key: number]: PPLink };
  _registeredNodeTypes: Record<string, PPNodeConstructor>;
  customNodeTypes: Record<string, string>;

  _showComments: boolean;
  selectedNodes: string[];
  clickedSocketRef: null | Socket;
  overInputRef: null | Socket;
  dragSourcePoint: null | PIXI.Point;
  movingLink: null | PPLink;
  draggingNodes: boolean;

  tempConnection: PIXI.Graphics;
  tempContainer: PIXI.Container;
  backgroundCanvas: PIXI.Container;
  foregroundCanvas: PIXI.Container;
  commentContainer: PIXI.Container;
  connectionContainer: PIXI.Container;
  nodeContainer: PIXI.Container;

  onSelectionChange: ((selectedNodes: string[]) => void) | null;
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    console.log('Graph created');

    this._showComments = true;
    this.clickedSocketRef = null;
    this.overInputRef = null;
    this.dragSourcePoint = null;
    this.movingLink = null;

    this.tempConnection = new PIXI.Graphics();
    this.tempContainer = new PIXI.Container();
    this.tempContainer.name = 'tempContainer';
    this.backgroundCanvas = new PIXI.Container();
    this.backgroundCanvas.name = 'backgroundCanvas';
    this.connectionContainer = new PIXI.Container();
    this.connectionContainer.name = 'connectionContainer';
    this.nodeContainer = new PIXI.Container();
    this.nodeContainer.name = 'nodeContainer';
    this.foregroundCanvas = new PIXI.Container();
    this.foregroundCanvas.name = 'foregroundCanvas';
    this.commentContainer = new PIXI.Container();
    this.commentContainer.name = 'commentContainer';

    this.viewport.addChild(
      this.backgroundCanvas,
      this.connectionContainer,
      this.tempContainer,
      this.nodeContainer,
      this.foregroundCanvas,
      this.commentContainer
    );
    this.tempContainer.addChild(this.tempConnection);
    this.tempConnection.name = 'tempConnection';

    // add event listeners
    const addEventListeners = (): void => {
      // listen to window resize event and resize app
      const resize = () => {
        viewport.resize(window.innerWidth, window.innerHeight);
        app.renderer.resize(window.innerWidth, window.innerHeight);
      };
      resize();
      window.addEventListener('resize', resize);

      // register key events
      const keysDown = (e: KeyboardEvent): void => {
        console.log(e.key);
        if (e.key === 'Backspace' || e.key === 'Delete') {
          if (
            (e.target as any).dataset.slateEditor === undefined &&
            (e.target as any).localName !== 'NoteInput' &&
            (e.target as any).localName !== 'input' &&
            (e.target as any).localName !== 'textarea'
          ) {
            this.deleteSelectedNodes();
          }
        }
      };
      window.addEventListener('keydown', keysDown);

      // register pointer events
      this.viewport.on('pointerdown', this._onPointerDown.bind(this));
    };
    addEventListeners();

    // clear the stage
    this.clear();
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
    // console.log(node.id);

    if (this.clickedSocketRef !== null) {
      // check if user clicked InputSocket with link to move it
      this.movingLink = this.checkIfSocketIsInputAndHasConnection(
        this.clickedSocketRef
      );
      console.log(this.movingLink);
      if (this.movingLink !== null) {
        this.clickedSocketRef = this.movingLink.getSource();
      }

      // only start drawing if outputsocket or moving link
      if (!this.clickedSocketRef.isInput() || this.movingLink) {
        // event.data.global delivers the mouse coordinates from the top left corner in pixel
        node.interactionData = event.data;

        const dragSourceRect = this.clickedSocketRef.children[0].getBounds();
        const dragSourcePoint = new PIXI.Point(
          dragSourceRect.x + dragSourceRect.width / 2,
          dragSourceRect.y + dragSourceRect.height / 2
        );
        // change dragSourcePoint coordinates from screen to world space
        this.dragSourcePoint = this.viewport.toWorld(dragSourcePoint);
      }
    }

    // subscribe to pointermove
    // first assign the bound function to a handler then add this handler as a listener
    // otherwise removeListener won't work (bind creates a new function)
    this.onViewportMoveHandler = this.onViewportMove.bind(this);
    this.viewport.on('pointermove', this.onViewportMoveHandler);
  }

  onViewportMove(event: PIXI.InteractionEvent): void {
    // console.log('onViewportMove');
    if (this.clickedSocketRef !== null && !this.clickedSocketRef.isInput()) {
      // remove original link
      if (this.movingLink !== null) {
        this.deleteLink(this.movingLink);
        this.movingLink = null;
      }

      // temporarily draw connection while dragging
      const sourcePointX = this.dragSourcePoint.x;
      const sourcePointY = this.dragSourcePoint.y;

      // change mouse coordinates from screen to world space
      let targetPoint = new PIXI.Point();
      if (this.overInputRef !== null) {
        // get target position
        const targetRect = this.overInputRef.children[0].getBounds();
        targetPoint = this.viewport.toWorld(
          new PIXI.Point(
            targetRect.x + targetRect.width / 2,
            targetRect.y + targetRect.height / 2
          )
        );
      } else {
        targetPoint = this.viewport.toWorld(event.data.global);
      }

      // draw curve from 0,0 as PIXI.thisics originates from 0,0
      const toX = targetPoint.x - sourcePointX;
      const toY = targetPoint.y - sourcePointY;
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
    } else {
      this.draggingNodes = true;
    }
  }

  _onNodePointerUpAndUpOutside(event: PIXI.InteractionEvent): void {
    console.log('_onNodePointerUpAndUpOutside');

    // unsubscribe from pointermove
    this.viewport.removeListener('pointermove', this.onViewportMoveHandler);

    if (this !== null) {
      if (this.clickedSocketRef === null) {
        if (!this.draggingNodes && event.target === event.currentTarget) {
          // only select if this was not a drag action
          // and the element that triggered the event (target) is the same as
          // the element that the event listener is attached to (currentTarget)
          this.selectNode(event.currentTarget as PPNode);
        }
      } else {
        // check if over input
        console.log(this.overInputRef);
        if (this.overInputRef !== null && !this.clickedSocketRef.isInput()) {
          console.log(
            'connecting Output:',
            this.clickedSocketRef.name,
            'of',
            this.clickedSocketRef.parent.name,
            'with Input:',
            this.overInputRef.name,
            'of',
            this.overInputRef.parent.name
          );
          this.connect(this.clickedSocketRef, this.overInputRef, this.viewport);
        }
      }
    }
    this.tempConnection.clear();
    this.clickedSocketRef = null;
    this.overInputRef = null;
    this.movingLink = null;
    this.draggingNodes = false;
  }

  // GETTERS & SETTERS

  get registeredNodeTypes(): Record<string, PPNodeConstructor> {
    return this._registeredNodeTypes;
  }

  get nodes(): PPNode[] {
    return this.nodeContainer.children as PPNode[];
  }

  set showComments(value: boolean) {
    this._showComments = value;
    this.commentContainer.visible = value;
  }
  // METHODS

  getNodeById(id: string): PPNode {
    return this.nodes.find((node) => node.id === id);
  }

  registerNodeType(type: string, nodeConstructor: PPNodeConstructor): void {
    nodeConstructor.type = type;
    // console.log('Node registered: ' + type);
    // console.log(this._registeredNodeTypes);

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

  createNode<T extends PPNode = PPNode>(
    type: string,
    customArgs?: CustomArgs
  ): T {
    // console.log(this._registeredNodeTypes);
    const nodeConstructor = this._registeredNodeTypes[type];
    if (!nodeConstructor) {
      console.log(
        'GraphNode type "' + type + '" not registered. Will create new one.'
      );
      this.createOrUpdateNodeFromCode(DEFAULT_EDITOR_DATA, type);
      return null;
    }

    const title = type;
    console.log(this.viewport.center.x - NODE_WIDTH / 2);
    // console.log(nodeConstructor);
    const node = new nodeConstructor(title, this, {
      ...customArgs,
      nodePosX: this.viewport.center.x - NODE_WIDTH / 2,
      nodePosY: this.viewport.center.y,
    }) as T;
    return node;
  }

  addNode<T extends PPNode = PPNode>(node: T): T {
    if (!node) {
      return;
    }

    node
      .on('pointerdown', this._onNodePointerDown.bind(this))
      .on('pointerupoutside', this._onNodePointerUpAndUpOutside.bind(this))
      .on('pointerup', this._onNodePointerUpAndUpOutside.bind(this));

    // add the node to the canvas
    this.nodeContainer.addChild(node);

    // set comment position
    node.updateCommentPosition();

    return node; //to chain actions
  }

  createAndAddNode<T extends PPNode = PPNode>(
    type: string,
    customArgs?: CustomArgs
  ): T {
    // console.log(customArgs);
    const node = this.createNode(type, customArgs) as T;
    // if (node) {
    this.addNode(node);
    console.log(node);
    return node;
    // }
  }

  connect(output: Socket, input: Socket, viewport: Viewport): PPLink {
    // check if this input already has a connection
    this.checkIfSocketHasConnectionAndDeleteIt(input, true);

    let link = null;

    //create link class
    link = new PPLink(
      (this.lastLinkId += 1),
      input.dataType,
      output,
      input,
      viewport
    );

    //add to graph links list
    this._links[link.id] = link;

    //add link to output
    output.links.push(link);

    //add link to input
    input.links = [link];

    this.connectionContainer.addChild(link);

    // send notification pulse
    link.notifyChange(new Set());

    return link;
  }

  checkOldSocketAndUpdateIt<T extends Socket>(
    oldSocket: T,
    newSocket: T,
    isInput: boolean
  ): boolean {
    // check if this socket already has a connection
    Object.entries(this._links).forEach(([key, link]) => {
      if (isInput ? link.target === oldSocket : link.source === oldSocket) {
        console.log('updating link:', isInput ? link.target : link.source);

        if (isInput) {
          link.updateTarget(newSocket);
          newSocket.links = [link];
        } else {
          link.updateSource(newSocket);
          newSocket.links.push(link);
        }
        return true;
      }
    });
    return false;
  }

  checkIfSocketIsInputAndHasConnection(socket: Socket): PPLink | null {
    // check if this socket is an input and has a connection
    if (socket.isInput()) {
      const foundLink = Object.values(this._links).find(
        (link) => link.target === socket
      );
      return foundLink === undefined ? null : foundLink;
    }
    return null;
  }

  checkIfSocketHasConnectionAndDeleteIt(
    socket: Socket,
    isInput: boolean
  ): void {
    // check if this socket already has a connection
    Object.values(this._links).forEach((link) => {
      if (isInput ? link.target === socket : link.source === socket) {
        console.log('deleting link:', isInput ? link.target : link.source);
        this.deleteLink(link);
      }
    });
  }

  deleteLink(link: PPLink): boolean {
    // remove link from source and target socket
    link.getTarget().removeLink();
    link.getSource().removeLink(link);

    // remove link from graph
    this.connectionContainer.removeChild(this._links[link.id]);
    return delete this._links[link.id];
  }

  clear(): void {
    this.lastLinkId = 0;

    // remove all links
    this.connectionContainer.removeChildren();
    this._links = {};

    // remove all nodes from container
    this.nodeContainer.removeChildren();

    // clearn back and foreground canvas
    this.backgroundCanvas.removeChildren();
    this.foregroundCanvas.removeChildren();

    // clearn comment canvas
    this.commentContainer.removeChildren();

    // remove selected nodes
    this.deselectAllNodes();

    // remove custom node types
    this.customNodeTypes = {};
  }

  selectNode(node: PPNode): void {
    this.deselectAllNodes();
    if (node === null) {
    } else {
      node.select(true);
      this.selectedNodes = [node.id];

      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedNodes);
      }
    }
  }

  deselectAllNodes(): void {
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

  duplicateSelection(): string[] {
    const arrayOfNewIds: string[] = [];
    this.selectedNodes.forEach((id) => {
      const node = this.getNodeById(id);
      const nodeType = node.type;

      // add node and carry over its configuration
      const newNode = this.createAndAddNode(nodeType);
      newNode.configure(node.serialize());

      // offset duplicated node
      newNode.setPosition(32, 32, true);

      // select newNode
      this.selectNode(newNode);

      arrayOfNewIds.push(newNode.id);
    });
    return arrayOfNewIds;
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
        const serializedNode = nodes[i]; //stored info
        const node = this.createAndAddNode(serializedNode.type, {
          customId: serializedNode.id,
        });
        if (!node) {
          error = true;
          console.log('Node not found or has errors: ' + serializedNode.type);
        }
        console.log(serializedNode);
        node.configure(serializedNode);
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
        // console.log(outputRef, inputRef);
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
  ): Socket | undefined {
    const sourceNode = this.getNodeById(sourceNodeId);
    if (sourceNode !== undefined) {
      const sourceSocket = sourceNode.outputSocketArray[sourceSocketIndex];
      return sourceSocket;
    }
  }

  getInputRef(
    targetNodeId: string,
    targetSocketIndex: number
  ): Socket | undefined {
    const targetNode = this.getNodeById(targetNodeId);
    if (targetNode !== undefined) {
      const targetSocket = targetNode.inputSocketArray[targetSocketIndex];
      return targetSocket;
    }
  }

  runStep(): void {
    // can we get rid of this function entirely???
    const nodes = this.nodes;
    if (!nodes) {
      return;
    }

    // currently nodes are executed not in the order of hierarchy, but order of key/creation
    // would need to start with the ones having no input
    // and then continue from there

    Object.entries(nodes).forEach(([key, node]) => {
      try {
        node.execute(new Set());
      } catch (error) {
        console.error('Error onExecute', error);
      }
    });
  }

  createOrUpdateNodeFromCode(
    code: string,
    newDefaultFunctionName?: string
  ): void {
    let newCode = code;
    if (newDefaultFunctionName) {
      newCode = code.replace('customFunctionNode', newDefaultFunctionName);
    }
    const functionName = this.registerCustomNodeType(newCode);
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
    this.customNodeTypes[functionName] = newCode;
  }

  convertStringToFunction(code: string): (...args: any[]) => any {
    // remove comments and possible empty line from start
    const cleanCode = strip(code).replaceAll(/^\s*\n/gm, '');
    // console.log(cleanCode);
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
    // console.log(names);
    code += `
      this.addOutput('out', '${return_type ? return_type : 0}');\n`;
    for (let i = 0; i < names.length; ++i) {
      code += `
      this.addInput('${names[i]}', '${
        param_types && param_types[i] ? param_types[i] : 0
      }');`;
    }
    // console.log(code);
    // console.log(this);
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
    // console.log(classobj);
    (classobj as any).description = 'Generated from ' + func.name;
    (classobj as any).prototype.onExecute = function onExecute() {
      for (let i = 0; i < params.length; ++i) {
        params[i] = this.getInputDataBySlot(i);
      }
      const r = func.apply(this, params);
      this.setOutputData('out', r);
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
    // console.log(parameterArray);
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

    node.destroy();
  }

  deleteSelectedNodes(): void {
    console.log(this.selectedNodes);
    // console.log(this.nodes);

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

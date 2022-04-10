/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import strip from 'strip-comments';
import { Viewport } from 'pixi-viewport';

import {
  DEFAULT_EDITOR_DATA,
  NODE_WIDTH,
  PP_VERSION,
  SOCKET_TYPE,
} from '../utils/constants';
import {
  CustomArgs,
  PPNodeConstructor,
  RegisteredNodeTypes,
  SerializedGraph,
  SerializedLink,
  SerializedSelection,
  TSocketType,
} from '../utils/interfaces';
import { ensureVisible, getInfoFromRegisteredNode } from '../utils/utils';
import PPNode from './NodeClass';
import Socket from './SocketClass';
import PPLink from './LinkClass';
import PPSelection from './SelectionClass';

export default class PPGraph {
  app: PIXI.Application;
  viewport: Viewport;

  lastLinkId: number;

  _links: { [key: number]: PPLink };
  _registeredNodeTypes: RegisteredNodeTypes;
  customNodeTypes: Record<string, string>;

  _showComments: boolean;
  selectedSourceSocket: null | Socket;
  lastSelectedSocketWasInput = false;
  overInputRef: null | Socket;
  dragSourcePoint: PIXI.Point;

  backgroundTempContainer: PIXI.Container;
  backgroundCanvas: PIXI.Container;
  connectionContainer: PIXI.Container;
  nodeContainer: PIXI.Container;
  nodes: { [key: string]: PPNode }; //<string, PPNode>;
  foregroundCanvas: PIXI.Container;

  tempConnection: PIXI.Graphics;
  selection: PPSelection;

  ticking: boolean;

  stateData: { string: any }; // states
  stateSubscriptionNodes: { string: Set<string> }; // every specific string has specific nodes subscribing to it

  onRightClick: (
    event: PIXI.InteractionEvent,
    target: PIXI.DisplayObject
  ) => void = () => {}; // called when the graph is right clicked
  onOpenNodeSearch: (pos: PIXI.Point) => void = () => {}; // called node search should be openend
  onOpenSocketInspector: (pos: PIXI.Point, data: Socket) => void = () => {}; // called when socket inspector should be opened
  onCloseSocketInspector: () => void; // called when socket inspector should be closed
  onViewportDragging: (isDraggingViewport: boolean) => void = () => {}; // called when the viewport is being dragged

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    console.log('Graph created');

    this._showComments = true;
    this.selectedSourceSocket = null;

    this.backgroundTempContainer = new PIXI.Container();
    this.backgroundTempContainer.name = 'backgroundTempContainer';
    this.backgroundCanvas = new PIXI.Container();
    this.backgroundCanvas.name = 'backgroundCanvas';
    this.connectionContainer = new PIXI.Container();
    this.connectionContainer.name = 'connectionContainer';
    this.nodeContainer = new PIXI.Container();
    this.nodeContainer.name = 'nodeContainer';
    this.foregroundCanvas = new PIXI.Container();
    this.foregroundCanvas.name = 'foregroundCanvas';
    this.nodes = {};
    this.ticking = false;

    this.viewport.addChild(
      this.backgroundCanvas,
      this.backgroundTempContainer,
      this.connectionContainer,
      this.nodeContainer,
      this.foregroundCanvas
    );

    this.tempConnection = new PIXI.Graphics();
    this.tempConnection.name = 'tempConnection';
    this.backgroundTempContainer.addChild(this.tempConnection);

    this.selection = new PPSelection(this.viewport, () =>
      Object.values(this.nodes)
    );
    this.app.stage.addChild(this.selection);

    this.viewport.cursor = 'default';

    // add event listeners
    // listen to window resize event and resize app
    const resize = () => {
      viewport.resize(window.innerWidth, window.innerHeight);
      app.renderer.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    // register pointer events
    this.viewport.on('pointerdown', this._onPointerDown.bind(this));
    this.viewport.on(
      'pointerupoutside',
      this._onPointerUpAndUpOutside.bind(this)
    );
    this.viewport.on('pointerup', this._onPointerUpAndUpOutside.bind(this));
    this.viewport.on('rightclick', this._onPointerRightClicked.bind(this));
    this.viewport.on('dblclick', this._onPointerDoubleClicked.bind(this));
    this.viewport.on('pointermove', (event) => this.onViewportMove(event));

    // clear the stage
    this.clear();
    this._registeredNodeTypes = {};

    // define callbacks
    this.onViewportDragging = (isDraggingViewport: boolean) => {};
  }

  // SETUP
  _onPointerRightClicked(event: PIXI.InteractionEvent): void {
    console.log('GraphClass - _onPointerRightClicked');
    event.stopPropagation();
    const target = event.target;
    console.log(target, event.data.originalEvent);
    if (
      // only trigger right click if viewport was not dragged
      this.dragSourcePoint === undefined ||
      (this.dragSourcePoint.x === this.viewport.x &&
        this.dragSourcePoint.y === this.viewport.y)
    ) {
      this.onRightClick(event, target);
    }
  }

  _onPointerDoubleClicked(event: PIXI.InteractionEvent): void {
    console.log('_onPointerDoubleClicked');
    event.stopPropagation();
    const target = event.target;
    if (target instanceof Viewport) {
      this.onOpenNodeSearch(event.data.global);
    }
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    console.log('_onPointerDown');
    event.stopPropagation();

    this.onCloseSocketInspector();

    if ((event.data.originalEvent as PointerEvent).button === 0) {
      this.selection.drawSelectionStart(
        event,
        event.data.originalEvent.shiftKey
      );

      // pause viewport drag
      this.viewport.plugins.pause('drag');
    } else {
      this.viewport.cursor = 'grabbing';
      this.dragSourcePoint = new PIXI.Point(this.viewport.x, this.viewport.y);
      this.onViewportDragging(true);
    }
  }

  _onPointerUpAndUpOutside(event: PIXI.InteractionEvent): void {
    if (!this.overInputRef && this.selectedSourceSocket) {
      if (this.lastSelectedSocketWasInput) {
        this.selectedSourceSocket = null;
      } else {
        this.onOpenNodeSearch(event.data.global);
      }
    }
    console.log('_onPointerUpAndUpOutside');
    // check if viewport has been dragged,
    // if not, this is a deselect all nodes action
    if (this.dragSourcePoint !== undefined) {
      if (
        this.dragSourcePoint.x === this.viewport.x &&
        this.dragSourcePoint.y === this.viewport.y
      ) {
        console.log('deselectAllNodesAndResetSelection');
        this.selection.deselectAllNodesAndResetSelection();

        this.onCloseSocketInspector();
      }
    }
    if (this.selection.isDrawingSelection) {
      this.selection.drawSelectionFinish(event);
    }

    this.viewport.cursor = 'default';
    this.viewport.plugins.resume('drag');
    this.dragSourcePoint = undefined;
    this.onViewportDragging(false);
  }

  getObjectCenter(object: any): PIXI.Point {
    const dragSourceRect = object.children[0].getBounds();
    const dragSourcePoint = new PIXI.Point(
      dragSourceRect.x + dragSourceRect.width / 2,
      dragSourceRect.y + dragSourceRect.height / 2
    );
    // change dragSourcePoint coordinates from screen to world space
    return this.viewport.toWorld(dragSourcePoint);
  }

  _onNodePointerDown(event: PIXI.InteractionEvent): void {
    event.stopPropagation();
    this.viewport.plugins.pause('drag');
  }

  onViewportMove(event: PIXI.InteractionEvent): void {
    this.tempConnection.clear();

    // draw connection
    if (this.selectedSourceSocket) {
      // draw connection while dragging
      let socketCenter = this.getObjectCenter(this.selectedSourceSocket);

      // change mouse coordinates from screen to world space
      let targetPoint = new PIXI.Point();
      if (this.overInputRef) {
        // get target position
        targetPoint = this.getObjectCenter(this.overInputRef);
      } else {
        targetPoint = this.viewport.toWorld(event.data.global);
      }

      // swap points if i grabbed an input, to make curve look nice
      if (this.selectedSourceSocket.socketType === SOCKET_TYPE.IN) {
        const temp: PIXI.Point = targetPoint;
        targetPoint = socketCenter;
        socketCenter = temp;
      }

      const sourcePointX = socketCenter.x;
      const sourcePointY = socketCenter.y;
      // draw curve from 0,0 as PIXI.thisics originates from 0,0
      const toX = targetPoint.x - sourcePointX;
      const toY = targetPoint.y - sourcePointY;
      const cpX = Math.abs(toX) / 2;
      const cpY = 0;
      const cpX2 = toX - cpX;
      const cpY2 = toY;
      // console.log(sourcePointX, toX);

      this.tempConnection.lineStyle(
        2,
        this.selectedSourceSocket.dataType.getColor().multiply(0.9).hexNumber(),
        1
      );
      this.tempConnection.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

      // offset curve to start from source
      this.tempConnection.x = sourcePointX;
      this.tempConnection.y = sourcePointY;
    }
  }

  socketHoverOver(socket: Socket): void {
    this.overInputRef = socket;
  }

  socketHoverOut(socket: Socket): void {
    this.overInputRef = null;
  }

  socketMouseDown(socket: Socket, event: PIXI.InteractionEvent): void {
    if (event.data.button === 2) {
      socket.links.forEach((link) => link.delete());
    } else if (socket.socketType === SOCKET_TYPE.OUT) {
      this.selectedSourceSocket = socket;
      this.lastSelectedSocketWasInput = false;
    } else {
      // if input socket selected, either make a new link from here backwards or re-link old existing link
      this.lastSelectedSocketWasInput = true;
      const hasLink = socket.links.length > 0;
      if (hasLink) {
        this.selectedSourceSocket = socket.links[0].getSource();
        socket.links.forEach((link) => link.delete());
        this.onViewportMove(event);
        this.selectedSourceSocket.getNode().outputUnplugged();
      } else {
        this.selectedSourceSocket = socket;
      }
    }
  }

  async socketMouseUp(
    socket: Socket,
    event: PIXI.InteractionEvent
  ): Promise<void> {
    const source = this.selectedSourceSocket;
    this.selectedSourceSocket = null;
    if (socket !== this.selectedSourceSocket) {
      if (
        source.socketType === SOCKET_TYPE.IN &&
        socket.socketType === SOCKET_TYPE.OUT
      ) {
        await this.connect(socket, source);
      } else if (
        source.socketType === SOCKET_TYPE.OUT &&
        socket.socketType === SOCKET_TYPE.IN
      ) {
        await this.connect(source, socket);
      }
    }
  }

  async socketNameRefMouseDown(
    socket: Socket,
    event: PIXI.InteractionEvent
  ): Promise<void> {
    const clickedSourcePoint = new PIXI.Point(
      event.data.global.x,
      event.data.global.y
    );
    this.onOpenSocketInspector(clickedSourcePoint, socket);
  }

  // GETTERS & SETTERS

  get registeredNodeTypes(): RegisteredNodeTypes {
    return this._registeredNodeTypes;
  }

  set showComments(value: boolean) {
    this._showComments = value;
    Object.values(this.nodes).forEach((node) => node.drawNodeShape());
  }

  // METHODS

  clearTempConnection(): void {
    this.tempConnection.clear();
    this.dragSourcePoint = undefined;
  }

  getNodeById(id: string): PPNode {
    return this.nodes[id];
  }

  registerNodeType(type: string, nodeConstructor: PPNodeConstructor): void {
    nodeConstructor.type = type;
    // console.log('Node registered: ' + type);
    // console.log(this._registeredNodeTypes);

    // create/update node type
    const nodeInfo = getInfoFromRegisteredNode(this, type, nodeConstructor);
    this._registeredNodeTypes[type] = {
      constructor: nodeConstructor,
      name: nodeInfo.name,
      description: nodeInfo.description,
      hasInputs: nodeInfo.hasInputs,
    };
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
    const nodeConstructor = this._registeredNodeTypes[type]?.constructor;
    if (!nodeConstructor) {
      console.log(
        'GraphNode type "' + type + '" not registered. Will create new one.'
      );
      this.createOrUpdateNodeFromCode(DEFAULT_EDITOR_DATA, type, customArgs);
      return null;
    }

    const title = type;
    // console.log(nodeConstructor);
    const node = new nodeConstructor(title, this, {
      ...customArgs,
      nodePosX: customArgs?.nodePosX ?? this.viewport.center.x - NODE_WIDTH / 2,
      nodePosY: customArgs?.nodePosY ?? this.viewport.center.y,
    }) as T;
    return node;
  }

  addNode<T extends PPNode = PPNode>(node: T): T {
    if (!node) {
      return;
    }

    // add the node to the canvas
    this.nodes[node.id] = node;
    this.nodeContainer.addChild(node);

    return node; //to chain actions
  }

  createAndAddNode<T extends PPNode = PPNode>(
    type: string,
    customArgs?: CustomArgs,
    notify = true
  ): T {
    const node = this.createNode(type, customArgs) as T;
    // if (node) {
    this.addNode(node);

    if (customArgs?.addLink) {
      if (node.inputSocketArray.length > 0 && !customArgs.addLink.isInput()) {
        console.log(
          'connecting Output:',
          customArgs.addLink.name,
          'of',
          customArgs.addLink.parent.name,
          'with Input:',
          node.inputSocketArray[0].name,
          'of',
          node.inputSocketArray[0].parent.name
        );
        this.connect(customArgs.addLink, node.inputSocketArray[0], notify);
        this.clearTempConnection();
      }
    }
    node.onNodeAdded();

    return node;
    // }
  }

  async connect(output: Socket, input: Socket, notify = true): Promise<PPLink> {
    // remove all input links from before on this socket
    input.links.forEach((link) => link.delete());

    //create link class
    const link: PPLink = new PPLink(++this.lastLinkId, output, input);

    //add to graph links list
    this._links[link.id] = link;

    //add link to output
    output.links.push(link);

    //add link to input
    input.links = [link];

    this.connectionContainer.addChild(link);

    // send notification pulse
    if (notify) {
      await link.getSource().getNode().outputPlugged();
      await link.getTarget().getNode().executeOptimizedChain();
    }

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

  clear(): void {
    this.lastLinkId = 0;

    // remove all links
    this.connectionContainer.removeChildren();
    this._links = {};

    // remove all nodes from container
    this.nodes = {};
    this.nodeContainer.removeChildren();

    // clearn back and foreground canvas
    this.backgroundCanvas.removeChildren();
    this.foregroundCanvas.removeChildren();

    // remove selected nodes
    this.selection.deselectAllNodesAndResetSelection();

    // remove custom node types
    this.customNodeTypes = {};
  }

  async duplicateSelection(): Promise<PPNode[]> {
    const serializeSelection = this.serializeSelection();
    const pastedNodes = await this.pasteNodes(serializeSelection);
    return pastedNodes;
  }

  async pasteNodes(
    data: SerializedSelection,
    pasteToCenter = false
  ): Promise<PPNode[]> {
    const newNodes: PPNode[] = [];
    const mappingOfOldAndNewNodes: { [key: string]: PPNode } = {};

    //create nodes
    const offset = new PIXI.Point();
    try {
      data.nodes.forEach((node, index) => {
        if (index === 0) {
          if (pasteToCenter) {
            // calculate offset from first node to viewport center
            offset.set(
              this.viewport.center.x - node.x,
              this.viewport.center.y - node.y
            );
          } else {
            offset.set(node.width + 40, 0);
          }
        }
        const nodeType = node.type;
        // add node and carry over its con,figuration
        const newNode = this.createAndAddNode(nodeType);
        newNode.configure(node);
        newNode.executeOptimizedChain();

        // offset pasted node
        newNode.setPosition(offset.x, offset.y, true);

        mappingOfOldAndNewNodes[node.id] = newNode;
        newNodes.push(newNode);
      });

      await Promise.all(
        data.links.map(async (link: SerializedLink) => {
          const newSource = mappingOfOldAndNewNodes[
            link.sourceNodeId
          ].getOutputSocketByName(link.sourceSocketName);
          const newTarget = mappingOfOldAndNewNodes[
            link.targetNodeId
          ].getInputSocketByName(link.targetSocketName);
          await this.connect(newSource, newTarget, false);
        })
      );
    } catch (error) {
      console.error(error);
    }

    // select newNode
    this.selection.selectNodes(newNodes);
    this.selection.drawRectanglesFromSelection();

    ensureVisible(this);

    return newNodes;
  }

  getCanAddInput(): boolean {
    return !this.selection.selectedNodes.find((node) => !node.getCanAddInput());
  }

  addInput(): void {
    this.selection.selectedNodes
      .filter((node) => node.getCanAddInput())
      .forEach((node) => node.addDefaultInput());
  }

  getCanAddOutput(): boolean {
    return !this.selection.selectedNodes.find(
      (node) => !node.getCanAddOutput()
    );
  }
  addOutput(): void {
    this.selection.selectedNodes
      .filter((node) => node.getCanAddOutput())
      .forEach((node) => node.addDefaultOutput());
  }

  serialize(): SerializedGraph {
    // get serialized nodes
    const nodesSerialized = Object.values(this.nodes).map((node) =>
      node.serialize()
    );

    // get serialized links
    const linksSerialized = Object.values(this._links).map((link) =>
      link.serialize()
    );

    const data = {
      version: PP_VERSION,
      graphSettings: {
        viewportCenterPosition: this.viewport.center,
        viewportScale: this.viewport.scale.x,
      },
      nodes: nodesSerialized,
      links: linksSerialized,
      customNodeTypes: this.customNodeTypes,
    };

    return data;
  }

  serializeSelection(): SerializedSelection {
    const linksContainedInSelection: PPLink[] = [];

    this.selection.selectedNodes.forEach((node) => {
      // get links which are completely contained in selection
      node.inputSocketArray.forEach((socket) => {
        if (socket.hasLink()) {
          const connectedNode = socket.links[0].source.parent as PPNode;
          if (this.selection.selectedNodes.includes(connectedNode)) {
            linksContainedInSelection.push(socket.links[0]);
          }
        }
      });
      console.log(linksContainedInSelection);
    });

    // get serialized nodes
    const nodesSerialized = this.selection.selectedNodes.map((node) =>
      node.serialize()
    );

    // get serialized links
    const linksSerialized = linksContainedInSelection.map((link) =>
      link.serialize()
    );

    const data = {
      version: PP_VERSION,
      nodes: nodesSerialized,
      links: linksSerialized,
      customNodeTypes: this.customNodeTypes,
    };

    return data;
  }

  async configure(data: SerializedGraph, keep_old?: boolean): Promise<boolean> {
    this.ticking = false;
    if (!data) {
      return;
    }

    if (!keep_old) {
      this.clear();
    }

    let configureError = false;

    // register custom node types only
    // standard nodes types are already registered on load
    console.log('standard node types: ', this._registeredNodeTypes);
    Object.values(data.customNodeTypes).forEach((value) => {
      this.registerCustomNodeType(value);
    });

    // store customNodeTypes
    this.customNodeTypes = data.customNodeTypes;

    // position and scale viewport
    const newX = data.graphSettings.viewportCenterPosition.x ?? 0;
    const newY = data.graphSettings.viewportCenterPosition.y ?? 0;
    this.viewport.animate({
      position: new PIXI.Point(newX, newY),
      scale: data.graphSettings.viewportScale ?? 1,
      ease: 'easeOutExpo',
      time: 750,
    });

    //create nodes
    try {
      data.nodes.forEach((node) => {
        this.createAndAddNode(
          node.type,
          {
            customId: node.id,
          },
          false
        ).configure(node);
      });

      await Promise.all(
        data.links.map(async (link) => {
          const outputRef = this.getSocket(
            link.sourceNodeId,
            link.sourceSocketName,
            SOCKET_TYPE.OUT
          );
          const inputRef = this.getSocket(
            link.targetNodeId,
            link.targetSocketName,
            SOCKET_TYPE.IN
          );
          await this.connect(outputRef, inputRef, false);
        })
      );
    } catch (error) {
      configureError = error;
    }

    // execute all seed nodes to make sure there are values everywhere
    await PPNode.executeOptimizedChainBatch(
      Object.values(this.nodes).filter((node) => !node.getHasDependencies())
    );
    this.ticking = true;

    return configureError;
  }

  getSocket(nodeID: string, socketName: string, type: TSocketType): Socket {
    const node = this.getNodeById(nodeID);
    if (node) {
      return type === SOCKET_TYPE.IN
        ? node.getInputSocketByName(socketName)
        : node.getOutputSocketByName(socketName);
    }
    return undefined;
  }

  tick(currentTime: number, deltaTime: number): void {
    if (this.ticking) {
      Object.values(this.nodes).forEach((node) =>
        node.tick(currentTime, deltaTime)
      );
    }
  }

  createOrUpdateNodeFromCode(
    code: string,
    newDefaultFunctionName?: string,
    customArgs?: CustomArgs
  ): void {
    let newCode = code;
    if (newDefaultFunctionName) {
      newCode = code.replace('customFunctionNode', newDefaultFunctionName);
    }
    const functionName = this.registerCustomNodeType(newCode);
    const isNodeTypeRegistered = this.checkIfFunctionIsRegistered(functionName);
    console.log('isNodeTypeRegistered: ', isNodeTypeRegistered);

    const nodesWithTheSameType = Object.values(this.nodes).filter(
      (node) => node.type === functionName
    );

    // store function code string on graph
    this.customNodeTypes[functionName] = newCode;

    // do nodes of the same type exist on the graph
    if (nodesWithTheSameType.length > 0) {
      nodesWithTheSameType.forEach(async (node) => {
        console.log('I am of the same type', node);

        const newNode = await this.createAndAddNode(functionName);

        newNode.configure(node.serialize());
        this.reconnectLinksToNewNode(node, newNode);

        // if the old node was selected, select the new one instead
        if (this.selection.selectedNodes.includes(node)) {
          this.selection.selectNodes([newNode]);
        }

        // remove previous node
        this.removeNode(node);
      });
    } else {
      // canvas is empty and node does not yet exist on graph
      this.createAndAddNode(functionName, customArgs);
    }
  }

  isCustomNode(node: PPNode): boolean {
    if (node) {
      return this.customNodeTypes[node.type] !== undefined;
    }
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
    node.destroy();
    delete this.nodes[node.id];
  }

  deleteSelectedNodes(): void {
    const storedSelection = this.selection.selectedNodes;
    console.log(storedSelection);
    this.selection.deselectAllNodesAndResetSelection();
    storedSelection.forEach((node) => this.removeNode(node));
  }

  setState(key: string, data: any): void {
    this.stateData[key] = data;
    const subscribers = this.stateSubscriptionNodes[key];
    if (subscribers) {
      subscribers.forEach((subID: string) =>
        this.nodes[subID].executeOptimizedChain()
      );
    }
  }

  getState(key: string, data: any): void {
    return this.stateData[key];
  }

  subscribeToState(key: string, nodeID: string): void {
    if (this.stateSubscriptionNodes[key] === undefined) {
      this.stateSubscriptionNodes[key] = new Set();
    }
    this.stateSubscriptionNodes[key].push(nodeID);
  }
  unsubscribeToState(key: string, nodeID: string): void {
    this.stateSubscriptionNodes[key] = this.stateSubscriptionNodes[key].filter(
      (id: string) => id !== nodeID
    );
  }
  unsubscribeToAll(nodeID: string): void {
    Object.values(this.stateSubscriptionNodes).forEach((value) =>
      value.delete(nodeID)
    );
  }
}

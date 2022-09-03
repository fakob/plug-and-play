/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { OptionsObject, SnackbarMessage } from 'notistack';
import { NODE_WIDTH, PP_VERSION, SOCKET_TYPE } from '../utils/constants';
import {
  CustomArgs,
  SerializedGraph,
  SerializedLink,
  SerializedSelection,
  TSocketType,
} from '../utils/interfaces';
import { ensureVisible } from '../utils/utils';
import PPNode from './NodeClass';
import PPSocket from './SocketClass';
import PPLink from './LinkClass';
import PPSelection from './SelectionClass';
import { getAllNodeTypes } from '../nodes/allNodes';
import { macroOutputName } from '../nodes/macro/macro';

export default class PPGraph {
  static currentGraph: PPGraph;
  app: PIXI.Application;
  viewport: Viewport;

  _links: { [key: number]: PPLink };

  _showComments: boolean;
  _showExecutionVisualisation: boolean;
  selectedSourceSocket: null | PPSocket;
  lastSelectedSocketWasInput = false;
  overrideNodeCursorPosition: null | PIXI.Point = null;
  overInputRef: null | PPSocket;
  dragSourcePoint: PIXI.Point;

  backgroundTempContainer: PIXI.Container;
  backgroundCanvas: PIXI.Container;
  connectionContainer: PIXI.Container;
  nodeContainer: PIXI.Container;
  nodes: { [key: string]: PPNode } = {};
  macrosIn: { [key: string]: PPNode } = {};
  macrosOut: { [key: string]: PPNode } = {};
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
  onOpenSocketInspector: (pos: PIXI.Point, data: PPSocket) => void = () => {}; // called when socket inspector should be opened
  onCloseSocketInspector: () => void; // called when socket inspector should be closed
  onViewportDragging: (isDraggingViewport: boolean) => void = () => {}; // called when the viewport is being dragged
  onShowSnackbar: (message: SnackbarMessage, options?: OptionsObject) => void;

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    console.log('Graph created');

    this._showComments = true;
    this._showExecutionVisualisation = true;
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

    // define callbacks
    this.onViewportDragging = (isDraggingViewport: boolean) => {};
    PPGraph.currentGraph = this;
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
      if (!this.overInputRef) {
        this.selection.drawSelectionStart(
          event,
          event.data.originalEvent.shiftKey
        );
      }

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
        if (!this.overrideNodeCursorPosition) {
          this.overrideNodeCursorPosition = this.viewport.toWorld(
            event.data.global
          );
        }
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

  getSocketCenter(object: PPSocket): PIXI.Point {
    const dragSourceRect = object.socketRef.getBounds();
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
      let socketCenter = this.getSocketCenter(this.selectedSourceSocket);

      // change mouse coordinates from screen to world space
      let targetPoint = new PIXI.Point();
      if (this.overInputRef) {
        // get target position
        targetPoint = this.getSocketCenter(this.overInputRef);
      } else if (this.overrideNodeCursorPosition) {
        targetPoint = this.overrideNodeCursorPosition;
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

  socketHoverOver(socket: PPSocket): void {
    this.overInputRef = socket;
  }

  socketHoverOut(socket: PPSocket): void {
    this.overInputRef = null;
  }

  socketMouseDown(socket: PPSocket, event: PIXI.InteractionEvent): void {
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
    socket: PPSocket,
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
    socket: PPSocket,
    event: PIXI.InteractionEvent
  ): Promise<void> {
    const clickedSourcePoint = new PIXI.Point(
      event.data.global.x,
      event.data.global.y
    );
    this.onOpenSocketInspector(clickedSourcePoint, socket);
  }

  // GETTERS & SETTERS

  set showComments(value: boolean) {
    this._showComments = value;
    Object.values(this.nodes).forEach((node) => node.drawNodeShape());
  }

  get showExecutionVisualisation(): boolean {
    return this._showExecutionVisualisation;
  }

  set showExecutionVisualisation(value: boolean) {
    this._showExecutionVisualisation = value;
  }

  // METHODS

  clearTempConnection(): void {
    this.tempConnection.clear();
    this.dragSourcePoint = undefined;
  }

  getNodeById(id: string): PPNode {
    return this.nodes[id];
  }

  createNode<T extends PPNode = PPNode>(
    type: string,
    customArgs?: CustomArgs
  ): T {
    // console.log(this._registeredNodeTypes);
    const newArgs: any = {};
    const placeholderNode = 'Placeholder';
    let nodeConstructor;
    let name;

    if (type === placeholderNode) {
      // placeholder nodes use the name field to indicate which node they are a placeholder for
      // check if the replaced node exists now
      name = customArgs?.name ?? type;
      nodeConstructor = getAllNodeTypes()[name]?.constructor;
      if (customArgs?.name !== undefined && nodeConstructor) {
        this.onShowSnackbar(
          `A replacement for the placeholder node ${customArgs?.customId} was found. It will be replaced with ${name}.`,
          {
            variant: 'success',
          }
        );
      } else {
        this.onShowSnackbar(
          `No replacement for the placeholder node ${customArgs?.customId} was found.`
        );
      }
    } else {
      name = type;
      nodeConstructor = getAllNodeTypes()[type]?.constructor;
    }

    if (!nodeConstructor) {
      // if there is no node of this type, create a placeholder node instead
      // and "save" the original node type in the placeholders name
      const errorMessage = `Node of type ${type}(${customArgs?.customId}) is missing. A placeholder node will be created instead`;
      console.warn(errorMessage);
      this.onShowSnackbar(errorMessage, {
        variant: 'warning',
      });
      name = type;
      nodeConstructor = getAllNodeTypes()['Placeholder']?.constructor;
      newArgs.name = type;
    }

    const node = new nodeConstructor(name, {
      ...customArgs,
      ...newArgs,
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
    this.addNode(node);

    if (customArgs?.addLink) {
      if (!customArgs.addLink.isInput() && node.inputSocketArray.length > 0) {
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
      } else if (
        customArgs.addLink.isInput() &&
        node.outputSocketArray.length > 0
      ) {
        console.log(
          'connecting Input:',
          customArgs.addLink.name,
          'of',
          customArgs.addLink.parent.name,
          'with Output:',
          node.outputSocketArray[0].name,
          'of',
          node.outputSocketArray[0].parent.name
        );
        this.connect(node.outputSocketArray[0], customArgs.addLink, notify);
      }
    }
    node.onNodeAdded();
    node.executeOptimizedChain();

    return node;
  }

  getNextID = (): number => {
    return Object.values(this._links).reduce(
      (prevMax, link) => (link.id >= prevMax ? link.id + 1 : prevMax),
      0
    );
  };

  async connect(
    output: PPSocket,
    input: PPSocket,
    notify = true
  ): Promise<PPLink> {
    // remove all input links from before on this socket
    input.links.forEach((link) => link.delete());

    //create link class
    const link: PPLink = new PPLink(this.getNextID(), output, input);

    //add to graph links list
    this._links[link.id] = link;

    //add link to output
    output.links.push(link);

    //add link to input
    input.links = [link];

    input.data = output.data;

    this.connectionContainer.addChild(link);

    // send notification pulse
    if (notify) {
      await link.getSource().getNode().outputPlugged();
      await link.getTarget().getNode().executeOptimizedChain();
    }

    return link;
  }

  addWidgetNode(socket: PPSocket): void {
    const node = socket.getNode();
    if (socket.isInput()) {
      const nodeType = socket.dataType.defaultInputNodeWidget();
      if (nodeType !== undefined) {
        this.createAndAddNode(nodeType, {
          nodePosX: node.x - (200 + 40),
          nodePosY: node.y + socket.y,
          addLink: socket,
        });
      }
    } else {
      const nodeType = socket.dataType.defaultOutputNodeWidget();
      if (nodeType !== undefined) {
        this.createAndAddNode(nodeType, {
          nodePosX: node.x + (node.width + 40),
          nodePosY: node.y + socket.y,
          addLink: socket,
        });
      }
    }
  }

  checkOldSocketAndUpdateIt<T extends PPSocket>(
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

        // offset pasted node
        newNode.setPosition(offset.x, offset.y, true);

        mappingOfOldAndNewNodes[node.id] = newNode;
        newNodes.push(newNode);
        newNode.executeOptimizedChain();
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

  addTriggerInput(): void {
    this.selection.selectedNodes.forEach((node) => node.addTriggerInput());
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
        showExecutionVisualisation: this.showExecutionVisualisation,
        viewportCenterPosition: this.viewport.center,
        viewportScale: this.viewport.scale.x,
      },
      nodes: nodesSerialized,
      links: linksSerialized,
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

    // position and scale viewport
    const newX = data.graphSettings.viewportCenterPosition.x ?? 0;
    const newY = data.graphSettings.viewportCenterPosition.y ?? 0;
    this.viewport.animate({
      position: new PIXI.Point(newX, newY),
      scale: data.graphSettings.viewportScale ?? 1,
      ease: 'easeOutExpo',
      time: 750,
    });

    // other settings
    this.showExecutionVisualisation =
      data.graphSettings.showExecutionVisualisation ?? true;

    //create nodes
    try {
      data.nodes.forEach((node) => {
        this.createAndAddNode(
          node.type,
          {
            customId: node.id,
            name: node.name, // placeholder node uses the name field to indicate which node they are a placeholder for
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
          if (outputRef && inputRef) {
            await this.connect(outputRef, inputRef, false);
          } else {
            console.warn(
              `Link could not be created between ${link.sourceNodeId}/${
                link.sourceSocketName
              }${outputRef === undefined ? '-MISSING' : ''} and ${
                link.targetNodeId
              }/${link.targetSocketName}${
                inputRef === undefined ? '-MISSING' : ''
              }`
            );
            this.onShowSnackbar(
              'Some links could not be created. Check console for more info',
              {
                variant: 'warning',
                preventDuplicate: true,
              }
            );
          }
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

  getSocket(nodeID: string, socketName: string, type: TSocketType): PPSocket {
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

  public findMacroInput(name: string): PPNode {
    return Object.values(this.macrosIn).find((node) => node.name === name);
  }
  public findMacroOutput(name: string): PPNode {
    return Object.values(this.macrosOut).find((node) => node.name === name);
  }

  async invokeMacro(inputObject: any): Promise<any> {
    const macroStartNode = this.findMacroInput(inputObject['Name']);
    Object.keys(inputObject).forEach((key) => {
      macroStartNode.setOutputData(key, inputObject[key]);
    });

    await macroStartNode.executeOptimizedChain();
    const macroEndNode = this.findMacroOutput(inputObject['Name']);

    return macroEndNode.getInputSocketByName(macroOutputName).data;
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

  static getCurrentGraph(): PPGraph {
    return PPGraph.currentGraph;
  }
}

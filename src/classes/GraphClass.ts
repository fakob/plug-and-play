/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { OptionsObject, SnackbarMessage } from 'notistack';
import { NODE_WIDTH, PP_VERSION, SOCKET_TYPE } from '../utils/constants';
import {
  CustomArgs,
  SerializedGraph,
  SerializedLink,
  SerializedNode,
  SerializedSelection,
  TSocketType,
} from '../utils/interfaces';
import { connectNodeToSocket } from '../utils/utils';
import PPNode from './NodeClass';
import PPSocket from './SocketClass';
import PPLink from './LinkClass';
import PPSelection from './SelectionClass';
import { getAllNodeTypes } from '../nodes/allNodes';
import { macroOutputName } from '../nodes/macro/macro';
import { Action, ActionHandler } from '../utils/actionHandler';
import { hri } from 'human-readable-ids';
import FlowLogic from './FlowLogic';

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

    this.selection = new PPSelection(this.viewport);
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
    //event.stopPropagation();

    this.onCloseSocketInspector();

    if ((event.data.originalEvent as PointerEvent).button === 0) {
      if (!this.overInputRef) {
        this.selection.drawSelectionStart(
          event,
          event.data.originalEvent.shiftKey
        );
      }

      // pause viewport drag
      //this.viewport.plugins.pause('drag');
    } else {
      this.viewport.cursor = 'grabbing';
      this.dragSourcePoint = new PIXI.Point(this.viewport.x, this.viewport.y);
      this.onViewportDragging(true);
    }
  }

  _onPointerUpAndUpOutside(event: PIXI.InteractionEvent): void {
    console.log('_onPointerUpAndUpOutside');
    if (!this.overInputRef && this.selectedSourceSocket) {
      if (!this.overrideNodeCursorPosition) {
        this.overrideNodeCursorPosition = this.viewport.toWorld(
          event.data.global
        );
        this.onOpenNodeSearch(event.data.global);
      }
    }
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
    const dragSourceRect = object._SocketRef.getBounds();
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
    if (socket.socketType === SOCKET_TYPE.OUT) {
      this.selectedSourceSocket = socket;
      this.lastSelectedSocketWasInput = false;
    } else {
      // if input socket selected, either make a new link from here backwards or re-link old existing link
      this.lastSelectedSocketWasInput = true;
      const hasLink = socket.links.length > 0;
      if (hasLink) {
        this.selectedSourceSocket = socket.links[0].getSource();
        socket.links.forEach((link) => this.action_Disconnect(link));
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
    if (source && socket !== this.selectedSourceSocket) {
      if (
        source.socketType === SOCKET_TYPE.IN &&
        socket.socketType === SOCKET_TYPE.OUT
      ) {
        await this.action_Connect(socket, source); //this.connect(socket, source);
      } else if (
        source.socketType === SOCKET_TYPE.OUT &&
        socket.socketType === SOCKET_TYPE.IN
      ) {
        await this.action_Connect(source, socket); //this.connect(source, socket);
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

  get viewportScaleX(): number {
    return this.viewport.scale.x;
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
          `A replacement for the placeholder node ${customArgs?.name} was found. It will be replaced with ${name}.`,
          {
            variant: 'success',
          }
        );
      } else {
        this.onShowSnackbar(
          `No replacement for the placeholder node ${customArgs?.name} was found.`
        );
      }
    } else {
      name = type;
      nodeConstructor = getAllNodeTypes()[type]?.constructor;
    }

    if (!nodeConstructor) {
      // if there is no node of this type, create a placeholder node instead
      // and "save" the original node type in the placeholders name
      const errorMessage = `Node of type ${type}(${customArgs?.name}) is missing. A placeholder node will be created instead`;
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

    node.onNodeAdded();
    //await node.executeOptimizedChain();
    return node;
  }

  // does not add any links, youll have do do that yourself
  addSerializedNode(
    serialized: SerializedNode,
    customArgs: CustomArgs = {},
    newNodeType?: string
  ): PPNode {
    const node = this.createNode(newNodeType ?? serialized.type, customArgs);
    this.addNode(node);
    node.configure(serialized);
    return node;
  }

  addNewNode(type: string, customArgs: CustomArgs = {}): PPNode {
    const node = this.createNode(type, customArgs);
    this.addNode(node);
    return node;
  }

  replaceNode = (
    oldSerializedNode: SerializedNode,
    oldId: string,
    newId: string,
    newType?: string
  ) => {
    const newNode = this.addSerializedNode(
      oldSerializedNode,
      {
        overrideId: newId,
      },
      newType
    );
    if (newType) {
      newNode.nodeName = newType;
    }
    this.reconnectLinksToNewNode(this.nodes[oldId], newNode);
    newNode.executeOptimizedChain();
    this.selection.selectNodes([newNode]);
    this.selection.drawRectanglesFromSelection();
    this.removeNode(this.nodes[oldId]);
  };

  getNextID = (): number => {
    return Object.values(this._links).reduce(
      (prevMax, link) => (link.id >= prevMax ? link.id + 1 : prevMax),
      0
    );
  };

  async linkConnect(
    sourceNodeID: string,
    outputSocketName: string,
    targetNodeID: string,
    inputSocketName: string,
    notify = false
  ) {
    await this.connect(
      this.nodes[sourceNodeID].getOutputSocketByName(outputSocketName),
      this.nodes[targetNodeID].getInputSocketByName(inputSocketName),
      notify
    );
  }

  async linkDisconnect(targetNodeID, inputSocketName) {
    this.nodes[targetNodeID]
      .getInputSocketByName(inputSocketName)
      .links[0].delete();
  }

  // gets connect and unconnect actions for specified hypothetic link, based on node ID and socket name in order to be generic actions not reference-based
  getConnectActions(
    preSourceName: string,
    preSourceNodeID: string,
    preTargetName: string,
    preTargetNodeID: string,
    notify = false
  ): any {
    const action: Action = async () => {
      await this.linkConnect(
        preSourceNodeID,
        preSourceName,
        preTargetNodeID,
        preTargetName,
        notify
      );
    };
    const undoAction: Action = async () => {
      await this.linkDisconnect(preTargetNodeID, preTargetName);
    };
    return [action, undoAction];
  }

  async action_Disconnect(link: PPLink) {
    const preSourceName = link.getSource().name;
    const preSourceNodeID = link.getSource().getNode().id;
    const preTargetName = link.getTarget().name;
    const preTargetNodeID = link.getTarget().getNode().id;
    const actions = this.getConnectActions(
      preSourceName,
      preSourceNodeID,
      preTargetName,
      preTargetNodeID
    );
    ActionHandler.performAction(actions[1], actions[0]);
  }

  async action_Connect(output: PPSocket, input: PPSocket, notify = true) {
    const preSourceName = output.name;
    const preSourceNodeID = output.getNode().id;
    const preTargetName = input.name;
    const preTargetNodeID = input.getNode().id;

    const actions = this.getConnectActions(
      preSourceName,
      preSourceNodeID,
      preTargetName,
      preTargetNodeID,
      notify
    );

    ActionHandler.performAction(actions[0], actions[1]);
  }

  async connect(
    output: PPSocket,
    input: PPSocket,
    notify = true
  ): Promise<PPLink> {
    // remove all input links from before on this socket
    input.links.forEach((link) => link.delete(true));

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

  async addWidgetNode(socket: PPSocket): Promise<void> {
    const node = socket.getNode();
    let newNode;
    if (socket.isInput()) {
      const nodeType = socket.dataType.defaultInputNodeWidget();
      newNode = await this.addNewNode(nodeType, {
        nodePosX: node.x,
        nodePosY: node.y + socket.y,
        initialData: socket.data,
      });
      newNode.setPosition(-(newNode.width + 40), 0, true);
    } else {
      const nodeType = socket.dataType.defaultOutputNodeWidget();
      newNode = await this.addNewNode(nodeType, {
        nodePosX: node.x + (node.width + 40),
        nodePosY: node.y + socket.y,
      });
    }
    await connectNodeToSocket(socket, newNode);
  }

  checkOldSocketAndUpdateIt<T extends PPSocket>(
    oldSocket: T,
    newSocket: T,
    isInput: boolean
  ): boolean {
    // check if this socket already has a connection
    Object.values(this._links).forEach((link) => {
      if (isInput ? link.target === oldSocket : link.source === oldSocket) {
        console.log('updating link:', isInput ? link.target : link.source);

        if (isInput) {
          link.updateTarget(newSocket);
          oldSocket.links = [];
          newSocket.links = [link];
          newSocket.data = link.source.data;
        } else {
          link.updateSource(newSocket);
          oldSocket.links = oldSocket.links.filter((item) => item !== link);
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
    pasteTo?: {
      x: number;
      y: number;
    }
  ): Promise<PPNode[]> {
    const newNodes: PPNode[] = [];
    const mappingOfOldAndNewNodes: { [key: string]: PPNode } = {};

    //create nodes
    const offset = new PIXI.Point();
    try {
      data.nodes.forEach((node, index) => {
        if (index === 0) {
          if (pasteTo) {
            offset.set(pasteTo.x - node.x, pasteTo.y - node.y);
          } else {
            offset.set(node.width + 40, 0);
          }
        }
        // add node and carry over its con,figuration
        const newNode = this.addSerializedNode(node, {
          overrideId: hri.random(),
        });

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
    this.selection.selectNodes(newNodes, false, true);
    this.selection.drawRectanglesFromSelection();

    return newNodes;
  }

  getCanAddInput(): boolean {
    return !this.selection.selectedNodes.find((node) => !node.getCanAddInput());
  }

  addTriggerInput(): void {
    this.selection.selectedNodes.forEach((node) => node.addTriggerInput());
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
        viewportScale: this.viewportScaleX,
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
      node.getAllInputSockets().forEach((socket) => {
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
      data.nodes.forEach((node) =>
        this.addSerializedNode(node, { overrideId: node.id })
      );

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
    await FlowLogic.executeOptimizedChainBatch(
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

  action_DeleteSelectedNodes(): void {
    const nodesSerialized = this.selection.selectedNodes.map((node) =>
      node.serialize()
    );
    const linksSerialized = this.selection.selectedNodes
      .map((node) =>
        node
          .getAllSockets()
          .map((socket) => socket.links.map((link) => link.serialize()))
      )
      .flat()
      .flat();
    const action = async () => {
      this.selection.deselectAllNodesAndResetSelection();
      nodesSerialized.forEach((node) => this.removeNode(this.nodes[node.id])); // notice no direct references to make it work with redo
    };
    const undoAction = async () => {
      const addedNodes: PPNode[] = [];
      nodesSerialized.forEach((node: SerializedNode) => {
        const addedNode = PPGraph.currentGraph.addSerializedNode(node, {
          overrideId: node.id,
        });
        addedNodes.push(addedNode);
      });

      linksSerialized.forEach((link) => {
        this.connect(
          this.nodes[link.sourceNodeId].getOutputSocketByName(
            link.sourceSocketName
          ),
          this.nodes[link.targetNodeId].getInputSocketByName(
            link.targetSocketName
          ),
          false
        );
      });

      this.selection.selectNodes(addedNodes);
      this.selection.drawRectanglesFromSelection();
    };
    ActionHandler.performAction(action, undoAction);
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

  static getCurrentGraph(): PPGraph {
    return PPGraph.currentGraph;
  }

  public sendKeyEvent(e: KeyboardEvent): void {
    Object.values(this.nodes).forEach((node) => node.nodeKeyEvent(e));
  }
}

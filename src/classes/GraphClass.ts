/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { NODE_SOURCE, NODE_WIDTH, PP_VERSION } from '../utils/constants';
import {
  CustomArgs,
  SerializedGraph,
  SerializedLink,
  SerializedNode,
  SerializedSelection,
  TNodeSource,
} from '../utils/interfaces';
import { connectNodeToSocket } from '../utils/utils';
import { getNodesBounds } from '../pixi/utils-pixi';
import PPNode from './NodeClass';
import PPSocket from './SocketClass';
import PPLink from './LinkClass';
import PPSelection from './SelectionClass';
import { getAllNodeTypes } from '../nodes/allNodes';
import { ExecuteMacro, Macro } from '../nodes/macro/macro';
import { Action, ActionHandler } from '../utils/actionHandler';
import { hri } from 'human-readable-ids';
import FlowLogic from './FlowLogic';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import { v4 as uuid } from 'uuid';

export default class PPGraph {
  static currentGraph: PPGraph;
  app: PIXI.Application;
  viewport: Viewport;

  _showComments: boolean;
  _showExecutionVisualisation: boolean;
  _showNonPresentationNodes: boolean;
  socketToInspect: null | PPSocket;
  selectedSourceSocket: null | PPSocket;
  lastSelectedSocketWasInput = false;
  overrideNodeCursorPosition: null | PIXI.Point = null;
  overInputRef: null | PPSocket;
  pointerEvent: PIXI.FederatedPointerEvent;
  dragSourcePoint: PIXI.Point;

  backgroundTempContainer: PIXI.Container;
  backgroundCanvas: PIXI.Container;
  connectionContainer: PIXI.Container;
  nodeContainer: PIXI.Container;
  nodes: { [key: string]: PPNode } = {};
  macros: { [key: string]: Macro } = {};
  foregroundCanvas: PIXI.Container;
  id: string;

  tempConnection: PIXI.Graphics;
  selection: PPSelection;

  ticking: boolean;

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    this.id = hri.random();
    console.log('Graph created');

    this._showComments = true;
    this._showExecutionVisualisation = true;
    this.showNonPresentationNodes = true;
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
    this.viewport.addEventListener(
      'pointerdown',
      this.onPointerDown.bind(this)
    );

    this.viewport.addEventListener(
      'rightclick',
      this.onPointerRightClicked.bind(this)
    );
    this.viewport.addEventListener('click', this.onPointerClick.bind(this));
    this.viewport.addEventListener('pointermove', (event) =>
      this.onViewportMove(event)
    );

    InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      this.onPointerMove.bind(this)
    );

    InterfaceController.addListener(
      ListenEvent.GlobalPointerUp,
      this.onPointerUpAndUpOutside.bind(this)
    );

    // clear the stage
    this.clear();

    // define callbacks
    PPGraph.currentGraph = this;
  }

  // SETUP
  onPointerRightClicked(event: PIXI.FederatedPointerEvent): void {
    console.log('GraphClass - onPointerRightClicked');
    event.stopPropagation();
    const target = event.target;
    if (
      // only trigger right click if viewport was not dragged
      this.dragSourcePoint === undefined ||
      (this.dragSourcePoint.x === this.viewport.x &&
        this.dragSourcePoint.y === this.viewport.y)
    ) {
      InterfaceController.onRightClick(event, target);
    }
  }

  onPointerClick(event: PIXI.FederatedPointerEvent): void {
    console.log('onPointerClick');

    // check if double clicked
    if (event.detail === 2) {
      event.stopPropagation();
      const target = event.target;
      if (target instanceof Viewport) {
        InterfaceController.onOpenNodeSearch(event.global);
      }
    }
  }

  onPointerDown(event: PIXI.FederatedPointerEvent): void {
    console.log('Graph: onPointerDown');
    this.pointerEvent = event;
    //event.stopPropagation();

    InterfaceController.onCloseSocketInspector();

    if (event.button === 0) {
      if (!this.overInputRef) {
        this.selection.drawSelectionStart(event, event.shiftKey);
      }

      // pause viewport drag
      //this.viewport.plugins.pause('drag');
    } else {
      this.viewport.cursor = 'grabbing';
      this.dragSourcePoint = new PIXI.Point(this.viewport.x, this.viewport.y);
      InterfaceController.notifyListeners(ListenEvent.ViewportDragging, true);
    }
  }

  onPointerMove(event: PIXI.FederatedPointerEvent): void {
    this.pointerEvent = event;
  }

  onPointerUpAndUpOutside(event: PIXI.FederatedPointerEvent): void {
    if (!this.overInputRef && this.selectedSourceSocket) {
      if (!this.overrideNodeCursorPosition) {
        this.overrideNodeCursorPosition = this.viewport.toWorld(event.global);
        if (
          this.lastSelectedSocketWasInput ||
          this.selectedSourceSocket.isInput()
        ) {
          InterfaceController.onOpenNodeSearch(event.global);
        } else {
          this.stopConnecting();
        }
      }
    }
    // check if viewport has been dragged,
    // if not, this is a deselect all nodes action
    if (this.dragSourcePoint !== undefined) {
      if (
        this.dragSourcePoint.x === this.viewport.x &&
        this.dragSourcePoint.y === this.viewport.y
      ) {
        this.selection.deselectAllNodesAndResetSelection();

        InterfaceController.onCloseSocketInspector();
      }
    }
    if (this.selection.isDrawingSelection) {
      this.selection.drawSelectionFinish(event);
    }

    this.viewport.cursor = 'default';
    this.viewport.plugins.resume('drag');
    InterfaceController.notifyListeners(ListenEvent.ViewportDragging, false);
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

  onViewportMove(event: PIXI.FederatedPointerEvent): void {
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
        targetPoint = this.viewport.toWorld(event.global);
      }

      // swap points if i grabbed an input, to make curve look nice
      if (this.selectedSourceSocket.isInput()) {
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

  socketMouseDown(socket: PPSocket, event: PIXI.FederatedPointerEvent): void {
    const overOutput = socket.isOutput();
    this.lastSelectedSocketWasInput = overOutput;
    if (overOutput) {
      this.selectedSourceSocket = socket;
    } else {
      // if input socket selected, either make a new link from here backwards or re-link old existing link
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
    event: PIXI.FederatedPointerEvent
  ): Promise<void> {
    const source = this.selectedSourceSocket;
    this.stopConnecting();
    if (source && socket !== this.selectedSourceSocket) {
      if (source.isInput() && socket.isOutput()) {
        await this.action_Connect(socket, source);
      } else if (source.isOutput() && socket.isInput()) {
        await this.action_Connect(source, socket);
      }
    }
  }

  async socketNameRefMouseDown(
    socket: PPSocket,
    event: PIXI.FederatedPointerEvent
  ): Promise<void> {
    const clickedSourcePoint = new PIXI.Point(event.global.x, event.global.y);
    if (event.ctrlKey) {
      InterfaceController.onOpenSocketInspector(clickedSourcePoint, socket);
    } else {
      InterfaceController.notifyListeners(ListenEvent.SelectionChanged, [
        socket.getNode(),
      ]);
      if (this.socketToInspect !== socket) {
        this.socketToInspect = socket;
      } else {
        this.socketToInspect = null;
      }
      InterfaceController.notifyListeners(
        ListenEvent.OpenInspectorFocusingOnSocket,
        this.socketToInspect
      );
    }
  }

  presentationAndNodeToAlpha(value: boolean, node: PPNode) {
    const newVisibility = node.getIsPresentationalNode() || value;
    return newVisibility ? (node.alpha == 0.0 ? 1.0 : node.alpha) : 0.0;
  }

  // GETTERS & SETTERS

  set showComments(value: boolean) {
    this._showComments = value;
    Object.values(this.nodes).forEach((node) => node.drawNodeShape());
  }

  get viewportScaleX(): number {
    return this.viewport.scale.x;
  }

  get showNonPresentationNodes(): boolean {
    return this._showNonPresentationNodes;
  }

  set showNonPresentationNodes(value: boolean) {
    this._showNonPresentationNodes = value;
    Object.values(this.nodes).forEach((node) => {
      const newAlpha = this.presentationAndNodeToAlpha(value, node);
      node.alpha = newAlpha;
      node.getAllInputSockets().forEach((socket) =>
        socket.links.forEach((link) => {
          const otherNode = link.getSource().getNode();
          const otherAlpha = this.presentationAndNodeToAlpha(value, otherNode);
          const totalAlpha = newAlpha * otherAlpha;
          link.alpha = totalAlpha;
        })
      );
    });
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
        InterfaceController.showSnackBar(
          `A replacement for the placeholder node ${customArgs?.name} was found. It will be replaced with ${name}.`,
          {
            variant: 'success',
          }
        );
      } else {
        InterfaceController.showSnackBar(
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
      InterfaceController.showSnackBar(errorMessage, {
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

  addNode<T extends PPNode = PPNode>(
    node: T,
    source: TNodeSource = NODE_SOURCE.SERIALIZED
  ): T {
    if (!node) {
      return;
    }

    // add the node to the canvas
    this.nodes[node.id] = node;
    this.nodeContainer.addChild(node);

    node.onNodeAdded(source);

    return node;
  }

  // does not add any links, youll have do do that yourself
  addSerializedNode(
    serialized: SerializedNode,
    customArgs: CustomArgs = {},
    newNodeType?: string
  ): PPNode {
    const node = this.createNode(newNodeType ?? serialized.type, customArgs);
    node.configure(serialized);
    this.addNode(node);
    return node;
  }

  async addSerializedLink(link: SerializedLink): Promise<void> {
    const outputRef = this.getOutputSocket(
      link.sourceNodeId,
      link.sourceSocketName
    );
    const inputRef = this.getInputSocket(
      link.targetNodeId,
      link.targetSocketName
    );
    if (outputRef && inputRef) {
      await this.connect(outputRef, inputRef, false);
    } else {
      console.warn(
        `Link could not be created between ${link.sourceNodeId}/${link.sourceSocketName
        }${outputRef === undefined ? '-MISSING' : ''} and ${link.targetNodeId
        }/${link.targetSocketName}${inputRef === undefined ? '-MISSING' : ''}`
      );
      InterfaceController.showSnackBar(
        'Some links could not be created. Check console for more info',
        {
          variant: 'warning',
          preventDuplicate: true,
        }
      );
    }
  }

  addNewNode(
    type: string,
    customArgs: CustomArgs = {},
    source: TNodeSource = NODE_SOURCE.NEW
  ): PPNode {
    const node = this.createNode(type, customArgs);
    this.addNode(node, source);
    return node;
  }

  async action_ReplaceNode(
    oldSerializedNode: SerializedNode,
    newSerializedNode: SerializedNode
  ) {
    const referenceID = hri.random();
    const action = async () => {
      PPGraph.currentGraph.replaceNode(
        oldSerializedNode,
        oldSerializedNode.id,
        referenceID,
        newSerializedNode.type,
        newSerializedNode,
        true
      );
    };
    const undoAction = async () => {
      PPGraph.currentGraph.replaceNode(
        newSerializedNode,
        referenceID,
        oldSerializedNode.id,
        oldSerializedNode.type,
        oldSerializedNode,
        true
      );
    };
    await ActionHandler.performAction(action, undoAction);
  }

  replaceNode = (
    oldSerializedNode: SerializedNode,
    oldId: string,
    newId: string,
    newType?: string,
    newSerializedNode?: SerializedNode,
    notify?: boolean
  ) => {
    const newNode = this.addSerializedNode(
      newSerializedNode ?? oldSerializedNode,
      {
        overrideId: newId,
      },
      newType
    );
    if (newType && newSerializedNode === undefined) {
      newNode.nodeName = newType;
    }
    this.reconnectLinksToNewNode(this.nodes[oldId], newNode);
    newNode.executeOptimizedChain();
    this.selection.selectNodes([newNode], false, notify);
    this.selection.drawRectanglesFromSelection();
    this.removeNode(this.nodes[oldId]);
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
      this.nodes[targetNodeID].getInputOrTriggerSocketByName(inputSocketName),
      notify
    );
  }

  async linkDisconnect(targetNodeID, inputSocketName) {
    this.nodes[targetNodeID]
      .getInputOrTriggerSocketByName(inputSocketName)
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
    await ActionHandler.performAction(actions[1], actions[0]);
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

    await ActionHandler.performAction(actions[0], actions[1]);
  }

  async connect(
    output: PPSocket,
    input: PPSocket,
    notify = true
  ): Promise<PPLink> {
    // remove all input links from before on this socket
    input.links.forEach((link) => link.delete(true));

    // force connected sockets to be visible
    if (!input.visible) {
      input.setVisible(true);
    } else if (!output.visible) {
      output.setVisible(true);
    }

    //create link class
    const link: PPLink = new PPLink(uuid(), output, input);

    //add link to output
    output.links.push(link);

    //add link to input
    input.links = [link];

    input.data = output.data;

    this.connectionContainer.addChild(link);

    // send notification pulse
    if (notify) {
      link.getSource().getNode().outputPlugged();
      await link.getTarget().getNode().executeOptimizedChain();
    }

    return link;
  }

  stopConnecting() {
    this.clearTempConnection();
    this.overrideNodeCursorPosition = null;
    this.selectedSourceSocket = null;
  }

  async addWidgetNode(socket: PPSocket): Promise<void> {
    const node = socket.getNode();
    let newNode;
    if (socket.isInput()) {
      const nodeType = socket.dataType.defaultInputNodeWidget();
      newNode = this.addNewNode(
        nodeType,
        {
          nodePosX: node.x,
          nodePosY: node.y + socket.y,
          initialData: socket.data,
        },
        NODE_SOURCE.NEWCONNECTED
      );
      newNode.setPosition(-(newNode.width + 40), 0, true);
    } else {
      const nodeType = socket.dataType.defaultOutputNodeWidget();
      newNode = this.addNewNode(
        nodeType,
        {
          nodePosX: node.x + (node.width + 40),
          nodePosY: node.y + socket.y,
        },
        NODE_SOURCE.NEWCONNECTED
      );
    }
    await connectNodeToSocket(socket, newNode);
  }

  getLinks(): PPLink[] {
    return Object.values(this.nodes).flatMap((node) =>
      node.getAllInputSockets().flatMap((socket) => socket.links)
    );
  }

  checkOldSocketAndUpdateIt<T extends PPSocket>(
    oldSocket: T,
    newSocket: T,
    isInput: boolean
  ): boolean {
    // check if this socket already has a connection
    Object.values(this.getLinks()).forEach((link) => {
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
    // remove all links without notifying anyone (dont want nodes to trigger)
    Object.values(this.nodes).forEach(node => node.inputSocketArray.forEach(socket => socket.links.forEach(link => link.delete(true))));

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
        // add node and carry over its configuration
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
          ].getInputOrTriggerSocketByName(link.targetSocketName);
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
    this.selection.selectedNodes.forEach((node) => node.addDefaultTrigger());
  }

  async extractToMacro(): Promise<void> {
    const graphPre = this.serialize();
    // we copy all selected nodes, and all inputs to these that are not found inside the macro are turned into parameters, combined outputs are turned into the output
    const sourceNodes = this.selection.selectedNodes;
    const newNodes = await this.pasteNodes(this.serializeNodes(sourceNodes));

    const forwardMapping: Record<string, PPNode> = {};
    const backwardMapping: Record<string, PPNode> = {};
    for (let i = 0; i < newNodes.length; i++) {
      forwardMapping[sourceNodes[i].id] = newNodes[i];
      backwardMapping[newNodes[i].id] = sourceNodes[i];
    }
    const macroNode: PPNode = this.addNewNode('Macro');
    macroNode.nodeName = hri.random();
    // add extending inputs
    const inputs: PPSocket[] = sourceNodes.reduce((list, node) => {
      return list.concat(
        node.inputSocketArray.filter(
          (socket) =>
            socket.hasLink() &&
            !sourceNodes.find(
              (node) => node.id == socket.links[0].getSource().getNode().id
            )
        )
      );
    }, []);
    for (let i = 0; i < inputs.length - 1; i++) {
      macroNode.addDefaultOutput();
    }
    // connect macro outputs to new nodes
    inputs.forEach(async (socket, i) => {
      const newSocket = forwardMapping[
        socket.getNode().id
      ].getInputOrTriggerSocketByName(socket.name);
      await this.connect(macroNode.outputSocketArray[i], newSocket);
    });

    // link up the first output to macro input
    const outputs: PPSocket[] = sourceNodes.reduce((list, node) => {
      return list.concat(
        node.outputSocketArray.filter(
          (socket) =>
            socket.hasLink() &&
            !sourceNodes.find(
              (node) => node.id == socket.links[0].getTarget().getNode().id
            )
        )
      );
    }, []);
    if (outputs.length) {
      const newSocket = forwardMapping[
        outputs[0].getNode().id
      ].getOutputSocketByName(outputs[0].name);
      await this.connect(newSocket, macroNode.inputSocketArray[0]);
    }

    //

    const bounds = getNodesBounds(sourceNodes);
    macroNode.setPosition(bounds.left, bounds.top - 100);
    macroNode.resizeAndDraw(bounds.width + 400, bounds.height + 200);

    // create new executemacro node calling us, and link the old inputs to it
    const invokeMacroNode = this.addNewNode('ExecuteMacro');
    invokeMacroNode.setPosition(sourceNodes[0].x, sourceNodes[0].y);
    invokeMacroNode.setInputData('MacroName', macroNode.nodeName);
    (invokeMacroNode as ExecuteMacro).generateUseNewCode();

    if (outputs.length) {
      await this.connect(
        invokeMacroNode.outputSocketArray[0],
        outputs[0].links[0].getTarget()
      );
    }
    const validInputSockets = invokeMacroNode.inputSocketArray.filter(
      (socket) => socket.name.includes('Parameter')
    );
    inputs.forEach(async (inputSocket, index) => {
      await this.connect(
        inputSocket.links[0].getSource(),
        validInputSockets[index]
      );
    });

    // now that replacement is done, kill the old nodes
    sourceNodes.forEach((node) => this.removeNode(node));

    // move the macro a bit out of the way
    newNodes
      .concat([macroNode])
      .forEach((node) => node.setPosition(0, -500, true));

    this.selection.selectNodes([macroNode], true);

    const graphAfter = this.serialize();

    // this is a heavy-handed way of making this undoable, save the complete graph before and after operation
    ActionHandler.performAction(
      async () => {
        PPGraph.currentGraph.configure(graphAfter, this.id, false);
      },
      async () => {
        PPGraph.currentGraph.configure(graphPre, this.id, false);
      },
      false
    );
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
  getAddOutputName(): string {
    return this.selection.selectedNodes?.[0].getAddOutputDescription();
  }

  serialize(): SerializedGraph {
    // get serialized nodes
    const nodesSerialized = Object.values(this.nodes).map((node) =>
      node.serialize()
    );

    // get serialized links
    const linksSerialized = Object.values(this.getLinks()).map((link) =>
      link.serialize()
    );

    const data = {
      version: PP_VERSION,
      graphSettings: {
        showExecutionVisualisation: this.showExecutionVisualisation,
        showNonPresentationNodes: this.showNonPresentationNodes,
        viewportCenterPosition: this.viewport.center,
        viewportScale: this.viewportScaleX,
      },
      nodes: nodesSerialized,
      links: linksSerialized,
    };

    return data;
  }

  serializeNodes(nodes: PPNode[]): SerializedSelection {
    const linksContainedInSelection: PPLink[] = [];

    nodes.forEach((node) => {
      // get links which are completely contained in selection
      node.getAllInputSockets().forEach((socket) => {
        if (socket.hasLink()) {
          const connectedNode = socket.links[0].source.parent as PPNode;
          if (nodes.includes(connectedNode)) {
            linksContainedInSelection.push(socket.links[0]);
          }
        }
      });
      console.log(linksContainedInSelection);
    });

    // get serialized nodes
    const nodesSerialized = nodes.map((node) => node.serialize());

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

  serializeSelection(): SerializedSelection {
    return this.serializeNodes(this.selection.selectedNodes);
  }

  async configure(
    data: SerializedGraph,
    id: string,
    keep_old = false
  ): Promise<boolean> {
    this.ticking = false;
    this.id = id;

    if (!keep_old) {
      this.clear();
    }

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
        data.links.map(async (link) => await this.addSerializedLink(link))
      );
    } catch (error) {
      console.log(error);
      return false;
    }
    // execute all seed nodes to make sure there are values everywhere
    await FlowLogic.executeOptimizedChainBatch(
      Object.values(this.nodes).filter(
        (node) => !node.getHasDependencies() && node.updateBehaviour.update
      )
    );

    this.showNonPresentationNodes =
      data.graphSettings.showNonPresentationNodes ?? true;

    this.ticking = true;

    return true;
  }

  getInputSocket(nodeID: string, socketName: string): PPSocket {
    const node = this.getNodeById(nodeID);
    return node.getInputOrTriggerSocketByName(socketName);
  }

  getOutputSocket(nodeID: string, socketName: string): PPSocket {
    const node = this.getNodeById(nodeID);
    return node.getOutputSocketByName(socketName);
  }

  tick(currentTime: number, deltaTime: number): void {
    if (this.ticking) {
      Object.values(this.nodes).forEach((node) =>
        node.tick(currentTime, deltaTime)
      );
    }
  }

  reconnectLinksToNewNode(oldNode: PPNode, newNode: PPNode): void {
    const checkAndUpdateSocketArray = (
      oldArray: PPSocket[],
      newArray: PPSocket[],
      isInput = true
    ): void => {
      oldArray.forEach((socket, index) =>
        this.checkOldSocketAndUpdateIt(socket, newArray[index], isInput)
      );
    };

    //check arrays
    checkAndUpdateSocketArray(
      oldNode.nodeTriggerSocketArray,
      newNode.nodeTriggerSocketArray
    );
    checkAndUpdateSocketArray(
      oldNode.inputSocketArray,
      newNode.inputSocketArray
    );
    checkAndUpdateSocketArray(
      oldNode.outputSocketArray,
      newNode.outputSocketArray,
      false
    );
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
          this.nodes[link.targetNodeId].getInputOrTriggerSocketByName(
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

  async invokeMacro(inputObject: any): Promise<any> {
    const macro = Object.values(this.macros).find(
      (node) => node.name === inputObject['Name']
    );
    return await macro.executeMacro(inputObject);
  }

  static getCurrentGraph(): PPGraph {
    return PPGraph.currentGraph;
  }

  public sendKeyEvent(e: KeyboardEvent): void {
    Object.values(this.nodes).forEach((node) => node.nodeKeyEvent(e));
  }
}

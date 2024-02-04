/* eslint-disable */
import * as PIXI from 'pixi.js';
import { hri } from 'human-readable-ids';
import throttle from 'lodash/throttle';
import {
  CustomArgs,
  IWarningHandler,
  SerializedNode,
  SerializedSocket,
  TRgba,
  TNodeId,
  TNodeSource,
  TSocketType,
} from '../utils/interfaces';
import {
  COLOR_MAIN,
  COMMENT_TEXTSTYLE,
  NODE_TYPE_COLOR,
  NODE_CORNERRADIUS,
  NODE_HEADER_HEIGHT,
  NODE_HEADER_TEXTMARGIN_LEFT,
  NODE_HEADER_TEXTMARGIN_TOP,
  NODE_MARGIN,
  NODE_PADDING_BOTTOM,
  NODE_PADDING_TOP,
  NODE_SOURCE,
  NODE_TEXTSTYLE,
  NODE_WIDTH,
  ONCLICK_DOUBLECLICK,
  STATUS_SEVERITY,
  SOCKET_HEIGHT,
  SOCKET_TYPE,
  SOCKET_WIDTH,
} from '../utils/constants';
import UpdateBehaviourClass from './UpdateBehaviourClass';
import NodeHeaderClass from './NodeHeaderClass';
import PPGraph from './GraphClass';
import Socket from './SocketClass';
import {
  calculateAspectRatioFit,
  connectNodeToSocket,
  getNodeCommentPosX,
  getNodeCommentPosY,
} from '../utils/utils';
import { AbstractType } from '../nodes/datatypes/abstractType';
import { AnyType } from '../nodes/datatypes/anyType';
import { TriggerType } from '../nodes/datatypes/triggerType';
import { deSerializeType } from '../nodes/datatypes/typehelper';
import FlowLogic from './FlowLogic';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import { TextStyle } from 'pixi.js';
import { JSONType } from '../nodes/datatypes/jsonType';
import {
  NodeConfigurationError,
  NodeExecutionError,
  PNPError,
  PNPStatus,
  PNPSuccess,
} from './ErrorClass';

// export default class PPNode extends PIXI.Container implements Tooltipable {
export default class PPNode extends PIXI.Container implements IWarningHandler {
  _NodeNameRef: PIXI.Text;
  _BackgroundRef: PIXI.Container;
  _NodeTextStringRef: PIXI.Text;
  _BackgroundGraphicsRef: PIXI.Graphics;
  _CommentRef: PIXI.Graphics;
  _StatusesRef: PIXI.Graphics;
  _ErrorBoundaryRef: PIXI.Graphics;
  _ForegroundRef: PIXI.Container;

  clickedSocketRef: Socket;
  _isHovering: boolean;

  id: TNodeId;
  type: string; // Type
  nodePosX: number;
  nodePosY: number;
  nodeWidth: number;
  nodeHeight: number;

  updateBehaviour: UpdateBehaviourClass;
  nodeSelectionHeader: NodeHeaderClass;
  lastTimeTicked = 0;

  status: { node: PNPStatus; socket: PNPStatus; custom: PNPStatus[] } = {
    node: new PNPSuccess(),
    socket: new PNPSuccess(),
    custom: [],
  };

  inputSocketArray: Socket[] = [];
  nodeTriggerSocketArray: Socket[] = [];
  outputSocketArray: Socket[] = [];

  _doubleClicked: boolean;
  listenId: string[] = [];

  // supported callbacks
  onNodeDoubleClick: (event: PIXI.FederatedPointerEvent) => void = () => {};
  onViewportMoveHandler: (event?: PIXI.FederatedPointerEvent) => void =
    () => {};
  onViewportPointerUpHandler: (event?: PIXI.FederatedPointerEvent) => void =
    () => {};
  onNodeRemoved: () => void = () => {}; // called when the node is removed from the graph
  onNodeResize: (width: number, height: number) => void = () => {}; // called when the node is resized
  onNodeDragOrViewportMove: // called when the node or or the viewport with the node is moved or scaled
  (positions: { screenX: number; screenY: number; scale: number }) => void =
    () => {};
  hasBeenAdded = false;

  // called when the node is added to the graph
  public async onNodeAdded(source: TNodeSource): Promise<void> {
    this._NodeTextStringRef = new PIXI.Text(
      this.getNodeTextString(),
      NODE_TEXTSTYLE,
    );
    this._NodeTextStringRef.x = NODE_HEADER_TEXTMARGIN_LEFT;
    this._NodeTextStringRef.y = NODE_PADDING_TOP + NODE_HEADER_TEXTMARGIN_TOP;
    this._NodeTextStringRef.resolution = 8;

    this._BackgroundRef = new PIXI.Container();
    this.addChild(this._BackgroundRef);
    this._BackgroundRef.name = 'background';
    const backgroundGraphics = new PIXI.Graphics();
    this._BackgroundGraphicsRef =
      this._BackgroundRef.addChild(backgroundGraphics);
    this._BackgroundGraphicsRef.name = 'backgroundGraphics';

    this._NodeNameRef = this._BackgroundRef.addChild(this._NodeTextStringRef);
    this._CommentRef = this._BackgroundRef.addChild(new PIXI.Graphics());
    this._ErrorBoundaryRef = this._BackgroundRef.addChild(new PIXI.Graphics());
    this._StatusesRef = this._BackgroundRef.addChild(new PIXI.Graphics());

    // only get default updateBehaviour when newly added
    if (source !== NODE_SOURCE.SERIALIZED) {
      this.updateBehaviour = this.getUpdateBehaviour();
    }

    if (this.getShouldShowHoverActions()) {
      this._BackgroundRef.addChild(this.updateBehaviour);
    }
    this.updateBehaviour.x = NODE_MARGIN;
    this.updateBehaviour.y = -24;

    this.nodeSelectionHeader = new NodeHeaderClass();
    if (this.getShouldShowHoverActions()) {
      this._BackgroundRef.addChild(this.nodeSelectionHeader);
    }
    this.nodeSelectionHeader.x = NODE_MARGIN + this.nodeWidth - 96;
    this.nodeSelectionHeader.y = -24;

    // do not show the node name
    if (!this.getShowLabels()) {
      this._NodeNameRef.alpha = 0;
    }

    this._ForegroundRef = new PIXI.Container();
    this.addChild(this._ForegroundRef);
    this._ForegroundRef.name = 'foreground';

    this.hasBeenAdded = true;
    this.getAllSockets().forEach((socket) => {
      this._BackgroundRef.addChild(socket);
      socket.onNodeAdded();
    });

    this.eventMode = 'dynamic';
    this._doubleClicked = false;

    this._addListeners();
    this.resizeAndDraw();

    if (this.updateBehaviour.load || this.updateBehaviour.update) {
      await this.executeOptimizedChain();
    }
  }

  public getMinNodeWidth(): number {
    return NODE_WIDTH;
  }

  public getMinNodeHeight(): number {
    const minHeight =
      this.headerHeight +
      this.countOfVisibleNodeTriggerSockets * SOCKET_HEIGHT +
      this.countOfVisibleInputSockets * SOCKET_HEIGHT +
      this.countOfVisibleOutputSockets * SOCKET_HEIGHT +
      NODE_PADDING_BOTTOM;
    return minHeight;
  }

  protected getAllInitialSockets(): Socket[] {
    return this.getDefaultIO().concat([
      new Socket(SOCKET_TYPE.IN, 'Meta', new JSONType(), {}, false),
    ]);
  }

  public getNodeTextString(): string {
    if (
      this.name !== this.type &&
      this.getName() !== this.name &&
      this.name.length > 0
    ) {
      return this.name + '\t(' + this.getName() + ')';
    }
    return this.getName();
  }

  constructor(type: string, customArgs?: CustomArgs) {
    super();
    this.id = customArgs?.overrideId || hri.random();
    this.setNodeName(this.getName());
    this.type = type;
    this.nodeTriggerSocketArray = [];
    this.inputSocketArray = [];
    this.outputSocketArray = [];
    this.clickedSocketRef = null;

    // customArgs
    this.x = customArgs?.nodePosX ?? 0;
    this.y = customArgs?.nodePosY ?? 0;
    this.nodeWidth = this.getDefaultNodeWidth();
    this.nodeHeight = this.getDefaultNodeHeight(); // if not set height is defined by in/out sockets
    this._isHovering = false;

    // add static inputs and outputs
    this.getAllInitialSockets().forEach((IO) => {
      // add in default data if supplied
      const newDefault = customArgs?.defaultArguments?.[IO.name];
      if (newDefault) {
        IO.data = newDefault;
      }
      this.addSocket(IO);
    });
  }

  // GETTERS & SETTERS

  get selected(): boolean {
    return PPGraph.currentGraph.selection.isNodeSelected(this);
  }

  get doubleClicked(): boolean {
    return this._doubleClicked;
  }

  set doubleClicked(state: boolean) {
    this._doubleClicked = state;
  }

  get isHovering(): boolean {
    return this._isHovering;
  }

  set isHovering(state: boolean) {
    this._isHovering = state;
  }

  get countOfVisibleNodeTriggerSockets(): number {
    return this.nodeTriggerSocketArray.filter((item) => item.visible).length;
  }

  get countOfVisibleInputSockets(): number {
    return this.inputSocketArray.filter((item) => item.visible).length;
  }

  get countOfVisibleOutputSockets(): number {
    return this.outputSocketArray.filter((item) => item.visible).length;
  }

  get headerHeight(): number {
    // hide header if showLabels === false
    return this.getShowLabels()
      ? NODE_PADDING_TOP + NODE_HEADER_HEIGHT
      : NODE_PADDING_TOP;
  }

  get nodeName(): string {
    return this.name;
  }

  public setNodeName(text: string) {
    this.name = text;
    if (this.hasBeenAdded) {
      this._NodeNameRef.text = this.getNodeTextString();
    }
    this.nameChanged(text);
  }

  getSourceCode(): string {
    return this.constructor.toString();
  }

  addSocket(socket: Socket): void {
    if (this.hasBeenAdded) {
      this._BackgroundRef.addChild(socket);
      socket.onNodeAdded();
    }
    switch (socket.socketType) {
      case SOCKET_TYPE.TRIGGER: {
        this.nodeTriggerSocketArray.push(socket);
        break;
      }
      case SOCKET_TYPE.IN: {
        this.inputSocketArray.push(socket);
        break;
      }
      case SOCKET_TYPE.OUT: {
        this.outputSocketArray.push(socket);
        break;
      }
    }
  }

  removeSocket(socket: Socket): void {
    if (socket == undefined) {
      return;
    }
    const checkAndRemoveFrom = (nameOfArrayToCheck: string): void => {
      this[nameOfArrayToCheck] = this[nameOfArrayToCheck].filter(
        (socketRef: Socket) =>
          !(
            socketRef.name === socket.name &&
            socketRef.socketType === socket.socketType
          ),
      );
    };

    socket.removeLink();

    //remove from arrays
    checkAndRemoveFrom('nodeTriggerSocketArray');
    checkAndRemoveFrom('inputSocketArray');
    checkAndRemoveFrom('outputSocketArray');
    if (this.getShrinkOnSocketRemove()) {
      this.resizeAndDraw(0, 0);
    }

    socket.destroy();
  }

  addTrigger(
    name: string,
    type: AbstractType,
    data?: unknown,
    visible?: boolean,
    custom?: Record<string, any>, // lets get rid of this ASAP
    redraw = true,
  ): void {
    this.addSocket(
      new Socket(SOCKET_TYPE.TRIGGER, name, type, data, visible, custom),
    );
    // redraw background due to size change
    if (redraw) {
      this.resizeAndDraw();
    }
  }

  addInput(
    name: string,
    type: AbstractType,
    data?: unknown,
    visible?: boolean,
    custom?: Record<string, any>, // lets get rid of this ASAP
    redraw = true,
  ): void {
    this.addSocket(
      new Socket(SOCKET_TYPE.IN, name, type, data, visible, custom),
    );
    // redraw background due to size change
    if (redraw) {
      this.resizeAndDraw();
    }
  }

  addOutput(
    name: string,
    type: AbstractType,
    visible?: boolean,
    custom?: Record<string, any>,
    redraw = true,
  ): void {
    this.addSocket(
      new Socket(
        SOCKET_TYPE.OUT,
        name,
        type,
        null, // need to get rid of this
        visible,
      ),
    );
    // redraw background due to size change
    if (redraw) {
      this.resizeAndDraw();
    }
  }

  serialize(): SerializedNode {
    //create serialization object
    const node: SerializedNode = {
      id: this.id,
      name: this.name,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.nodeWidth,
      height: this.nodeHeight,
      socketArray: this.getAllSockets().map((socket) => socket.serialize()),
      updateBehaviour: {
        load: this.updateBehaviour.load,
        update: this.updateBehaviour.update,
        interval: this.updateBehaviour.interval,
        intervalFrequency: this.updateBehaviour.intervalFrequency,
      },
    };

    return node;
  }

  // Remember, this is called before the node is added, so no visual operations needed
  configure(nodeConfig: SerializedNode, includeSocketData = true): void {
    this.x = nodeConfig.x;
    this.y = nodeConfig.y;
    this.nodeWidth = nodeConfig.width || this.getMinNodeWidth();
    this.nodeHeight = nodeConfig.height || this.getMinNodeHeight();
    this.setNodeName(nodeConfig.name);
    this.updateBehaviour = new UpdateBehaviourClass(
      nodeConfig.updateBehaviour.load ?? false,
      nodeConfig.updateBehaviour.update,
      nodeConfig.updateBehaviour.interval,
      nodeConfig.updateBehaviour.intervalFrequency,
      this,
    );
    if (includeSocketData) {
      try {
        const mapSocket = (item: SerializedSocket) => {
          const matchingSocket = this.getSocketByNameAndType(
            item.name,
            item.socketType,
          );
          if (matchingSocket !== undefined) {
            // ignore output sockets as no data is stored for them
            if (item.socketType !== SOCKET_TYPE.OUT) {
              matchingSocket.data = item.data;
              matchingSocket.defaultData = item.defaultData ?? item.data;
            }
            matchingSocket.visible = item.visible;
          } else {
            // add socket if it does not exist yet
            console.info(
              `Socket does not exist (yet) and will be created: ${this.name}(${this.id})/${item.name}`,
            );
            this.addSocket(
              new Socket(
                item.socketType,
                item.name,
                deSerializeType(item.dataType),
                item.data,
                item.visible,
              ),
            );
          }
        };

        const sockets = nodeConfig.socketArray;
        sockets.forEach((item) => mapSocket(item));
      } catch (error) {
        this.setStatus(new NodeConfigurationError(error));
        console.error(
          `Could not configure node: ${this.name}(${this.id})`,
          error,
        );
      }
    }
  }

  public getDirectDependents(): { [key: string]: PPNode } {
    const currDependents: { [key: string]: PPNode } = {};
    this.outputSocketArray.forEach((socket) => {
      Object.values(socket.getDirectDependents()).forEach((dependent) => {
        currDependents[dependent.id] = dependent;
      });
    });
    return currDependents;
  }

  public getHasDependencies(): boolean {
    return (
      this.getAllInputSockets().find((socket) => socket.hasLink()) !== undefined
    );
  }

  async executeOptimizedChain(): Promise<void> {
    if (PPGraph.currentGraph.allowExecution) {
      await FlowLogic.executeOptimizedChainBatch([this]);
    }
  }

  // for when you dont want to execute your own node (you probably already did in some fashion), but run all children that react to updates
  async executeChildren(): Promise<void> {
    this.drawComment();
    await FlowLogic.executeOptimizedChainBatch(
      Object.values(this.getDirectDependents()).filter(
        (node) => node.updateBehaviour.update,
      ),
    );
  }

  public refreshNodeDragOrViewportMove() {
    const screenPointBackgroundRectTopLeft =
      this.screenPointBackgroundRectTopLeft();
    this.onNodeDragOrViewportMove({
      screenX: screenPointBackgroundRectTopLeft.x,
      screenY: screenPointBackgroundRectTopLeft.y,
      scale: PPGraph.currentGraph.viewportScaleX,
    });
  }

  public setPosition(x: number, y: number, isRelative = false): void {
    if (isRelative) {
      this.x = this.x + (x ?? 0);
      this.y = this.y + (y ?? 0);
    } else {
      this.x = x ?? this.x;
      this.y = y ?? this.y;
    }

    this.updateConnectionPosition();

    if (this.shouldExecuteOnMove()) {
      this.executeOptimizedChain();
    }

    this.refreshNodeDragOrViewportMove();
  }

  onBeingScaled(
    width: number = this.nodeWidth,
    height: number = this.nodeHeight,
    maintainAspectRatio = false,
  ): void {
    this.resizeAndDraw(width, height, maintainAspectRatio);
  }

  resizeAndDraw(
    width: number = this.nodeWidth,
    height: number = this.nodeHeight,
    maintainAspectRatio = false,
  ): void {
    // set new size
    const newNodeWidth = Math.max(width, this.getMinNodeWidth());
    const newNodeHeight = Math.max(height, this.getMinNodeHeight());

    if (maintainAspectRatio) {
      const oldWidth = this.nodeWidth;
      const oldHeight = this.nodeHeight;
      const newRect = calculateAspectRatioFit(
        oldWidth,
        oldHeight,
        newNodeWidth,
        newNodeHeight,
        this.getMinNodeWidth(),
        this.getMinNodeHeight(),
      );
      this.nodeWidth = newRect.width;
      this.nodeHeight = newRect.height;
    } else {
      this.nodeWidth = newNodeWidth;
      this.nodeHeight = newNodeHeight;
    }

    // update node shape
    this.drawNodeShape();

    this.updateConnectionPosition();

    this.nodeSelectionHeader.x = NODE_MARGIN + this.nodeWidth - 96;

    this.onNodeResize(this.nodeWidth, this.nodeHeight);

    if (this.selected) {
      PPGraph.currentGraph.selection.drawRectanglesFromSelection(
        PPGraph.currentGraph.selection.selectedNodes.length > 1,
      );
    }
  }

  public resetSize(): void {
    this.resizeAndDraw(this.getDefaultNodeWidth(), this.getDefaultNodeHeight());
  }

  // get all sockets that are not part of the base kit for the node
  // do not include trigger sockets regardless of if they are default or not
  public getAllNonDefaultInputSockets(): Socket[] {
    const defaultIONames = this.getAllInitialSockets()
      .filter((socket) => socket.isInput())
      .map((socket) => socket.name);
    const nonDefault = this.inputSocketArray.filter(
      (socket) => !defaultIONames.includes(socket.name),
    );
    return nonDefault;
  }

  public getAllInputSockets(): Socket[] {
    return this.inputSocketArray.concat(this.nodeTriggerSocketArray);
  }

  getDataSockets(): Socket[] {
    return this.inputSocketArray.concat(this.outputSocketArray);
  }

  getAllSockets(): Socket[] {
    return this.inputSocketArray.concat(
      this.nodeTriggerSocketArray,
      this.outputSocketArray,
    );
  }

  getNodeTriggerSocketByName(slotName: string): Socket {
    return this.nodeTriggerSocketArray.find((el) => el.name === slotName);
  }

  getInputSocketByName(slotName: string): Socket {
    return this.inputSocketArray.find((el) => el.name === slotName);
  }

  getInputOrTriggerSocketByName(slotName: string): Socket {
    const found = this.getAllInputSockets().find((el) => el.name === slotName);
    if (found === undefined) {
      // create new socket for this ask, maybe this is a bit ugly
      console.log(
        'creating new socket because someone is trying to get a socket that didnt exist: ' +
          slotName,
      );
      const newSocket = new Socket(SOCKET_TYPE.IN, slotName, new AnyType());
      this.addSocket(newSocket);
      this.resizeAndDraw();
      return newSocket;
    } else {
      return found;
    }
  }

  getOutputSocketByName(slotName: string): Socket {
    return this.outputSocketArray.find((el) => el.name === slotName);
  }

  public getSocketByName(name: string): Socket {
    return this.getAllSockets().find((socket) => socket.name === name);
  }

  public getSocketByNameAndType(name: string, socketType: TSocketType): Socket {
    switch (socketType) {
      case SOCKET_TYPE.TRIGGER: {
        return this.getNodeTriggerSocketByName(name);
      }
      case SOCKET_TYPE.IN: {
        return this.getInputSocketByName(name);
      }
      case SOCKET_TYPE.OUT: {
        return this.getOutputSocketByName(name);
      }
      default:
        return;
    }
  }

  public drawErrorBoundary(): void {
    this._ErrorBoundaryRef.clear();
    if (
      this.status.node.getSeverity() >= STATUS_SEVERITY.WARNING ||
      this.status.socket.getSeverity() >= STATUS_SEVERITY.WARNING
    ) {
      const status =
        this.status.node.getSeverity() >= STATUS_SEVERITY.WARNING
          ? this.status.node
          : this.status.socket;

      this._ErrorBoundaryRef.lineStyle(3, status.getColor().hexNumber(), 1);
      this._ErrorBoundaryRef.drawRoundedRect(
        NODE_MARGIN - 3,
        -3,
        this.nodeWidth + 6,
        this.nodeHeight + 6,
        this.getRoundedCorners() ? NODE_CORNERRADIUS + 3 : 0,
      );
      this._ErrorBoundaryRef.lineStyle();
    }
  }

  public drawBackground(): void {
    this._BackgroundGraphicsRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity(),
    );
    this._BackgroundGraphicsRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      this.nodeWidth,
      this.nodeHeight,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0,
    );
    this._BackgroundGraphicsRef.endFill();
  }

  public drawTriggers(): void {
    this.nodeTriggerSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y = this.headerHeight + index * SOCKET_HEIGHT;
        item.showLabel = this.getShowLabels();
        item.redraw();
      });
  }

  public drawSockets(): void {
    // redraw outputs
    this.outputSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y =
          this.headerHeight +
          this.countOfVisibleNodeTriggerSockets * SOCKET_HEIGHT +
          index * SOCKET_HEIGHT;
        item.showLabel = this.getShowLabels();
        item.redraw();
      });

    // redraw inputs
    this.inputSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y =
          this.headerHeight +
          this.countOfVisibleNodeTriggerSockets * SOCKET_HEIGHT +
          (!this.getParallelInputsOutputs()
            ? this.countOfVisibleOutputSockets * SOCKET_HEIGHT
            : 0) +
          index * SOCKET_HEIGHT;
        item.showLabel = this.getShowLabels();
        item.redraw();
      });
  }

  protected drawStatuses(): void {
    this._StatusesRef.clear();
    this._StatusesRef.removeChildren();

    let flattenedStatus = [];
    for (const key in this.status) {
      if (Array.isArray(this.status[key])) {
        flattenedStatus = this.status[key].concat(flattenedStatus);
      } else if (this.status[key].getSeverity() >= STATUS_SEVERITY.WARNING) {
        flattenedStatus.push(this.status[key]);
      }
    }

    const padding = 5;
    let startY = this.countOfVisibleOutputSockets * SOCKET_HEIGHT + 40;
    const startX = this.nodeWidth - 60;

    flattenedStatus.forEach((nStatus, index) => {
      const color = nStatus.getColor();

      let shortenedMessage = nStatus.message;
      const lines = nStatus.message.split('\n');
      const maxLines = 3;
      if (lines.length > maxLines) {
        shortenedMessage = lines.slice(0, maxLines).join('\n');
      }

      const text = new PIXI.Text(
        shortenedMessage,
        new TextStyle({
          fontSize: 18,
          fill: COLOR_MAIN,
        }),
      );
      text.x = startX + padding;
      text.y = startY + padding;
      this._StatusesRef.addChild(text);
      this._StatusesRef.beginFill(color.hexNumber());
      this._StatusesRef.drawRoundedRect(
        startX,
        startY,
        text.width + padding * 2,
        text.height + padding * 2,
        nStatus.getSeverity() >= STATUS_SEVERITY.WARNING
          ? 0
          : NODE_CORNERRADIUS,
      );
      startY += text.height + padding;
    });
  }

  public drawNodeShape(): void {
    if (!this.hasBeenAdded) {
      return;
    }
    // update selection

    this._BackgroundGraphicsRef.clear();
    this.drawErrorBoundary();
    this.drawBackground();

    this.drawTriggers();
    this.drawSockets();
    this.drawComment();
    this.drawStatuses();
    this._NodeTextStringRef.text = this.getNodeTextString();
  }

  constructSocketName(prefix: string, existing: Socket[]): string {
    let count = 1;
    let newName = prefix + ' ' + count;
    while (existing.find((socket) => socket.name === newName)) {
      newName = prefix + ' ' + count++;
    }
    return newName;
  }

  public addDefaultTrigger(): void {
    this.addTrigger(
      this.constructSocketName('Trigger', this.nodeTriggerSocketArray),
      new TriggerType(),
    );
  }

  public addDefaultInput(): void {
    this.addInput(
      this.constructSocketName('Custom Input', this.inputSocketArray),
      new AnyType(),
    );
  }

  public addDefaultOutput(): void {
    this.addOutput(
      this.constructSocketName('Custom Output', this.outputSocketArray),
      new AnyType(),
    );
  }

  updateConnectionPosition(): void {
    // check for connections and move them too
    this.getAllSockets().forEach((socket) => {
      socket.links.forEach((link) => {
        link.updateConnection();
      });
    });
  }

  public setStatus(status: PNPStatus, type: 'node' | 'socket' = 'node') {
    const currentMessage = JSON.stringify(this.status[type].message);
    const newMessage = JSON.stringify(status.message);
    if (currentMessage !== newMessage) {
      this.status[type] = status;
      this.drawStatuses();
      this.drawErrorBoundary();
    }
  }

  public pushExclusiveCustomStatus(status: PNPStatus) {
    this.status.custom = [];
    this.status.custom.push(status);
  }

  adaptToSocketErrors(): void {
    const hasWarningsOrErrors = this.getAllSockets().some(
      (socket) => socket.status.getSeverity() >= STATUS_SEVERITY.WARNING,
    );
    if (!hasWarningsOrErrors) {
      this.setStatus(new PNPSuccess(), 'socket');
      this.drawStatuses();
      this.drawErrorBoundary();
    }
  }

  drawComment(): void {
    this._CommentRef?.removeChildren();
    if (PPGraph.currentGraph._showComments) {
      let commentData = this.outputSocketArray[0]?.dataType?.getComment(
        this.outputSocketArray[0]?.data,
      );
      if (commentData !== undefined && commentData.length > 10000) {
        commentData = 'Too long to display';
      }
      const debugText = new PIXI.Text(
        `${this.id}
${Math.round(this.transform.position.x)}, ${Math.round(
          this.transform.position.y,
        )}
${Math.round(this._bounds.minX)}, ${Math.round(
          this._bounds.minY,
        )}, ${Math.round(this._bounds.maxX)}, ${Math.round(this._bounds.maxY)}`,
        COMMENT_TEXTSTYLE,
      );
      debugText.resolution = 1;
      const nodeComment = new PIXI.Text(commentData, COMMENT_TEXTSTYLE);
      nodeComment.resolution = 1;

      debugText.x = getNodeCommentPosX(this.width);
      debugText.y = getNodeCommentPosY() - 48;
      nodeComment.x = debugText.x;
      nodeComment.y = getNodeCommentPosY();

      this._CommentRef.addChild(debugText);
      this._CommentRef.addChild(nodeComment);
    }
  }

  screenPointBackgroundRectTopLeft(): PIXI.Point {
    return PPGraph.currentGraph.viewport.toScreen(this.x + NODE_MARGIN, this.y);
  }

  screenPointBackgroundRectCenter(): PIXI.Point {
    return PPGraph.currentGraph.viewport.toScreen(
      this.x + NODE_MARGIN + this._BackgroundGraphicsRef.width / 2,
      this.y + this._BackgroundGraphicsRef.height / 2,
    );
  }

  // avoid calling this directly when possible
  public getInputData(name: string): any {
    const inputSocket = this.inputSocketArray.find((input: Socket) => {
      return name === input.name;
    });

    if (!inputSocket) {
      return undefined;
    }

    // if no link, then return data
    if (inputSocket.links.length === 0) {
      return inputSocket.data;
    }

    const link = inputSocket.links[0];
    return link.source.data;
  }

  // avoid calling this directly when possible, instead use the input/output objects in onExecute and keep it encapsulated in that flow (not always possible but most of the time is)
  public setInputData(name: string, data: any): void {
    const inputSocket = this.inputSocketArray.find((input: Socket) => {
      return name === input.name;
    });

    if (!inputSocket) {
      console.error('No input socket found with the name: ', name);
      return;
    }

    inputSocket.data = data;
  }

  // avoid calling this directly when possible
  public getOutputData(name: string): any {
    const outputSocket = this.outputSocketArray.find((output: Socket) => {
      return name === output.name;
    });

    if (!outputSocket) {
      return undefined;
    }

    return outputSocket.data;
  }

  // avoid calling this directly if possible, instead use the input/output objects in onExecute
  public setOutputData(name: string, data: any): void {
    const outputSocket = this.outputSocketArray
      .filter((socket) => socket.socketType === SOCKET_TYPE.OUT)
      .find((output: Socket) => {
        return name === output.name;
      });
    if (outputSocket) {
      outputSocket.data = data;
    }
  }

  async tick(currentTime: number, deltaTime: number): Promise<void> {
    if (
      this.updateBehaviour.interval &&
      currentTime - this.lastTimeTicked >=
        this.updateBehaviour.intervalFrequency
    ) {
      this.lastTimeTicked = currentTime;
      this.executeOptimizedChain();
    }
  }

  private static remapInput(sockets: Socket[]): any {
    const inputObject = {};
    sockets.forEach((input: Socket) => {
      inputObject[input.name] = input.data;
    });
    return inputObject;
  }

  // if you want to optimize the mapping of arguments, override this function instead of execute(), but most of the time just override onExecute()
  protected async rawExecute(): Promise<void> {
    if (!this.hasBeenAdded) {
      return;
    }
    // remap input
    const inputObject = PPNode.remapInput(this.inputSocketArray);
    const outputObject = {};

    await this.onExecute(inputObject, outputObject);

    // output whatever the user has put in
    this.outputSocketArray.forEach((output: Socket) => {
      if (outputObject[output.name] !== undefined) {
        output.data = outputObject[output.name];
      }
    });

    // set the meta settings
    if (inputObject['Meta'] !== undefined) {
      Object.keys(inputObject['Meta']).forEach((key) => {
        this[key] = inputObject['Meta'][key];
      });
    }
  }

  public renderOutlineThrottled = throttle(this.renderOutline, 2000, {
    trailing: false,
    leading: true,
  });

  private renderOutline(iterations = 30, interval = 16.67): void {
    // const iterations = 30;
    // const interval = 16.67;
    const activeExecution = new PIXI.Graphics();
    this._BackgroundRef.addChild(activeExecution);
    for (let i = 1; i <= iterations; i++) {
      setTimeout(() => {
        activeExecution.clear();
        activeExecution.beginFill(
          this.status.node.getColor().hexNumber(),
          0.4 - i * (0.4 / iterations),
        );

        activeExecution.drawRoundedRect(
          NODE_MARGIN,
          0,
          this.nodeWidth,
          this.nodeHeight,
          this.getRoundedCorners() ? NODE_CORNERRADIUS : 0,
        );
        activeExecution.endFill();
        if (i == iterations) {
          this._BackgroundRef.removeChild(activeExecution);
        }
      }, i * interval);
    }
  }

  // Don't call this from outside unless you know very well what you are doing, you are probably looking for executeOptimizedChain()
  public async execute(): Promise<void> {
    this.setStatus(new PNPSuccess());
    try {
      if (PPGraph.currentGraph.showExecutionVisualisation) {
        this.renderOutlineThrottled();
      }
      await this.rawExecute();
      this.drawComment();
    } catch (error) {
      if (error instanceof PNPError) {
        this.setStatus(error);
      } else {
        this.setStatus(new NodeExecutionError(error.stack));
      }
      console.warn(
        `Node ${this.name}(${this.id}) execution error:  ${error.stack}`,
      );
    }
  }

  // helper function for nodes who want execution to just be a passthrough
  protected async passThrough(input, output): Promise<void> {
    Object.keys(input).forEach((key) => {
      output[key] = input[key];
    });
  }

  // getTooltipContent(props): React.ReactElement {
  //   const data = JSON.stringify(
  //     {
  //       id: this.id,
  //       name: this.name,
  //       type: this.type,
  //     },
  //     getCircularReplacer(),
  //     2,
  //   );
  //   return (
  //     <>
  //       <Box
  //         sx={{
  //           p: '8px',
  //           py: '9px',
  //           color: 'text.primary',
  //           fontWeight: 'medium',
  //           fontSize: 'small',
  //         }}
  //       >
  //         Node: {this.name}
  //       </Box>
  //       <CodeEditor value={data} randomMainColor={props.randomMainColor} />
  //     </>
  //   );
  // }

  // getTooltipPosition(): PIXI.Point {
  //   const scale = PPGraph.currentGraph.viewportScaleX;
  //   const distanceX = TOOLTIP_DISTANCE * scale;
  //   const absPos = this.getGlobalPosition();
  //   return new PIXI.Point(
  //     Math.max(0, absPos.x - TOOLTIP_WIDTH - distanceX),
  //     absPos.y,
  //   );
  // }

  // SETUP

  _addListeners(): void {
    this.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.addEventListener('pointerover', this.onPointerOver.bind(this));
    this.addEventListener('pointerout', this.onPointerOut.bind(this));
    this.addEventListener('click', this.onPointerClick.bind(this));
    this.addEventListener('removed', this.onRemoved.bind(this));

    this.onViewportPointerUpHandler = this.onViewportPointerUp.bind(this);
    this.onViewportMoveHandler = this.onViewportMove.bind(this);
    PPGraph.currentGraph.viewport.addEventListener(
      'moved',
      (this as any).onViewportMoveHandler,
    );
  }

  async onPointerDown(event: PIXI.FederatedPointerEvent): Promise<void> {
    console.log('Node: onPointerDown');
    event.stopPropagation();
    const node = event.target as PPNode;

    if (node.clickedSocketRef === null) {
      // start dragging the node

      const shiftKey = event.shiftKey;
      const altKey = event.altKey;

      // select node if the shiftKey is pressed
      // or the node is not yet selected
      if (shiftKey || this.selected === false) {
        PPGraph.currentGraph.selection.selectNodes([this], shiftKey, true);
        this.onSpecificallySelected();
      }

      // duplicate the selection if altKey is pressed and select the duplicates for dragging
      if (altKey) {
        const duplicatedNodes = await PPGraph.currentGraph.duplicateSelection({
          x: this.x,
          y: this.y,
        });
        PPGraph.currentGraph.selection.selectNodes(
          duplicatedNodes,
          shiftKey,
          true,
        );
      }

      if (PPGraph.currentGraph.selection.selectedNodes.length > 0) {
        PPGraph.currentGraph.selection.startDragAction(event);
      }
    }
    if (event.button == 2) {
      if (event.target == this) {
        InterfaceController.onRightClick(event, this);
      }
      PPGraph.currentGraph.selection.stopDragAction();
    }
  }

  public getNewInputSocketName(preferredName: string): string {
    const existing = this.getAllInputSockets();
    let newParamName = preferredName;
    let count: number = 2;
    // find a new param name that is unique
    while (existing.find((param) => param.name === newParamName)) {
      newParamName = preferredName + ' ' + count;
      count += 1;
    }
    return newParamName;
  }

  public getSocketForNewConnection(socket: Socket): Socket {
    const socketArray = socket.isInput()
      ? this.outputSocketArray
      : this.inputSocketArray;
    if (socketArray.length > 0) {
      const getSocket = (
        condition,
        onlyFreeSocket,
        onlyVisibleSocket = true,
      ): Socket => {
        return socketArray.find((socketInArray) => {
          return (
            (!onlyVisibleSocket || socketInArray.visible) &&
            condition(socketInArray) &&
            (!onlyFreeSocket || !socketInArray.hasLink())
          );
        });
      };

      const preferredCondition = (socketInArray): boolean => {
        const preferredSocketName = socketInArray.isInput()
          ? this.getPreferredInputSocketName()
          : this.getPreferredOutputSocketName();
        return socketInArray.name === preferredSocketName;
      };

      const exactMatchCondition = (socketInArray): boolean => {
        return (
          socketInArray.dataType.constructor === socket.dataType.constructor
        );
      };

      const anyTypeCondition = (socketInArray): boolean => {
        return socketInArray.dataType.constructor === new AnyType().constructor;
      };

      const anyCondition = (): boolean => {
        return true;
      };

      return (
        getSocket(preferredCondition, true, false) ?? // get preferred with no link
        getSocket(exactMatchCondition, true) ?? // get exact match with no link
        getSocket(anyTypeCondition, true) ?? // get anyType with no link
        getSocket(anyCondition, true) ?? // get any with no link
        // no match free and visible
        getSocket(preferredCondition, false, false) ??
        getSocket(exactMatchCondition, false) ??
        getSocket(anyTypeCondition, false) ??
        getSocket(anyCondition, false) ??
        // no match linked and visible
        getSocket(exactMatchCondition, false, false) ??
        getSocket(anyTypeCondition, false, false) ??
        getSocket(anyCondition, false, false)
      );
    }
    // node does not have an in/output socket
    return undefined;
  }

  protected async mouseReleasedOverWithSourceSocketSelected(
    source: Socket,
  ): Promise<void> {
    await connectNodeToSocket(source, this);
  }

  onPointerUp(event: PIXI.FederatedPointerEvent): void {
    const source = PPGraph.currentGraph.selectedSourceSocket;
    if (source && this !== source.getNode()) {
      PPGraph.currentGraph.selectedSourceSocket = null; // hack // ????
      this.mouseReleasedOverWithSourceSocketSelected(source);
    }
    PPGraph.currentGraph.selection.stopDragAction();
  }

  protected onViewportMove(): void {
    if (this.onNodeDragOrViewportMove) {
      const screenPointBackgroundRectTopLeft =
        this.screenPointBackgroundRectTopLeft();
      this.onNodeDragOrViewportMove({
        screenX: screenPointBackgroundRectTopLeft.x,
        screenY: screenPointBackgroundRectTopLeft.y,
        scale: PPGraph.currentGraph.viewportScaleX,
      });
    }
  }

  async onRemoved(): Promise<void> {
    // remove added listener from graph.viewport
    PPGraph.currentGraph.viewport.removeEventListener(
      'moved',
      this.onViewportMoveHandler,
    );
    this.listenId.forEach((id) => InterfaceController.removeListener(id));

    await Promise.all(
      this.getAllSockets().map(async (socket) => {
        await Promise.all(
          socket.links.map(async (link) => await link.delete()),
        );
      }),
    );

    this.onNodeRemoved();
  }

  pointerOverMoving(): void {
    this.getAllSockets().forEach((socket) => socket.pointerOverSocketMoving());
  }

  onPointerOver(): void {
    this.isHovering = true;
    this.updateBehaviour.redrawAnythingChanging();
    this.nodeSelectionHeader.redrawAnythingChanging(true);
    this.addEventListener('pointermove', this.pointerOverMoving);

    this.getAllSockets().forEach((socket) => socket.nodeHoveredOver());
  }

  onPointerOut(): void {
    this.isHovering = false;
    this.removeEventListener('pointermove', this.pointerOverMoving);
    this.updateBehaviour.redrawAnythingChanging();
    this.nodeSelectionHeader.redrawAnythingChanging(false);
    this.getAllSockets().forEach((socket) => socket.nodeHoveredOut());
  }

  onPointerClick(event: PIXI.FederatedPointerEvent): void {
    this.listenId.push(
      InterfaceController.addListener(
        ListenEvent.GlobalPointerUp,
        this.onViewportPointerUpHandler,
      ),
    );
    // check if double clicked
    if (event.detail === ONCLICK_DOUBLECLICK) {
      this.doubleClicked = true;
      this.listenId.push(
        InterfaceController.addListener(
          ListenEvent.EscapeKeyUsed,
          this.onViewportPointerUpHandler,
        ),
      );
      if (this.onNodeDoubleClick) {
        this.onNodeDoubleClick(event);
      }
    }
  }

  onViewportPointerUp(): void {
    this.listenId.forEach((id) => InterfaceController.removeListener(id));
    this.doubleClicked = false;
  }

  public hasSocketNameInDefaultIO(name: string, type: TSocketType): boolean {
    return (
      this.getAllInitialSockets().find(
        (socket) => socket.name == name && socket.socketType == type,
      ) !== undefined
    );
  }

  public async invokeMacro(name: string, args: any[]): Promise<any> {
    return await PPGraph.currentGraph.invokeMacro(name, args);
  }

  // mean to be overridden with custom behaviour

  public metaInfoChanged(): void {
    this.resizeAndDraw();
    this.updateConnectionPosition();
  }

  // This is the main one you'll want to override this in child classes
  protected async onExecute(input, output): Promise<void> {
    // just define function
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, true, false, 1000, this);
  }

  public allowResize(): boolean {
    return true;
  }

  public shouldShowResizeRectangleEvenWhenMultipleNodesAreSelected(): boolean {
    return false;
  }

  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return false;
  }

  protected getDefaultIO(): Socket[] {
    return [];
  }

  ////////////////////////////// Meant to be overriden for visual/behavioral needs

  public selectableViaBounds(): boolean {
    return true;
  }

  protected getShowLabels(): boolean {
    return true;
  }

  public getDefaultNodeWidth(): number {
    return this.getMinNodeWidth();
  }

  public getDefaultNodeHeight(): number {
    return this.getMinNodeHeight();
  }

  public getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.DEFAULT);
  }

  public getSocketDisplayName(socket: Socket): string {
    return socket.name;
  }

  // for hybrid/transparent nodes, set this value to 0.01, if set to 0, the node is not clickable/selectable anymore
  public getOpacity(): number {
    return 1;
  }
  protected shouldExecuteOnMove(): boolean {
    return false;
  }

  public getCanAddInput(): boolean {
    return false;
  }

  protected getShouldShowHoverActions(): boolean {
    return true;
  }

  public getParallelInputsOutputs(): boolean {
    return false;
  }

  public getRoundedCorners(): boolean {
    return true;
  }

  getPreferredInputSocketName(): string {
    return 'MyPreferredInputSocket';
  }

  getPreferredOutputSocketName(): string {
    return 'MyPreferredOutputSocket';
  }

  public getInputSocketXPos(): number {
    return 0;
  }
  public getOutputSocketXPos(): number {
    return this.nodeWidth;
  }

  public getAddOutputDescription(): string {
    return 'Add Output';
  }

  public getShrinkOnSocketRemove(): boolean {
    return true;
  }

  public getAdditionalRightClickOptions(): any {
    return {};
  }

  public isCallingMacro(macroName: string): boolean {
    return false;
  }

  public async calledMacroUpdated(): Promise<void> {
    if (this.updateBehaviour.update) {
      await this.executeOptimizedChain();
    }
  }

  // we should migrate all nodes to use these functions instead of specifying the field themselves in constructor
  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return '';
  }

  // displayed in the info tab and can contain HTML
  // not visible when searching nodes
  public getAdditionalDescription(): string {
    return '';
  }

  // enable if a node example graph exists on github
  public hasExample(): boolean {
    return false;
  }

  // used when searching for nodes
  public getTags(): string[] {
    return [];
  }

  public propagateExecutionPast(): boolean {
    return true;
  }

  public getPreferredNodesPerSocket(): Map<string, string[]> {
    return new Map();
  }

  // observers

  // called when this node specifically is clicked (not just when part of the current selection)
  public onSpecificallySelected(): void {
    // override if you care about this event
  }
  public socketTypeChanged(): void {
    // override if you care about this event
  }
  public nameChanged(newName: string): void {
    // override if you care about this event
  }
  public async inputPlugged(): Promise<void> {
    // override if you care about this event
  }

  public async inputUnplugged(): Promise<void> {
    // override if you care about this event
  }
  public async outputPlugged(): Promise<void> {
    // override if you care about this event
  }
  public async outputUnplugged(): Promise<void> {
    // override if you care about this event
  }
  public nodeKeyEvent(e: KeyboardEvent): void {
    // override if you care about this event
  }

  public populateDefaults(socket: Socket): void {
    // override if you care about this event
  }

  // these are imported before node is added to the graph
  public getDynamicImports(): string[] {
    return [];
  }

  getSelectionBounds() : PIXI.Rectangle{
    const EXTRA_NODE_SELECTION_MARGIN = 20;
    const bounds = new PIXI.Rectangle(this._BackgroundGraphicsRef.x + this.x, this._BackgroundGraphicsRef.y + this.y, this._BackgroundGraphicsRef.width, this._BackgroundGraphicsRef.height);
    bounds.x -= EXTRA_NODE_SELECTION_MARGIN/2;
    bounds.y -= EXTRA_NODE_SELECTION_MARGIN;
    bounds.width += EXTRA_NODE_SELECTION_MARGIN*1.5;
    bounds.height += EXTRA_NODE_SELECTION_MARGIN*2;
    return bounds;

  }
}

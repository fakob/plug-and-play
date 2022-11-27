/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-this-alias */
import * as PIXI from 'pixi.js';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import { hri } from 'human-readable-ids';
import '../pixi/dbclick.js';
import {
  CustomArgs,
  SerializedNode,
  SerializedSocket,
  TRgba,
  TSocketType,
} from '../utils/interfaces';
import {
  COMMENT_TEXTSTYLE,
  NODE_TYPE_COLOR,
  NODE_CORNERRADIUS,
  NODE_HEADER_HEIGHT,
  NODE_HEADER_TEXTMARGIN_LEFT,
  NODE_HEADER_TEXTMARGIN_TOP,
  NODE_MARGIN,
  NODE_PADDING_BOTTOM,
  NODE_PADDING_TOP,
  NODE_TEXTSTYLE,
  NODE_WIDTH,
  SOCKET_HEIGHT,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../utils/constants';
import UpdateBehaviourClass from './UpdateBehaviourClass';
import NodeSelectionHeaderClass from './NodeSelectionHeaderClass';
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
import throttle from 'lodash/throttle';
import FlowLogic from './FlowLogic';

export default class PPNode extends PIXI.Container {
  _NodeNameRef: PIXI.Text;
  _BackgroundRef: PIXI.Graphics;
  _CommentRef: PIXI.Graphics;
  clickedSocketRef: Socket;
  isHovering: boolean;

  id: string;
  type: string; // Type
  nodePosX: number;
  nodePosY: number;
  nodeWidth: number;
  nodeHeight: number;

  updateBehaviour: UpdateBehaviourClass;
  nodeSelectionHeader: NodeSelectionHeaderClass;
  lastTimeTicked = 0;

  successfullyExecuted = true;
  lastError = '';

  inputSocketArray: Socket[];
  nodeTriggerSocketArray: Socket[];
  outputSocketArray: Socket[];

  _doubleClicked: boolean;
  isDraggingNode: boolean;
  sourcePoint: PIXI.Point;
  interactionData: PIXI.InteractionData;

  // supported callbacks
  onConfigure: (nodeConfig: SerializedNode) => void = () => {}; // called after the node has been configured
  onNodeDoubleClick: (event: PIXI.InteractionEvent) => void = () => {};
  onMoveHandler: (event?: PIXI.InteractionEvent) => void = () => {};
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void = () => {};
  onViewportPointerUpHandler: (event?: PIXI.InteractionEvent) => void =
    () => {};
  onNodeRemoved: () => void = () => {}; // called when the node is removed from the graph
  onNodeDragging: (isDraggingNode: boolean) => void = () => {}; // called when the node is being dragged
  onNodeResize: (width: number, height: number) => void = () => {}; // called when the node is resized
  onNodeDragOrViewportMove: // called when the node or or the viewport with the node is moved or scaled
  (positions: { screenX: number; screenY: number; scale: number }) => void =
    () => {};

  // called when the node is added to the graph
  public onNodeAdded(): void {
    this.resizeAndDraw(this.getDefaultNodeWidth(), this.getDefaultNodeHeight());
  }
  public executeOnPlace(): boolean {
    return true;
  }

  protected onNodeExit(): void {}

  protected getShowLabels(): boolean {
    return true;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

  // we should migrate all nodes to use these functions instead of specifying the field themselves in constructor
  public getName(): string {
    return this.name;
  }
  public getDescription(): string {
    return '';
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

  public getDefaultNodeWidth(): number {
    return this.getMinNodeWidth();
  }

  public getDefaultNodeHeight(): number {
    return this.getMinNodeHeight();
  }

  public getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.DEFAULT);
  }

  // for hybrid/transparent nodes, set this value to 0.01, if set to 0, the node is not clickable/selectable anymore
  public getOpacity(): number {
    return 1;
  }
  protected shouldExecuteOnMove(): boolean {
    return false;
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(true, false, 1000);
  }

  protected getDefaultIO(): Socket[] {
    return [];
  }

  public getCanAddInput(): boolean {
    return false;
  }

  protected getShouldShowHoverActions(): boolean {
    return true;
  }

  public getNodeTextString(): string {
    if (this.name !== this.type) {
      return this.name + '\t(' + this.type + ')';
    }
    return this.name;
  }

  public getParallelInputsOutputs(): boolean {
    return false;
  }

  public getRoundedCorners(): boolean {
    return true;
  }

  public nodeKeyEvent(e: KeyboardEvent): void {}

  get nodeName(): string {
    return this.name;
  }

  set nodeName(text: string) {
    this.name = text;
    this._NodeNameRef.text = this.getNodeTextString();
    this.nameChanged(text);
  }

  constructor(type: string, customArgs?: CustomArgs) {
    super();
    this.id = customArgs?.overrideId || hri.random();
    this.name = type;
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
    this.isHovering = false;

    const inputNameText = new PIXI.Text(
      this.getNodeTextString(),
      NODE_TEXTSTYLE
    );
    inputNameText.x = NODE_HEADER_TEXTMARGIN_LEFT;
    inputNameText.y = NODE_PADDING_TOP + NODE_HEADER_TEXTMARGIN_TOP;
    inputNameText.resolution = 8;

    const background = new PIXI.Graphics();
    background.filters = [
      new DropShadowFilter({
        distance: 2,
        alpha: 0.2,
        blur: 1,
      }),
    ];

    this._BackgroundRef = this.addChild(background);
    this._NodeNameRef = this.addChild(inputNameText);
    this._CommentRef = this.addChild(new PIXI.Graphics());

    this.updateBehaviour = this.getUpdateBehaviour();
    if (this.getShouldShowHoverActions()) {
      this.addChild(this.updateBehaviour);
    }
    this.updateBehaviour.x = NODE_MARGIN;
    this.updateBehaviour.y = -24;

    this.nodeSelectionHeader = new NodeSelectionHeaderClass();
    if (this.getShouldShowHoverActions()) {
      this.addChild(this.nodeSelectionHeader);
    }
    this.nodeSelectionHeader.x = NODE_MARGIN + this.nodeWidth - 72;
    this.nodeSelectionHeader.y = -24;

    // do not show the node name
    if (!this.getShowLabels()) {
      this._NodeNameRef.alpha = 0;
    }

    // add static inputs and outputs
    this.getDefaultIO().forEach((IO) => {
      // add in default data if supplied
      const newDefault = customArgs?.defaultArguments?.[IO.name];
      if (newDefault) {
        IO.data = newDefault;
      }
      this.addSocket(IO);
    });

    this.interactive = true;
    this.isDraggingNode = false;
    this._doubleClicked = false;

    this._addListeners();

    // define callbacks
    this.onNodeDragging = (isDraggingNode: boolean) => {};
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
    return this.getShowLabels() ? NODE_PADDING_TOP + NODE_HEADER_HEIGHT : 0;
  }

  getSourceCode(): string {
    return this.constructor.toString();
  }

  addSocket(socket: Socket): void {
    const socketRef = this.addChild(socket);
    switch (socket.socketType) {
      case SOCKET_TYPE.IN: {
        this.inputSocketArray.push(socketRef);
        break;
      }
      case SOCKET_TYPE.OUT: {
        this.outputSocketArray.push(socketRef);
        break;
      }
    }
  }

  removeSocket(socket: Socket): void {
    const checkAndRemoveFrom = (nameOfArrayToCheck: string): void => {
      this[nameOfArrayToCheck] = this[nameOfArrayToCheck].filter(
        (socketRef: Socket) =>
          !(
            socketRef.name === socket.name &&
            socketRef.socketType === socket.socketType
          )
      );
    };

    socket.removeLink();

    //remove from arrays
    checkAndRemoveFrom('nodeTriggerSocketArray');
    checkAndRemoveFrom('inputSocketArray');
    checkAndRemoveFrom('outputSocketArray');
    this.resizeAndDraw();

    socket.destroy();
  }

  addTriggerSocket(socket: Socket): void {
    const socketRef = this.addChild(socket);
    this.nodeTriggerSocketArray.push(socketRef);
    return;
  }

  getDefaultType(): AbstractType {
    return new AnyType();
  }

  getPreferredInputSocketName(): string {
    return 'MyPreferredInputSocket';
  }

  getPreferredOutputSocketName(): string {
    return 'MyPreferredOutputSocket';
  }

  addInput(
    name: string,
    type: AbstractType,
    data?: unknown,
    visible?: boolean,
    custom?: Record<string, any>, // lets get rid of this ASAP
    isNodeTrigger = false,
    redraw = true
  ): void {
    if (isNodeTrigger) {
      this.addTriggerSocket(
        new Socket(SOCKET_TYPE.IN, name, type, data, visible, custom)
      );
    } else {
      this.addSocket(
        new Socket(SOCKET_TYPE.IN, name, type, data, visible, custom)
      );
    }
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
    redraw = true
  ): void {
    this.addSocket(
      new Socket(
        SOCKET_TYPE.OUT,
        name,
        type,
        null, // need to get rid of this
        visible
      )
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
      triggerArray: this.nodeTriggerSocketArray.map((socket) =>
        socket.serialize()
      ),
      socketArray: this.getDataSockets().map((socket) => socket.serialize()),
      updateBehaviour: {
        update: this.updateBehaviour.update,
        interval: this.updateBehaviour.interval,
        intervalFrequency: this.updateBehaviour.intervalFrequency,
      },
    };

    return node;
  }

  configure(nodeConfig: SerializedNode): void {
    this.x = nodeConfig.x;
    this.y = nodeConfig.y;
    this.nodeWidth = nodeConfig.width || this.getMinNodeWidth();
    this.nodeHeight = nodeConfig.height || this.getMinNodeHeight();
    this.nodeName = nodeConfig.name;
    this.updateBehaviour.setUpdateBehaviour(
      nodeConfig.updateBehaviour.update,
      nodeConfig.updateBehaviour.interval,
      nodeConfig.updateBehaviour.intervalFrequency
    );
    try {
      const mapSocket = (item: SerializedSocket, isNodeTrigger = false) => {
        const matchingSocket =
          item.socketType === SOCKET_TYPE.IN
            ? this.getInputSocketByName(item.name)
            : this.getOutputSocketByName(item.name);
        if (matchingSocket !== undefined) {
          matchingSocket.dataType = deSerializeType(item.dataType);
          this.initializeType(item.name, matchingSocket.dataType);
          matchingSocket.data = item.data;
          matchingSocket.defaultData = item.defaultData ?? item.data;
          matchingSocket.setVisible(item.visible);
        } else {
          // add socket if it does not exist yet
          console.info(
            `Socket does not exist (yet) and will be created: ${this.name}(${this.id})/${item.name}`
          );
          if (isNodeTrigger) {
            this.addTriggerSocket(
              new Socket(
                item.socketType,
                item.name,
                deSerializeType(item.dataType),
                item.data,
                item.visible
              )
            );
          } else {
            this.addSocket(
              new Socket(
                item.socketType,
                item.name,
                deSerializeType(item.dataType),
                item.data,
                item.visible
              )
            );
          }
          this.resizeAndDraw();
        }
      };

      const nodeTriggerSockets = nodeConfig.triggerArray;
      nodeTriggerSockets.forEach((item) => mapSocket(item, true));

      const sockets = nodeConfig.socketArray;
      sockets.forEach((item) => mapSocket(item));
    } catch (error) {
      console.error(
        `Could not configure node: ${this.name}(${this.id})`,
        error
      );
    }

    //this.executeOptimizedChain();
    this.resizeAndDraw();
    this.onConfigure(nodeConfig);
  }

  getDirectDependents(): { [key: string]: PPNode } {
    const currDependents: { [key: string]: PPNode } = {};
    this.outputSocketArray.forEach((socket) => {
      Object.values(socket.getDirectDependents()).forEach((dependent) => {
        currDependents[dependent.id] = dependent;
      });
    });
    return currDependents;
  }

  getHasDependencies(): boolean {
    return (
      this.getAllInputSockets().find((socket) => socket.hasLink()) !== undefined
    );
  }

  async executeOptimizedChain(): Promise<void> {
    await FlowLogic.executeOptimizedChainBatch([this]);
  }

  async executeChildren(): Promise<void> {
    this.drawComment();
    await FlowLogic.executeOptimizedChainBatch(
      Object.values(this.getDirectDependents())
    );
  }

  public setPosition(x: number, y: number, isRelative = false): void {
    this.x = isRelative ? this.x + x : x;
    this.y = isRelative ? this.y + y : y;

    this.updateConnectionPosition();

    if (this.shouldExecuteOnMove()) {
      this.executeOptimizedChain();
    }

    const screenPoint = this.screenPoint();
    this.onNodeDragOrViewportMove({
      screenX: screenPoint.x,
      screenY: screenPoint.y,
      scale: PPGraph.currentGraph.viewportScaleX,
    });
  }

  resizeAndDraw(
    width: number = this.nodeWidth,
    height: number = this.nodeHeight,
    maintainAspectRatio = false
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
        this.getMinNodeHeight()
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

    this.nodeSelectionHeader.x = NODE_MARGIN + this.nodeWidth - 72;

    this.onNodeResize(this.nodeWidth, this.nodeHeight);
  }

  public resetSize(): void {
    this.resizeAndDraw(this.getDefaultNodeWidth(), this.getDefaultNodeHeight());
  }

  public getAllInputSockets(): Socket[] {
    return this.inputSocketArray.concat(this.nodeTriggerSocketArray);
  }

  getDataSockets(): Socket[] {
    return this.inputSocketArray.concat(this.outputSocketArray);
  }

  getAllSockets(): Socket[] {
    return this.inputSocketArray.concat(
      this.outputSocketArray,
      this.nodeTriggerSocketArray
    );
  }

  public getSocketByName(name: string): Socket {
    return this.getAllSockets().find((socket) => socket.name === name);
  }

  public drawErrorBoundary(): void {
    this._BackgroundRef.beginFill(
      new TRgba(255, 0, 0).hexNumber(),
      this.getOpacity()
    );
    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN - 3,
      -3,
      this.nodeWidth + 6,
      this.nodeHeight + 6,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );
  }

  public drawBackground(): void {
    this._BackgroundRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity()
    );
    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      this.nodeWidth,
      this.nodeHeight,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );
    this._BackgroundRef.endFill();
  }

  public drawTriggers(): void {
    this.nodeTriggerSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y = this.headerHeight + index * SOCKET_HEIGHT;
        item.showLabel = this.getShowLabels();
        item.redrawAnythingChanging();
      });
  }

  public getInputSocketXPos(): number {
    return 0;
  }
  public getOutputSocketXPos(): number {
    return this.nodeWidth;
  }

  public drawSockets(): void {
    // redraw outputs
    this.outputSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y =
          this.headerHeight +
          (!this.getParallelInputsOutputs()
            ? this.countOfVisibleNodeTriggerSockets * SOCKET_HEIGHT
            : 0) +
          index * SOCKET_HEIGHT;
        item.showLabel = this.getShowLabels();
        item.redrawAnythingChanging();
      });

    // redraw inputs
    this.inputSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y =
          this.headerHeight +
          (!this.getParallelInputsOutputs()
            ? this.countOfVisibleNodeTriggerSockets * SOCKET_HEIGHT +
              this.countOfVisibleOutputSockets * SOCKET_HEIGHT
            : 0) +
          index * SOCKET_HEIGHT;
        item.showLabel = this.getShowLabels();
        item.redrawAnythingChanging();
      });
  }

  public drawNodeShape(): void {
    this._BackgroundRef.clear();
    if (!this.successfullyExecuted) {
      this.drawErrorBoundary();
    }
    this.drawBackground();

    this.drawTriggers();
    this.drawSockets();
    this.drawComment();

    // update selection
    if (PPGraph.currentGraph.selection.isNodeSelected(this)) {
      PPGraph.currentGraph.selection.drawRectanglesFromSelection();
    }
  }

  constructSocketName(prefix: string, existing: Socket[]): string {
    let count = 1;
    let newName = prefix + ' ' + count;
    while (existing.find((socket) => socket.name === newName)) {
      newName = prefix + ' ' + count++;
    }
    return newName;
  }

  public addTriggerInput(): void {
    this.addInput(
      this.constructSocketName('Trigger', this.nodeTriggerSocketArray),
      new TriggerType(TRIGGER_TYPE_OPTIONS[0].value),
      0,
      true,
      undefined,
      true
    );
    this.updateBehaviour.update = false; // turn off "Update on change"
  }

  public addDefaultInput(): void {
    this.addInput(
      this.constructSocketName('Custom Input', this.inputSocketArray),
      new AnyType()
    );
  }

  public getAddOutputDescription(): string {
    return 'Add Output';
  }

  public getCanAddOutput(): boolean {
    return false;
  }
  public addDefaultOutput(): void {
    this.addOutput(
      this.constructSocketName('Custom Output', this.outputSocketArray),
      new AnyType()
    );
  }

  updateConnectionPosition(): void {
    // check for connections and move them too
    this.getAllSockets().forEach((socket) => {
      socket.links.map((link) => {
        link.updateConnection();
      });
    });
  }

  drawComment(): void {
    this._CommentRef.removeChildren();
    if (PPGraph.currentGraph._showComments) {
      let commentData = this.outputSocketArray[0]?.dataType?.getComment(
        this.outputSocketArray[0]?.data
      );
      if (commentData !== undefined && commentData.length > 10000) {
        commentData = 'Too long to display';
      }
      const debugText = new PIXI.Text(
        `${this.id}
${Math.round(this.transform.position.x)}, ${Math.round(
          this.transform.position.y
        )}
${Math.round(this._bounds.minX)}, ${Math.round(
          this._bounds.minY
        )}, ${Math.round(this._bounds.maxX)}, ${Math.round(this._bounds.maxY)}`,
        COMMENT_TEXTSTYLE
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
    if (!this.successfullyExecuted) {
      const errorText = new PIXI.Text(this.lastError);
      errorText.x = -50;
      errorText.y = -50;
      errorText.style.fill = new TRgba(255, 128, 128).hexNumber();
      errorText.style.fontSize = 18;
      this._CommentRef.addChild(errorText);
    }
  }

  screenPoint(): PIXI.Point {
    return PPGraph.currentGraph.viewport.toScreen(this.x + NODE_MARGIN, this.y);
  }

  getInputSocketByName(slotName: string): Socket {
    return this.getAllInputSockets()[
      this.getAllInputSockets().findIndex((el) => el.name === slotName)
    ];
  }

  getOutputSocketByName(slotName: string): Socket {
    return this.outputSocketArray[
      this.outputSocketArray.findIndex((el) => el.name === slotName)
    ];
  }

  // avoid calling this directly when possible
  public getInputData(name: string): any {
    const inputSocket = this.inputSocketArray.find((input: Socket) => {
      return name === input.name;
    });

    if (!inputSocket) {
      console.error('No input socket found with the name: ', name);
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

  // avoid calling this directly, instead use the input/output objects in onExecute
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
  }

  // override if you don't want your node to show outline for some reason
  public shouldDrawExecution(): boolean {
    return true;
  }

  public renderOutlineThrottled = throttle(this.renderOutline, 2000, {
    trailing: false,
    leading: true,
  });

  private renderOutline(iterations = 30, interval = 16.67): void {
    // const iterations = 30;
    // const interval = 16.67;
    const activeExecution = new PIXI.Graphics();
    this.addChild(activeExecution);
    for (let i = 1; i <= iterations; i++) {
      setTimeout(() => {
        activeExecution.clear();
        if (this.successfullyExecuted) {
          activeExecution.beginFill(
            PIXI.utils.string2hex('#CCFFFF'),
            0.4 - i * (0.4 / iterations)
          );
        } else {
          activeExecution.beginFill(
            new TRgba(255, 0, 0).hexNumber(),
            1.0 - i * (1.0 / iterations)
          );
        }

        activeExecution.drawRoundedRect(
          NODE_MARGIN,
          0,
          this.nodeWidth,
          this.nodeHeight,
          this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
        );
        activeExecution.endFill();
        if (i == iterations) {
          this.removeChild(activeExecution);
        }
      }, i * interval);
    }
  }

  // Don't call this from outside unless you know very well what you are doing, you are probably looking for executeOptimizedChain()
  public async execute(): Promise<void> {
    const executedSuccessOld = this.successfullyExecuted;
    try {
      this.successfullyExecuted = true;
      if (
        PPGraph.currentGraph.showExecutionVisualisation &&
        this.shouldDrawExecution()
      ) {
        this.renderOutlineThrottled();
      }
      await this.rawExecute();
      this.drawComment();
    } catch (error) {
      this.lastError = error;
      console.log('node ' + this.id + ' execution error: ' + error);
      this.successfullyExecuted = false;
    }
    if (
      executedSuccessOld !== this.successfullyExecuted ||
      !this.successfullyExecuted
    ) {
      this.resizeAndDraw();
    }
  }

  // dont call this from outside, just override it in child class
  protected async onExecute(input, output): Promise<void> {
    // just define function
  }

  // helper function for nodes who want execution to just be a passthrough
  protected async passThrough(input, output): Promise<void> {
    Object.keys(input).forEach((key) => {
      output[key] = input[key];
    });
  }

  // SETUP

  _addListeners(): void {
    this.on('pointerdown', this._onPointerDown.bind(this));
    this.on('pointerup', this._onPointerUp.bind(this));
    this.on('pointerover', this._onPointerOver.bind(this));
    this.on('pointerout', this._onPointerOut.bind(this));
    this.on('dblclick', this._onDoubleClick.bind(this));
    this.on('removed', this._onRemoved.bind(this));

    // first assign the bound function to a handler then add this handler as a listener
    // otherwise removeListener won't work (bind creates a new function)
    this.onViewportMoveHandler = this._onViewportMove.bind(this);
    PPGraph.currentGraph.viewport.on(
      'moved',
      (this as any).onViewportMoveHandler
    );
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    event.stopPropagation();
    const node = event.target as PPNode;

    if (node.clickedSocketRef === null) {
      // start dragging the node

      const shiftKey = event.data.originalEvent.shiftKey;

      // select node if the shiftKey is pressed
      // or the node is not yet selected
      if (shiftKey || !this.selected) {
        PPGraph.currentGraph.selection.selectNodes([this], shiftKey, true);
      }
      PPGraph.currentGraph.selection.startDragAction(event);
    }
  }

  _onPointerUp(): void {
    const source = PPGraph.currentGraph.selectedSourceSocket;
    if (source && this !== source.getNode()) {
      PPGraph.currentGraph.selectedSourceSocket = null; // hack
      connectNodeToSocket(source, this);
    }
    if (PPGraph.currentGraph.selection.isDraggingSelection) {
      PPGraph.currentGraph.selection.stopDragAction();
    }
  }

  protected _onViewportMove(): void {
    if (this.onNodeDragOrViewportMove) {
      const screenPoint = this.screenPoint();
      this.onNodeDragOrViewportMove({
        screenX: screenPoint.x,
        screenY: screenPoint.y,
        scale: PPGraph.currentGraph.viewportScaleX,
      });
    }
  }

  _onRemoved(): void {
    // remove added listener from graph.viewport
    PPGraph.currentGraph.viewport.removeListener(
      'moved',
      this.onViewportMoveHandler
    );

    this.getAllSockets().forEach((socket) => {
      socket.links.forEach((link) => link.delete());
    });

    this.onNodeRemoved();
  }

  _onPointerOver(): void {
    this.isHovering = true;
    this.updateBehaviour.redrawAnythingChanging();
    this.nodeSelectionHeader.redrawAnythingChanging(true);

    this.getAllSockets().forEach((socket) =>
      socket.links.forEach((link) => link.nodeHoveredOver())
    );
  }

  _onPointerOut(): void {
    if (!this.isDraggingNode) {
      this.isHovering = false;
      this.alpha = 1.0;
    }
    this.updateBehaviour.redrawAnythingChanging();
    this.nodeSelectionHeader.redrawAnythingChanging(false);
    this.getAllSockets().forEach((socket) =>
      socket.links.forEach((link) => link.nodeHoveredOut())
    );
  }

  _onDoubleClick(event: PIXI.InteractionEvent): void {
    this.doubleClicked = true;

    if (this.onNodeDoubleClick) {
      this.onNodeDoubleClick(event);
    }
  }

  _onViewportPointerUp(): void {}

  public hasSocketNameInDefaultIO(name: string, type: TSocketType): boolean {
    return (
      this.getDefaultIO().find(
        (socket) => socket.name == name && socket.socketType == type
      ) !== undefined
    );
  }

  public async invokeMacro(inputObject: any): Promise<any> {
    return await PPGraph.currentGraph.invokeMacro(inputObject);
  }

  public metaInfoChanged(): void {
    this.resizeAndDraw();
    this.updateConnectionPosition();
  }

  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return false;
  }

  // observers
  public socketTypeChanged(): void {}
  public nameChanged(newName: string): void {}
  public outputPlugged(): void {}
  public outputUnplugged(): void {}

  // kinda hacky but some cant easily serialize functions in JS
  protected initializeType(socketName: string, datatype: any) {}
}

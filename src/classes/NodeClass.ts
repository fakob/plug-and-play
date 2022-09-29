/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-this-alias */
import * as PIXI from 'pixi.js';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import { hri } from 'human-readable-ids';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import '../pixi/dbclick.js';

import styles from '../utils/style.module.css';
import {
  CustomArgs,
  SerializedNode,
  SerializedSocket,
  TRgba,
  TSocketType,
} from '../utils/interfaces';
import {
  COMMENT_TEXTSTYLE,
  RANDOMMAINCOLOR,
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
  minNodeWidth: number;
  minNodeHeight: number;
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

  root: Root;
  static: HTMLElement;
  staticRoot: Root;

  // supported callbacks
  onConfigure: (nodeConfig: SerializedNode) => void = () => {}; // called after the node has been configured
  onNodeDoubleClick: (event: PIXI.InteractionEvent) => void = () => {};
  onMoveHandler: (event?: PIXI.InteractionEvent) => void = () => {};
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void = () => {};
  onViewportPointerUpHandler: (event?: PIXI.InteractionEvent) => void =
    () => {};
  onNodeAdded: () => void = () => {}; // called when the node is added to the graph
  onNodeRemoved: () => void = () => {}; // called when the node is removed from the graph
  onNodeDragging: (isDraggingNode: boolean) => void = () => {}; // called when the node is being dragged
  onNodeResize: (width: number, height: number) => void = () => {}; // called when the node is resized
  onNodeResized: () => void = () => {}; // called when the node resize ended
  onNodeDragOrViewportMove: // called when the node or or the viewport with the node is moved or scaled
  (positions: { screenX: number; screenY: number; scale: number }) => void =
    () => {};

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

  public getNodeWidth(): number {
    return NODE_WIDTH;
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

  getNodeHeight(): number {
    return this.nodeHeight === undefined
      ? this.calculatedMinNodeHeight
      : Math.max(this.nodeHeight, this.calculatedMinNodeHeight);
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

  get nodeName(): string {
    return this.name;
  }

  set nodeName(text: string) {
    this.name = text;
    this._NodeNameRef.text = this.getNodeTextString();
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
    this.nodeWidth = customArgs?.nodeWidth ?? this.getNodeWidth();
    this.minNodeWidth = customArgs?.minNodeWidth ?? this.nodeWidth;
    this.nodeHeight = customArgs?.nodeHeight; // if not set height is defined by in/out sockets
    this.minNodeHeight = customArgs?.minNodeHeight;
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

    // draw shape
    this.drawNodeShape();

    this.interactive = true;
    this.isDraggingNode = false;
    this._doubleClicked = false;

    this._addListeners();

    // define callbacks
    this.onNodeDragging = (isDraggingNode: boolean) => {};
  }

  // GETTERS & SETTERS

  get nodeNameRef(): PIXI.DisplayObject {
    return this._NodeNameRef;
  }

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

  get calculatedMinNodeHeight(): number {
    const minHeight =
      this.headerHeight +
      this.countOfVisibleNodeTriggerSockets * SOCKET_HEIGHT +
      this.countOfVisibleInputSockets * SOCKET_HEIGHT +
      this.countOfVisibleOutputSockets * SOCKET_HEIGHT +
      NODE_PADDING_BOTTOM;
    return this.minNodeHeight === undefined
      ? minHeight
      : Math.max(minHeight, this.minNodeHeight);
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
    isNodeTrigger = false
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
    this.drawNodeShape();
  }

  addOutput(
    name: string,
    type: AbstractType, // but really its AbstractTypeabstracttype
    visible?: boolean,
    custom?: Record<string, any>
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
    this.drawNodeShape();
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
      minWidth: this.minNodeWidth,
      minHeight: this.minNodeHeight,
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
    this.nodeName = nodeConfig.name;
    this.minNodeWidth = nodeConfig.minWidth ?? this.getNodeWidth();
    this.minNodeHeight = nodeConfig.minHeight;
    this.updateBehaviour.setUpdateBehaviour(
      nodeConfig.updateBehaviour.update,
      nodeConfig.updateBehaviour.interval,
      nodeConfig.updateBehaviour.intervalFrequency
    );
    try {
      if (nodeConfig.width && nodeConfig.height) {
        this.resizeNode(nodeConfig.width, nodeConfig.height);
        this.resizedNode();
      }

      const mapSocket = (item: SerializedSocket, isNodeTrigger = false) => {
        const matchingSocket =
          item.socketType === SOCKET_TYPE.IN
            ? this.getInputSocketByName(item.name)
            : this.getOutputSocketByName(item.name);
        if (matchingSocket !== undefined) {
          matchingSocket.dataType = deSerializeType(item.dataType);
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
        }
      };

      const nodeTriggerSockets = nodeConfig.triggerArray;
      nodeTriggerSockets.forEach((item) => mapSocket(item, true));

      const sockets = nodeConfig.socketArray;
      sockets.forEach((item) => mapSocket(item));

      this.drawNodeShape();
    } catch (error) {
      console.error(
        `Could not configure node: ${this.name}(${this.id})`,
        error
      );
    }

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

  goThroughSockets(
    currDependents: { [key: string]: PPNode },
    socketArray: Socket[],
    upstream = false
  ): void {
    socketArray.forEach((socket) => {
      Object.values(socket.getLinkedNodes(upstream)).forEach((dependent) => {
        currDependents[dependent.id] = dependent;
      });
    });
  }

  getLinkedNodes(
    includeUpstream = false,
    includeDownstream = true
  ): { [key: string]: PPNode } {
    const currDependents: { [key: string]: PPNode } = {};

    if (includeUpstream) {
      this.goThroughSockets(currDependents, this.getAllInputSockets(), true);
    }
    if (includeDownstream) {
      this.goThroughSockets(currDependents, this.outputSocketArray);
    }
    return currDependents;
  }

  getHasDependencies(): boolean {
    return (
      this.getAllInputSockets().find((socket) => socket.hasLink()) !== undefined
    );
  }

  static combineNumDependings(
    numDepending1: { [key: string]: Set<string> },
    numDepending2: { [key: string]: Set<string> }
  ): void {
    Object.keys(numDepending2).forEach((childDependent) => {
      if (numDepending1[childDependent] === undefined) {
        numDepending1[childDependent] = numDepending2[childDependent];
      } else {
        numDepending2[childDependent].forEach((childDependentKey) => {
          numDepending1[childDependent].add(childDependentKey);
        });
      }
    });
  }

  aggregateDependents(dependents: { [key: string]: PPNode }): {
    [key: string]: Set<string>;
  } {
    // don't add from same node several times
    if (dependents[this.id] !== undefined) {
      return {};
    }
    const currDependents: { [key: string]: PPNode } =
      this.getDirectDependents();

    dependents[this.id] = this;

    // populate dependents

    const numDepending: { [key: string]: Set<string> } = {};
    Object.keys(currDependents).forEach((dependentKey) => {
      numDepending[dependentKey] = new Set();
      numDepending[dependentKey].add(this.id);
    });

    // accumulate results from children and merge with mine
    Object.values(currDependents).forEach((dependent) => {
      const result = dependent.aggregateDependents(dependents);
      PPNode.combineNumDependings(numDepending, result);
    });

    return numDepending;
  }

  getAllUpDownstreamNodes(
    includeUpstream: boolean,
    includeDownstream: boolean,
    wholeBranch: boolean // includes the whole up/downstream branch
  ): PPNode[] {
    const getDirectDependentsAndAccumulateThem = (
      dependents: {
        [key: string]: PPNode;
      },
      includeUpstream: boolean,
      includeDownstream: boolean,
      wholeBranch: boolean
    ): void => {
      Object.values(dependents).forEach((node) => {
        const newDependents: { [key: string]: PPNode } = node.getLinkedNodes(
          wholeBranch || includeUpstream,
          wholeBranch || includeDownstream
        );

        combinedDependents[node.id] = node;

        const filtered = Object.keys(newDependents)
          .filter((key) => combinedDependents[key] === undefined)
          .reduce((obj, key) => {
            obj[key] = newDependents[key];
            return obj;
          }, {});

        getDirectDependentsAndAccumulateThem(
          filtered,
          includeUpstream,
          includeDownstream,
          wholeBranch
        );
      });
    };

    const combinedDependents: { [key: string]: PPNode } = {};
    combinedDependents[this.id] = this;

    if (includeUpstream && includeDownstream) {
      getDirectDependentsAndAccumulateThem(
        combinedDependents,
        includeUpstream,
        includeDownstream,
        wholeBranch
      );
    } else {
      getDirectDependentsAndAccumulateThem(
        this.getLinkedNodes(includeUpstream, includeDownstream),
        includeUpstream,
        includeDownstream,
        wholeBranch
      );
    }
    return Object.values(combinedDependents);
  }

  async executeOptimizedChain(): Promise<void> {
    await PPNode.executeOptimizedChainBatch([this]);
  }

  async executeChildren(): Promise<void> {
    this.drawComment();
    await PPNode.executeOptimizedChainBatch(
      Object.values(this.getDirectDependents())
    );
  }

  static async executeOptimizedChainBatch(
    foundational: PPNode[]
  ): Promise<void> {
    const dependents: { [key: string]: PPNode } = {};
    const numDepending: { [key: string]: Set<string> } = {};
    foundational.forEach((node: PPNode) => {
      Object.keys(node.getDirectDependents()).forEach((dependentKey) => {
        numDepending[dependentKey] = new Set();
        numDepending[dependentKey].add(node.id);
      });
      PPNode.combineNumDependings(
        numDepending,
        node.aggregateDependents(dependents)
      );
    });
    // now that we have the complete chain, execute them in order that makes sure all dependents are waiting on their parents, there should always be a node with no more lingering dependents (unless there is an infinite loop)
    let currentExecuting: PPNode = foundational.shift();
    while (currentExecuting) {
      await currentExecuting.execute();
      // uncomment if you want to see the execution in more detail by slowing it down (to make sure order is correct)
      //await new Promise((resolve) => setTimeout(resolve, 500));
      Object.keys(currentExecuting.getDirectDependents()).forEach(
        (dependentKey) => {
          if (numDepending[dependentKey]) {
            numDepending[dependentKey].delete(currentExecuting.id);
            // if this child has no other nodes it is waiting on, and one of its parents did change its output, add it to the queue of nodes to be executed
            if (numDepending[dependentKey].size == 0) {
              foundational.push(dependents[dependentKey]);
            }
          }
        }
      );
      currentExecuting = foundational.shift();
    }
    return;
  }

  setPosition(x: number, y: number, isRelative = false): void {
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
      scale: PPGraph.currentGraph.viewport.scale.x,
    });
  }

  resizeNode(width: number, height: number, maintainAspectRatio = false): void {
    // set new size
    const newNodeWidth = Math.max(width, this.minNodeWidth);
    const newNodeHeight = Math.max(height, this.calculatedMinNodeHeight);

    if (maintainAspectRatio) {
      const oldWidth = this.nodeWidth;
      const oldHeight = this.nodeHeight;
      const newRect = calculateAspectRatioFit(
        oldWidth,
        oldHeight,
        newNodeWidth,
        newNodeHeight,
        this.minNodeWidth,
        this.calculatedMinNodeHeight
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

  resizedNode(): void {
    this.onNodeResized();
  }

  resetSize(): void {
    this.resizeNode(this.minNodeWidth, this.calculatedMinNodeHeight);
  }

  getAllInputSockets(): Socket[] {
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

  getSocketByName(name: string): Socket {
    return this.getAllSockets().find((socket) => socket.name === name);
  }

  public drawBackground(): void {
    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      this.nodeWidth,
      this.getNodeHeight(),
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );
  }

  public drawNodeShape(): void {
    this._BackgroundRef.clear();
    if (!this.successfullyExecuted) {
      this._BackgroundRef.beginFill(
        new TRgba(255, 0, 0).hexNumber(),
        this.getOpacity()
      );
      this._BackgroundRef.drawRoundedRect(
        NODE_MARGIN - 3,
        -3,
        this.nodeWidth + 6,
        this.getNodeHeight() + 6,
        this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
      );
    }
    this._BackgroundRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity()
    );
    this.drawBackground();

    this._BackgroundRef.endFill();

    // redraw node triggers
    this.nodeTriggerSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y = this.headerHeight + index * SOCKET_HEIGHT;
        if (!this.getShowLabels()) {
          item._SocketNameRef.alpha = 0;
        }
        item.redrawAnythingChanging();
      });

    // redraw outputs
    this.outputSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y = this.headerHeight + index * SOCKET_HEIGHT;
        item.y =
          this.headerHeight +
          (!this.getParallelInputsOutputs()
            ? this.countOfVisibleNodeTriggerSockets * SOCKET_HEIGHT
            : 0) +
          index * SOCKET_HEIGHT;
        item.x = this.nodeWidth - this.getNodeWidth();
        if (!this.getShowLabels()) {
          item._SocketNameRef.alpha = 0;
        }
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
        if (!this.getShowLabels()) {
          item._SocketNameRef.alpha = 0;
        }
        item.redrawAnythingChanging();
      });

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

  // this function can be called for hybrid nodes, it
  // • creates a container component
  // • adds the onNodeDragOrViewportMove listener to it
  // • adds a react parent component with props
  createContainerComponent(
    reactParent,
    reactProps,
    customStyles = {}
  ): HTMLElement {
    const { margin = 0 } = reactProps;
    const reactElement = document.createElement('div');
    this.container = document
      .getElementById('container')
      .appendChild(reactElement);
    this.root = createRoot(this.container!);
    this.container.id = `Container-${this.id}`;

    const screenPoint = this.screenPoint();
    const scaleX = PPGraph.currentGraph.viewport.scale.x;
    this.container.classList.add(styles.hybridContainer);
    Object.assign(this.container.style, customStyles);

    // set initial position
    this.container.style.width = `${this.nodeWidth - (2 * margin) / scaleX}px`;
    this.container.style.height = `${
      this.nodeHeight - (2 * margin) / scaleX
    }px`;
    this.container.style.transform = `translate(50%, 50%)`;
    this.container.style.transform = `scale(${scaleX}`;
    this.container.style.left = `${screenPoint.x + margin}px`;
    this.container.style.top = `${screenPoint.y + margin}px`;

    this.onNodeDragOrViewportMove = ({ screenX, screenY, scale }) => {
      this.container.style.width = `${this.nodeWidth - (2 * margin) / scale}px`;
      this.container.style.height = `${
        this.nodeHeight - (2 * margin) / scale
      }px`;
      // this.container.style.transform = `translate(50%, 50%)`;
      this.container.style.transform = `scale(${scale}`;
      this.container.style.left = `${screenX + margin}px`;
      this.container.style.top = `${screenY + margin}px`;
    };

    this.onViewportPointerUpHandler = this._onViewportPointerUp.bind(this);

    // when the Node is removed also remove the react component and its container
    this.onNodeRemoved = () => {
      this.removeContainerComponent(this.container, this.root);
    };

    // render react component
    this.renderReactComponent(
      reactParent,
      {
        ...reactProps,
      },
      this.root
    );

    return this.container;
  }

  // the render method, takes a component and props, and renders it to the page
  renderReactComponent = (
    component: any,
    props: {
      [key: string]: any;
    },
    root = this.root
  ): void => {
    root.render(
      React.createElement(component, {
        ...props,
        id: this.id,
        selected: this.selected,
        doubleClicked: this.doubleClicked,
        randomMainColor: RANDOMMAINCOLOR,
      })
    );
  };

  removeContainerComponent(container: HTMLElement, root: Root): void {
    root.unmount();
    document.getElementById('container').removeChild(container);
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

  // avoid calling this directly
  getInputData(name: string): any {
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
  setInputData(name: string, data: any): void {
    const inputSocket = this.inputSocketArray.find((input: Socket) => {
      return name === input.name;
    });

    if (!inputSocket) {
      console.error('No input socket found with the name: ', name);
      return undefined;
    }

    inputSocket.data = data;
  }

  // avoid calling this directly, instead use the input/output objects in onExecute
  setOutputData(name: string, data: any): void {
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

  initialExecute(): void {
    this.executeOptimizedChain();
  }

  remapInput(sockets: Socket[]): any {
    const inputObject = {};
    sockets.forEach((input: Socket) => {
      inputObject[input.name] = input.data;
    });
    return inputObject;
  }

  // if you want to optimize the mapping of arguments, override this function instead of execute(), but most of the time just override onExecute()
  protected async rawExecute(): Promise<void> {
    // remap input
    const inputObject = this.remapInput(this.inputSocketArray);
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

  public renderOutline(): void {
    const iterations = 30;
    const interval = 16.67;
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
          this.getNodeHeight(),
          this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
        );
        activeExecution.endFill();
        if (i == iterations) {
          this.removeChild(activeExecution);
        }
      }, i * interval);
    }
  }

  protected async execute(): Promise<void> {
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
      this.drawNodeShape();
    }
  }

  // dont call this from outside, only from child class
  protected async onExecute(input, output): Promise<void> {
    // just define function
  }

  // SETUP

  _addListeners(): void {
    this.onMoveHandler = this._onPointerMove.bind(this);

    this.on('pointerdown', this._onPointerDown.bind(this));
    this.on('pointerup', this._onPointerUp.bind(this));
    this.on('pointerupoutside', this._onPointerUpOutside.bind(this));
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

      this.interactionData = event.data;
      this.cursor = 'grabbing';
      this.alpha = 0.5;
      this.isDraggingNode = true;
      this.onNodeDragging(this.isDraggingNode);
      this.sourcePoint = this.interactionData.getLocalPosition(this);

      // subscribe to pointermove
      this.on('pointermove', this.onMoveHandler);
    }
  }

  commonPointerUp(): void {
    // unsubscribe from pointermove
    this.removeListener('pointermove', this.onMoveHandler);

    this.alpha = 1;
    this.isDraggingNode = false;
    this.onNodeDragging(this.isDraggingNode);
    this.cursor = 'move';
  }

  // TODO why is both nodeclass, selectionclass and graphclass involved in this stuff? not good
  _onPointerUp(): void {
    this.commonPointerUp();

    const source = PPGraph.currentGraph.selectedSourceSocket;
    if (source && this !== source.getNode()) {
      PPGraph.currentGraph.selectedSourceSocket = null; // hack
      connectNodeToSocket(source, this);
    }
  }

  _onPointerUpOutside(): void {
    this.commonPointerUp();
  }

  public _onPointerMove(): void {
    if (this.isDraggingNode) {
      const targetPoint = this.interactionData.getLocalPosition(this);
      const deltaX = targetPoint.x - this.sourcePoint.x;
      const deltaY = targetPoint.y - this.sourcePoint.y;

      // move selection
      PPGraph.currentGraph.selection.moveSelection(deltaX, deltaY);
    }
  }

  protected _onViewportMove(): void {
    if (this.onNodeDragOrViewportMove) {
      const screenPoint = this.screenPoint();
      this.onNodeDragOrViewportMove({
        screenX: screenPoint.x,
        screenY: screenPoint.y,
        scale: PPGraph.currentGraph.viewport.scale.x,
      });
    }
  }

  _onRemoved(): void {
    // console.log('_onRemoved');

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
    this.cursor = 'move';
    this.isHovering = true;
    this.updateBehaviour.redrawAnythingChanging();
    this.nodeSelectionHeader.redrawAnythingChanging(true);
  }

  _onPointerOut(): void {
    if (!this.isDraggingNode) {
      this.isHovering = false;
      this.alpha = 1.0;
      this.cursor = 'default';
    }
    this.updateBehaviour.redrawAnythingChanging();
    this.nodeSelectionHeader.redrawAnythingChanging(false);
  }

  _onDoubleClick(event: PIXI.InteractionEvent): void {
    this.doubleClicked = true;

    if (this.onNodeDoubleClick) {
      this.onNodeDoubleClick(event);
    }
  }

  _onViewportPointerUp(): void {}

  public outputPlugged(): void {}
  public outputUnplugged(): void {}

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
    this.drawNodeShape();
    this.updateConnectionPosition();
  }
}

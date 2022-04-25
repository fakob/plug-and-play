/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-this-alias */
import * as PIXI from 'pixi.js';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import { hri } from 'human-readable-ids';
import React from 'react';
import ReactDOM from 'react-dom';
import '../pixi/dbclick.js';

import styles from '../utils/style.module.css';
import {
  CustomArgs,
  SerializedNode,
  SerializedSocket,
  TRgba,
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
import PPGraph from './GraphClass';
import Socket from './SocketClass';
import {
  calculateAspectRatioFit,
  getNodeCommentPosX,
  getNodeCommentPosY,
} from '../utils/utils';
import { AbstractType } from '../nodes/datatypes/abstractType';
import { AnyType } from '../nodes/datatypes/anyType';
import { TriggerType } from '../nodes/datatypes/triggerType';
import { deSerializeType } from '../nodes/datatypes/typehelper';
import { throttle } from 'lodash';

export class UpdateBehaviour {
  update: boolean;
  interval: boolean;
  intervalFrequency: number;

  constructor(
    inUpdate: boolean,
    inInterval: boolean,
    inIntervalFrequency: number
  ) {
    this.update = inUpdate;
    this.interval = inInterval;
    this.intervalFrequency = inIntervalFrequency;
  }
}

export default class PPNode extends PIXI.Container {
  _NodeNameRef: PIXI.Text;
  _BackgroundRef: PIXI.Graphics;
  _CommentRef: PIXI.Graphics;
  clickedSocketRef: Socket;

  graph: PPGraph;
  id: string;
  // name: string; // Display name - at first it is the type with spaces - defined on PIXI.Container
  type: string; // Type
  category: string; // Category - derived from type
  description: string;
  color: TRgba;
  nodePosX: number;
  nodePosY: number;
  nodeWidth: number;
  minNodeWidth: number;
  minNodeHeight: number;
  nodeHeight: number;
  isHybrid: boolean; // true if it is a hybrid node (html and webgl)
  roundedCorners: boolean;
  showLabels: boolean;

  // default to update on update, 1 sec time update interval
  updateBehaviour: UpdateBehaviour;
  lastTimeTicked = 0;

  successfullyExecuted = true;
  lastError = '';

  inputSocketArray: Socket[];
  outputSocketArray: Socket[];

  _doubleClicked: boolean;
  isDraggingNode: boolean;
  sourcePoint: PIXI.Point;
  interactionData: PIXI.InteractionData;

  container: HTMLElement; // for hybrid nodes
  static: HTMLElement;

  // supported callbacks
  onConfigure: (nodeConfig: SerializedNode) => void = () => {}; // called after the node has been configured
  onNodeDoubleClick: (event: PIXI.InteractionEvent) => void = () => {};
  onMoveHandler: (event?: PIXI.InteractionEvent) => void = () => {};
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void = () => {};
  onViewportPointerUpHandler: (event?: PIXI.InteractionEvent) => void =
    () => {};
  onHybridNodeExit: () => void = () => {}; // called when a hybrid node is exited after double click
  onNodeAdded: () => void = () => {}; // called when the node is added to the graph
  onNodeRemoved: () => void = () => {}; // called when the node is removed from the graph
  onNodeDragging: (isDraggingNode: boolean) => void = () => {}; // called when the node is being dragged
  onNodeResize: (width: number, height: number) => void = () => {}; // called when the node is resized
  onNodeResized: () => void = () => {}; // called when the node resize ended
  onNodeDragOrViewportMove: // called when the node or or the viewport with the node is moved or scaled
  (positions: { screenX: number; screenY: number; scale: number }) => void =
    () => {};

  constructor(type: string, graph: PPGraph, customArgs?: CustomArgs) {
    super();
    this.graph = graph;
    this.id = customArgs?.customId ?? hri.random();
    this.name = type;
    this.type = type;
    this.description = '';
    this.inputSocketArray = [];
    this.outputSocketArray = [];
    this.clickedSocketRef = null;
    this.updateBehaviour = this.getUpdateBehaviour();

    // customArgs
    this.x = customArgs?.nodePosX ?? 0;
    this.y = customArgs?.nodePosY ?? 0;
    this.nodeWidth = customArgs?.nodeWidth ?? NODE_WIDTH;
    this.minNodeWidth = customArgs?.minNodeWidth ?? this.nodeWidth;
    this.nodeHeight = customArgs?.nodeHeight; // if not set height is defined by in/out sockets
    this.minNodeHeight = customArgs?.minNodeHeight;
    this.isHybrid = Boolean(customArgs?.isHybrid ?? false);

    if (this.isHybrid) {
      this.roundedCorners = Boolean(customArgs?.roundedCorners ?? false);
      this.showLabels = Boolean(customArgs?.showLabels ?? false);
    } else {
      this.roundedCorners = Boolean(customArgs?.roundedCorners ?? true);
      this.showLabels = Boolean(customArgs?.showLabels ?? true);
    }
    this.color = customArgs?.color ?? TRgba.fromString(NODE_TYPE_COLOR.DEFAULT);

    this.color.a = customArgs?.colorTransparency ?? (this.isHybrid ? 0.01 : 1); // so it does not show when dragging the node fast
    const inputNameText = new PIXI.Text(this.name, NODE_TEXTSTYLE);
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

    // do not show the node name
    if (this.showLabels === false) {
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
    return this.graph.selection.isNodeSelected(this);
  }

  get doubleClicked(): boolean {
    return this._doubleClicked;
  }

  set doubleClicked(state: boolean) {
    this._doubleClicked = state;
  }

  get countOfVisibleInputSockets(): number {
    return this.inputSocketArray.filter((item) => item.visible).length;
  }

  get countOfVisibleOutputSockets(): number {
    return this.outputSocketArray.filter((item) => item.visible).length;
  }

  get headerHeight(): number {
    // hide header if showLabels === false
    return this.showLabels ? NODE_PADDING_TOP + NODE_HEADER_HEIGHT : 0;
  }

  get calculatedMinNodeHeight(): number {
    const minHeight =
      this.headerHeight +
      this.countOfVisibleInputSockets * SOCKET_HEIGHT +
      this.countOfVisibleOutputSockets * SOCKET_HEIGHT +
      NODE_PADDING_BOTTOM;
    return this.minNodeHeight === undefined
      ? minHeight
      : Math.max(minHeight, this.minNodeHeight);
  }

  get nodeName(): string {
    return this.name;
  }

  set nodeName(text: string) {
    this.name = text;
    this._NodeNameRef.text = text;
  }

  // METHODS
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

  getDefaultType(): AbstractType {
    return new AnyType();
  }

  addInput(
    name: string,
    type: any, // but really its AbstractType
    data?: unknown,
    visible?: boolean,
    custom?: Record<string, any> // lets get rid of this ASAP
  ): void {
    // horrible hack to solve custom nodes
    const toUseType = type instanceof AbstractType ? type : new AnyType();
    const inputSocket = new Socket(
      SOCKET_TYPE.IN,
      name,
      toUseType,
      data,
      visible,
      custom
    );
    const inputSocketRef = this.addChild(inputSocket);
    this.inputSocketArray.push(inputSocketRef);

    // redraw background due to size change
    this.drawNodeShape();
  }

  addOutput(
    name: string,
    type: any, // but really its abstracttype
    visible?: boolean,
    custom?: Record<string, any>
  ): void {
    // horrible hack to solve custom nodes
    const toUseType = type instanceof AbstractType ? type : new AnyType();
    const outputSocket = new Socket(
      SOCKET_TYPE.OUT,
      name,
      toUseType,
      null, // need to get rid of this
      visible
    );
    const outputSocketRef = this.addChild(outputSocket);
    this.outputSocketArray.push(outputSocketRef);

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
      updateBehaviour: {
        update: this.updateBehaviour.update,
        interval: this.updateBehaviour.interval,
        intervalFrequency: this.updateBehaviour.intervalFrequency,
      },
    };

    node.inputSocketArray = [];
    this.inputSocketArray.forEach((item) => {
      node.inputSocketArray.push(item.serialize());
    });

    node.outputSocketArray = [];
    this.outputSocketArray.forEach((item) => {
      node.outputSocketArray.push(item.serialize());
    });

    return node;
  }

  deSerializeSocketArray(
    serialized: SerializedSocket[],
    array: Socket[]
  ): void {
    serialized.forEach((item: SerializedSocket, index) => {
      if (array[index] !== undefined) {
        array[index].setName(item.name);
        array[index].dataType = deSerializeType(item.dataType);
        array[index].data = item.data;
        array[index].defaultData = item.defaultData;
        array[index].setVisible(item.visible);
      } else {
        // add socket if it does not exist yet
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
    });
    this.drawNodeShape();
  }

  configure(nodeConfig: SerializedNode): void {
    this.x = nodeConfig.x;
    this.y = nodeConfig.y;
    this.nodeName = nodeConfig.name;
    this.minNodeWidth = nodeConfig.minWidth ?? NODE_WIDTH;
    this.minNodeHeight = nodeConfig.minHeight;
    try {
      if (nodeConfig.width && nodeConfig.height) {
        this.resizeNode(nodeConfig.width, nodeConfig.height);
        this.resizedNode();
      }

      this.deSerializeSocketArray(
        nodeConfig.inputSocketArray,
        this.inputSocketArray
      );
      this.deSerializeSocketArray(
        nodeConfig.outputSocketArray,
        this.outputSocketArray
      );
    } catch (error) {
      console.error(
        `Could not configure node: ${this.name}, id: ${this.id}`,
        error
      );
    }

    if (this.onConfigure) {
      this.onConfigure(nodeConfig);
    }

    if (this.isHybrid) {
      this._onViewportMove(); // trigger this once, so the react components get positioned properly
    }

    this.updateBehaviour = nodeConfig.updateBehaviour;
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
      this.inputSocketArray.find((socket) => socket.hasLink()) !== undefined
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

  async executeOptimizedChain(): Promise<void> {
    //console.log('executing: ' + this.id);
    await PPNode.executeOptimizedChainBatch([this]);
  }

  async executeChildren(): Promise<void> {
    this.drawComment();
    PPNode.executeOptimizedChainBatch(
      Object.values(this.getDirectDependents())
    );
  }

  static async executeOptimizedChainBatch(
    foundational: PPNode[]
  ): Promise<void> {
    const dependents: { [key: string]: PPNode } = {};
    const numDepending: { [key: string]: Set<string> } = {};
    const dirtyState: Set<string> = new Set();
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
      const changeDetected: boolean = await currentExecuting.execute();
      // uncomment if you want to see the execution in more detail by slowing it down (to make sure order is correct)
      //await new Promise((resolve) => setTimeout(resolve, 500));
      Object.keys(currentExecuting.getDirectDependents()).forEach(
        (dependentKey) => {
          if (changeDetected) {
            dirtyState.add(dependentKey);
          }
          numDepending[dependentKey].delete(currentExecuting.id);
          if (
            numDepending[dependentKey].size == 0 &&
            dirtyState.has(dependentKey)
          ) {
            foundational.push(dependents[dependentKey]);
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
      scale: this.graph.viewport.scale.x,
    });

    if (this.isHybrid) {
      this._onViewportMove(); // trigger this once, so the react components get positioned properly
    }
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

    if (this.isHybrid) {
      this.container.style.width = `${this.nodeWidth}px`;
      this.container.style.height = `${this.nodeHeight}px`;
    }

    this.onNodeResize(this.nodeWidth, this.nodeHeight);
  }

  resizedNode(): void {
    this.onNodeResized();
  }

  resetSize(): void {
    this.resizeNode(this.minNodeWidth, this.calculatedMinNodeHeight);
  }

  getAllSockets(): Socket[] {
    return this.inputSocketArray.concat(this.outputSocketArray);
  }

  getSocketByName(name: string): Socket {
    return this.getAllSockets().find((socket) => socket.name === name);
  }

  getNodeHeight(): number {
    return this.nodeHeight === undefined
      ? this.calculatedMinNodeHeight
      : Math.max(this.nodeHeight, this.calculatedMinNodeHeight);
  }

  drawNodeShape(): void {
    // redraw background due to size change
    this._BackgroundRef.clear();
    if (!this.successfullyExecuted) {
      this._BackgroundRef.beginFill(
        new TRgba(255, 0, 0).hexNumber(),
        this.color.a
      );
      this._BackgroundRef.drawRoundedRect(
        NODE_MARGIN - 3,
        -3,
        this.nodeWidth + 6,
        this.getNodeHeight() + 6,
        this.roundedCorners ? NODE_CORNERRADIUS : 0
      );
    }
    this._BackgroundRef.beginFill(this.color.hexNumber(), this.color.a);
    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      this.nodeWidth,
      this.getNodeHeight(),
      this.roundedCorners ? NODE_CORNERRADIUS : 0
    );

    this._BackgroundRef.endFill();

    // redraw outputs
    this.outputSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y = this.headerHeight + index * SOCKET_HEIGHT;
        item.x = this.nodeWidth - NODE_WIDTH;
        if (this.showLabels === false) {
          item._SocketNameRef.alpha = 0;
        }
      });

    // redraw inputs
    this.inputSocketArray
      .filter((item) => item.visible)
      .forEach((item, index) => {
        item.y =
          this.headerHeight +
          this.countOfVisibleOutputSockets * SOCKET_HEIGHT +
          index * SOCKET_HEIGHT;
        if (this.showLabels === false) {
        }
      });

    this.drawComment();

    // update selection
    if (this.graph.selection.isNodeSelected(this)) {
      this.graph.selection.drawRectanglesFromSelection();
    }
  }

  shouldExecuteOnMove(): boolean {
    return false;
  }

  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(true, false, 1000);
  }

  protected getDefaultIO(): Socket[] {
    return [];
  }

  public getCanAddInput(): boolean {
    return false;
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
      this.constructSocketName('Trigger', this.inputSocketArray),
      new TriggerType(TRIGGER_TYPE_OPTIONS[0].value),
      0
    );
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
    if (this.graph._showComments) {
      let commentData = this.outputSocketArray[0]?.dataType?.getComment(
        this.outputSocketArray[0]?.data
      );
      if (commentData && commentData.length > 10000) {
        commentData = 'Too long to display';
      }
      const debugText = new PIXI.Text(
        `${Math.round(this.transform.position.x)}, ${Math.round(
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
      debugText.y = getNodeCommentPosY() - 32;
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
    return this.graph.viewport.toScreen(this.x + NODE_MARGIN, this.y);
  }

  // this function
  // • creates a static component
  createStaticContainerComponent(
    parentDocument: Document,
    reactParent: any,
    reactProps: any,
    customStyles = {}
  ): HTMLElement {
    // create html container
    const staticId = `Static-${this.id}`;
    if (this.static?.id !== staticId) {
      this.static = parentDocument.createElement('div');
      this.static.id = staticId;

      // add it to the DOM
      parentDocument.body.appendChild(this.static);

      // when the Node is removed also remove the react component and its static
      this.onNodeRemoved = () => {
        this.removeContainerComponent(this.static);
      };
    } else {
      console.log('Modal already exists', this.static);
    }
    console.dir(this.static, this.static.childNodes);
    // render react component
    this.renderReactComponent(
      reactParent,
      {
        ...reactProps,
        randomMainColor: RANDOMMAINCOLOR,
      },
      this.static
    );

    return this.static;
  }

  // this function can be called for hybrid nodes, it
  // • creates a container component
  // • adds the onNodeDragOrViewportMove listener to it
  // • adds a react parent component with props
  createContainerComponent(
    parentDocument: Document,
    reactParent,
    reactProps,
    customStyles = {}
  ): HTMLElement {
    // create html container
    this.container = parentDocument.createElement('div');
    this.container.id = `Container-${this.id}`;

    // add it to the DOM
    parentDocument.body.appendChild(this.container);

    const screenPoint = this.screenPoint();
    this.container.classList.add(styles.hybridContainer);
    this.container.style.width = `${this.nodeWidth}px`;
    this.container.style.height = `${this.nodeHeight}px`;
    Object.assign(this.container.style, customStyles);

    // set initial position
    this.container.style.transform = `translate(50%, 50%)`;
    this.container.style.transform = `scale(${this.graph.viewport.scale.x}`;
    this.container.style.left = `${screenPoint.x}px`;
    this.container.style.top = `${screenPoint.y}px`;

    this.onNodeDragOrViewportMove = ({ screenX, screenY, scale }) => {
      this.container.style.transform = `translate(50%, 50%)`;
      this.container.style.transform = `scale(${scale}`;
      this.container.style.left = `${screenX}px`;
      this.container.style.top = `${screenY}px`;
    };

    this.onViewportPointerUpHandler = this._onViewportPointerUp.bind(this);

    // when the Node is removed also remove the react component and its container
    this.onNodeRemoved = () => {
      this.removeContainerComponent(this.container);
    };

    // render react component
    this.renderReactComponent(reactParent, {
      ...reactProps,
      randomMainColor: RANDOMMAINCOLOR,
    });

    return this.container;
  }

  // the render method, takes a component and props, and renders it to the page
  renderReactComponent = (
    component: any,
    props: {
      [key: string]: any;
    },
    container = this.container
  ): void => {
    ReactDOM.render(
      React.createElement(component, {
        ...props,
        id: this.id,
        selected: this.selected,
        doubleClicked: this.doubleClicked,
      }),
      container
    );
  };

  removeContainerComponent(container: HTMLElement): void {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  }

  getInputSocketByName(slotName: string): Socket {
    return this.inputSocketArray[
      this.inputSocketArray.findIndex((el) => el.name === slotName)
    ];
  }

  getOutputSocketByName(slotName: string): Socket {
    return this.outputSocketArray[
      this.outputSocketArray.findIndex((el) => el.name === slotName)
    ];
  }

  getInputDataBySlot(slot: number): any {
    // to easily loop through it
    if (!this.inputSocketArray) {
      return undefined;
    }

    // if no link, then return data
    if (
      slot >= this.inputSocketArray.length ||
      this.inputSocketArray[slot].links.length === 0
    ) {
      return this.inputSocketArray[slot].data;
    }

    const link = this.inputSocketArray[slot].links[0];
    return link.source.data;
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

  // avoid calling this directly, instead use the input/output objects in onExecute
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

    if (!outputSocket) {
      console.error('No output socket found with the name: ', name);
      return undefined;
    }

    outputSocket.data = data;
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

  // if you want to optimize the mapping, override this function instead of execute()
  protected async rawExecute(): Promise<boolean> {
    // remap input
    const inputObject = this.remapInput(this.inputSocketArray);
    const outputObject = {};

    await this.onExecute(inputObject, outputObject);
    this.onAfterExecute();

    let foundChange = !this.isPure();
    // output whatever the user has put in
    this.outputSocketArray.forEach((output: Socket) => {
      if (outputObject[output.name] !== undefined) {
        if (!foundChange) {
          // see if anything has changed, but only need to do this if no previous has been found
          foundChange =
            JSON.stringify(outputObject[output.name]) !==
            JSON.stringify(output.data);
        }
        output.data = outputObject[output.name];
      }
    });
    return foundChange;
  }

  // override if you don't want your node to show outline for some reason
  public shouldDrawExecution(): boolean {
    return true;
  }

  public renderOutlineThrottled = throttle(this.renderOutline, 500, {
    trailing: true,
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
          this.roundedCorners ? NODE_CORNERRADIUS : 0
        );
        activeExecution.endFill();
        if (i == iterations) {
          this.removeChild(activeExecution);
        }
      }, i * interval);
    }
  }

  hasLinkedManualTrigger(): boolean {
    const hasTrigger = this.inputSocketArray.some(
      (socket) => socket.hasLink() && socket._dataType.manualTrigger()
    );
    console.log(this.name, hasTrigger);
    return hasTrigger;
  }

  shouldNodeExecute(): boolean {
    const shouldExecute = this.inputSocketArray.every((input) => {
      const executeNode =
        input._dataType.shouldTriggerExecute(
          input,
          input.previousData,
          input.data
        ) === true;
      console.log(
        input.name,
        'shouldTriggerExecute:',
        input.previousData,
        input.data,
        executeNode
      );
      return executeNode;
    });
    console.log(this.name, 'shouldExecute:', shouldExecute);
    return shouldExecute;
  }

  protected async execute(): Promise<boolean> {
    const executedSuccessOld = this.successfullyExecuted;
    let foundChange = false;
    try {
      this.successfullyExecuted = true;
      // if one or more sockets are a linked and set to manual trigger
      // ask trigger type if node should execute
      if (!this.hasLinkedManualTrigger() || this.shouldNodeExecute()) {
        if (this.shouldDrawExecution()) {
          this.renderOutlineThrottled();
        }
        console.log('rawExecute', this.name);
        foundChange = await this.rawExecute();
        this.drawComment();
      }
    } catch (error) {
      this.lastError = error;
      console.log('node ' + this.id + ' execution error: ' + error);
      this.successfullyExecuted = false;
    }
    if (executedSuccessOld !== this.successfullyExecuted) {
      this.drawNodeShape();
    }
    return foundChange;
  }

  // dont call this from outside, only from child class
  protected async onExecute(input, output): Promise<void> {
    // just define function
  }

  protected onAfterExecute(): void {
    // just define function
  }

  // return true if this node has no effects on the graph apart from what it returns and does within itself, if this is indeed the case then there are a ton of optimizations and improvements that can be done, so mark all nodes that can be made pure as pure
  protected isPure(): boolean {
    return false;
  }

  // SETUP

  _addListeners(): void {
    this.onMoveHandler = this._onPointerMove.bind(this);

    this.on('pointerdown', this._onPointerDown.bind(this));
    this.on('pointerup', this._onPointerUpAndUpOutside.bind(this));
    this.on('pointerupoutside', this._onPointerUpAndUpOutside.bind(this));
    this.on('pointerover', this._onPointerOver.bind(this));
    this.on('pointerout', this._onPointerOut.bind(this));
    this.on('dblclick', this._onDoubleClick.bind(this));
    this.on('removed', this._onRemoved.bind(this));

    // first assign the bound function to a handler then add this handler as a listener
    // otherwise removeListener won't work (bind creates a new function)
    this.onViewportMoveHandler = this._onViewportMove.bind(this);
    this.graph.viewport.on('moved', (this as any).onViewportMoveHandler);
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
        this.graph.selection.selectNodes([this], shiftKey, true);
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
    this.nodeHandlePressed(event);
  }

  nodeHandlePressed(event: PIXI.InteractionEvent): void {}

  _onPointerUpAndUpOutside(): void {
    // unsubscribe from pointermove
    this.removeListener('pointermove', this.onMoveHandler);

    this.alpha = 1;
    this.isDraggingNode = false;
    this.onNodeDragging(this.isDraggingNode);
    this.cursor = 'move';
  }

  _onPointerMove(): void {
    if (this.isDraggingNode) {
      const targetPoint = this.interactionData.getLocalPosition(this);
      const deltaX = targetPoint.x - this.sourcePoint.x;
      const deltaY = targetPoint.y - this.sourcePoint.y;

      // move selection
      this.graph.selection.moveSelection(deltaX, deltaY);
    }
  }

  _onViewportMove(): void {
    if (this.onNodeDragOrViewportMove) {
      const screenPoint = this.screenPoint();
      this.onNodeDragOrViewportMove({
        screenX: screenPoint.x,
        screenY: screenPoint.y,
        scale: this.graph.viewport.scale.x,
      });
    }
  }

  _onRemoved(): void {
    // console.log('_onRemoved');

    // remove added listener from graph.viewport
    this.graph.viewport.removeListener('moved', this.onViewportMoveHandler);

    this.getAllSockets().forEach((socket) => {
      socket.links.forEach((link) => link.delete());
    });

    this.onNodeRemoved();
  }

  _onPointerOver(): void {
    this.cursor = 'move';
  }

  _onPointerOut(): void {
    if (!this.isDraggingNode) {
      this.alpha = 1.0;
      this.cursor = 'default';
    }
  }

  _onDoubleClick(event: PIXI.InteractionEvent): void {
    this.doubleClicked = true;

    // turn on pointer events for hybrid nodes so the react components become reactive
    if (this.isHybrid) {
      // register hybrid nodes to listen to outside clicks
      this.graph.viewport.on(
        'pointerup',
        (this as any).onViewportPointerUpHandler
      );
      this.container.style.pointerEvents = 'auto';
      this.container.classList.add(styles.hybridContainerFocused);
    }

    if (this.onNodeDoubleClick) {
      this.onNodeDoubleClick(event);
    }
  }

  _onViewportPointerUp(): void {
    // unregister hybrid nodes from listening to outside clicks
    this.graph.viewport.removeListener(
      'pointerup',
      (this as any).onViewportPointerUpHandler
    );
    this.onHybridNodeExit();
    this.doubleClicked = false;
    // this allows to zoom and drag when the hybrid node is not selected
    this.container.style.pointerEvents = 'none';
    this.container.classList.remove(styles.hybridContainerFocused);
  }

  public outputPlugged(): void {}
  public outputUnplugged(): void {}
}

export class PureNode extends PPNode {
  protected isPure(): boolean {
    return true;
  }
}

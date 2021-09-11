import * as PIXI from 'pixi.js';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import { hri } from 'human-readable-ids';
import React from 'react';
import ReactDOM from 'react-dom';
import { inspect } from 'util'; // or directly
import '../pixi/dbclick.js';

import styles from '../utils/style.module.css';
import { CustomArgs, SerializedNode } from '../utils/interfaces';
import {
  COMMENT_TEXTSTYLE,
  DATATYPE,
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
} from '../utils/constants';
import PPGraph from './GraphClass';
import Socket from './SocketClass';
import { getNodeCommentPosX, getNodeCommentPosY } from '../utils/utils';

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
  _NodeCommentRef: PIXI.Text;
  _BackgroundRef: PIXI.Graphics;
  clickedSocketRef: null | Socket;

  graph: PPGraph;
  id: string;
  // name: string; // Display name - at first it is the type with spaces - defined on PIXI.Container
  type: string; // Type
  category: string; // Category - derived from type
  description: string;
  color: number;
  colorTransparency: number;
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

  inputSocketArray: Socket[];
  outputSocketArray: Socket[];

  _doubleClicked: boolean;
  isDraggingNode: boolean;
  sourcePoint: PIXI.Point | null;
  interactionData: PIXI.InteractionData | null;

  container: HTMLElement; // for hybrid nodes

  // supported callbacks
  onConfigure: ((nodeConfig: SerializedNode) => void) | null;
  onNodeDoubleClick: ((event: PIXI.InteractionEvent) => void) | null;
  onMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onDrawNodeShape: (() => void) | null; // called when the node is drawn
  onNodeAdded: (() => void) | null; // called when the node is added to the graph
  onNodeRemoved: (() => void) | null; // called when the node is removed from the graph
  onNodeSelected: (() => void) | null; // called when the node is selected/unselected
  onNodeResize: ((width: number, height: number) => void) | null; // called when the node is resized
  onNodeResized: (() => void) | null; // called when the node resize ended
  onNodeDragOrViewportMove: // called when the node or or the viewport with the node is moved or scaled
  | ((positions: { screenX: number; screenY: number; scale: number }) => void)
    | null;

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
    this.minNodeWidth = this.nodeWidth;
    this.nodeHeight = customArgs?.nodeHeight ?? undefined;
    this.minNodeHeight = customArgs?.minHeight ?? undefined;
    this.isHybrid = Boolean(customArgs?.isHybrid ?? false);

    if (this.isHybrid) {
      this.roundedCorners = Boolean(customArgs?.roundedCorners ?? false);
      this.showLabels = Boolean(customArgs?.showLabels ?? false);
    } else {
      this.roundedCorners = Boolean(customArgs?.roundedCorners ?? true);
      this.showLabels = Boolean(customArgs?.showLabels ?? true);
    }

    this.color = PIXI.utils.string2hex(
      customArgs?.color ?? NODE_TYPE_COLOR.DEFAULT
    );
    this.colorTransparency =
      customArgs?.colorTransparency ?? (this.isHybrid ? 0.01 : 1); // so it does not show when dragging the node fast
    const inputNameText = new PIXI.Text(this.name, NODE_TEXTSTYLE);
    inputNameText.x = NODE_HEADER_TEXTMARGIN_LEFT;
    inputNameText.y = NODE_PADDING_TOP + NODE_HEADER_TEXTMARGIN_TOP;
    inputNameText.resolution = 8;

    const background = new PIXI.Graphics();
    background.filters = [
      new DropShadowFilter({
        distance: 0,
        alpha: 0.2,
        blur: 1,
      }),
    ];
    const nodeComment = new PIXI.Text('', COMMENT_TEXTSTYLE);
    nodeComment.resolution = 1;

    this._BackgroundRef = this.addChild(background);
    this._NodeNameRef = this.addChild(inputNameText);
    this._NodeCommentRef = (
      this.graph.viewport.getChildByName('commentContainer') as PIXI.Container
    ).addChild(nodeComment);

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
    this.interactionData = null;
    this.sourcePoint = null;
    this.isDraggingNode = false;
    this._doubleClicked = false;

    this._addListeners();
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
    return this.inputSocketArray.filter((item) => item.visible === true).length;
  }

  get countOfVisibleOutputSockets(): number {
    return this.outputSocketArray.filter((item) => item.visible === true)
      .length;
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
  select(): void {
    // this allows to zoom and drag when the hybrid node is not selected
    if (this.isHybrid) {
      if (!this.selected && this.container !== undefined) {
        this.container.style.pointerEvents = 'none';
      }
    }

    if (this.onNodeSelected) {
      this.onNodeSelected();
    }
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

    this.drawNodeShape();
  }

  addInput(
    name: string,
    type: string,
    data?: unknown,
    visible?: boolean,
    custom?: Record<string, any>
  ): void {
    const inputSocket = new Socket(
      SOCKET_TYPE.IN,
      name,
      type,
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
    type: string,
    data?: any,
    visible?: boolean,
    custom?: Record<string, any>
  ): void {
    const outputSocket = new Socket(
      SOCKET_TYPE.OUT,
      name,
      type,
      null,
      visible,
      custom
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

  configure(nodeConfig: SerializedNode): void {
    this.x = nodeConfig.x;
    this.y = nodeConfig.y;
    this.minNodeWidth = nodeConfig.minWidth ?? NODE_WIDTH;
    this.minNodeHeight = nodeConfig.minHeight;
    if (nodeConfig.width && nodeConfig.height) {
      this.resizeNode(nodeConfig.width, nodeConfig.height);
      this.resizedNode();
    }
    // update position of comment
    this.updateCommentPosition();

    // set parameters on inputSocket
    this.inputSocketArray.forEach((item, index) => {
      // skip configuring the input if there is no config data
      if (nodeConfig.inputSocketArray[index] !== undefined) {
        item.setName(nodeConfig.inputSocketArray[index].name ?? null);
        item.dataType = nodeConfig.inputSocketArray[index].dataType ?? null;
        item.data = nodeConfig.inputSocketArray[index].data ?? null;
        item.defaultData =
          nodeConfig.inputSocketArray[index].defaultData ?? null;
        item.setVisible(nodeConfig.inputSocketArray[index].visible ?? true);
        item.custom = nodeConfig.inputSocketArray[index].custom ?? undefined;
      }
    });

    // set parameters on outputSocket
    this.outputSocketArray.forEach((item, index) => {
      // skip configuring the output if there is no config data
      if (nodeConfig.outputSocketArray[index] !== undefined) {
        item.setName(nodeConfig.outputSocketArray[index].name ?? null);
        item.dataType =
          nodeConfig.outputSocketArray[index].dataType ?? undefined;
        item.setVisible(nodeConfig.outputSocketArray[index].visible ?? true);
        item.custom = nodeConfig.outputSocketArray[index].custom ?? undefined;
      }
    });

    if (this.onConfigure) {
      this.onConfigure(nodeConfig);
    }

    if (this.isHybrid) {
      this._onViewportMove(); // trigger this once, so the react components get positioned properly
    }

    this.updateBehaviour = nodeConfig.updateBehaviour;

    // update node after configure
    this.execute(new Set());
  }

  notifyChange(upstreamContent: Set<string>): void {
    if (upstreamContent.has(this.id)) {
    } else if (this.updateBehaviour.update) {
      upstreamContent.add(this.id);
      this.execute(upstreamContent);
    }
  }

  setPosition(x: number, y: number, isRelative = false): void {
    this.x = isRelative ? this.x + x : x;
    this.y = isRelative ? this.y + y : y;

    this.updateCommentPosition();
    this.updateConnectionPosition();

    if (this.shouldExecuteOnMove()) {
      this.execute(new Set());
    }

    if (this.onNodeDragOrViewportMove) {
      const screenPoint = this.screenPoint();
      this.onNodeDragOrViewportMove({
        screenX: screenPoint.x,
        screenY: screenPoint.y,
        scale: this.graph.viewport.scale.x,
      });
    }

    if (this.isHybrid) {
      this._onViewportMove(); // trigger this once, so the react components get positioned properly
    }
  }

  resizeNode(width: number, height: number): void {
    // set new size
    this.nodeWidth = Math.max(width, this.minNodeWidth);
    this.nodeHeight = Math.max(height, this.calculatedMinNodeHeight);

    // update node shape
    this.drawNodeShape();

    this.updateCommentPosition();
    this.updateConnectionPosition();

    if (this.onNodeResize) {
      this.onNodeResize(this.nodeWidth, this.nodeHeight);
    }
  }

  resizedNode(): void {
    if (this.onNodeResized) {
      this.onNodeResized();
    }
  }

  drawNodeShape(): void {
    // redraw background due to size change
    this._BackgroundRef.clear();
    if (this.isHybrid) {
      const shrinkMargin = 4; // for hybrid nodes, so the edge of the background rect does not show
      this._BackgroundRef.beginFill(this.color, this.colorTransparency);
      this._BackgroundRef.drawRect(
        NODE_MARGIN + shrinkMargin / 2,
        shrinkMargin / 2,
        this.nodeWidth - shrinkMargin,
        this.nodeHeight || this.calculatedMinNodeHeight - shrinkMargin
      );
    } else {
      this._BackgroundRef.beginFill(this.color, this.colorTransparency);
      this._BackgroundRef.drawRoundedRect(
        NODE_MARGIN,
        0,
        this.nodeWidth,
        this.nodeHeight || this.calculatedMinNodeHeight,
        this.roundedCorners ? NODE_CORNERRADIUS : 0
      );
    }
    this._BackgroundRef.endFill();

    // redraw outputs
    let posCounter = 0;
    this.outputSocketArray.forEach((item) => {
      // console.log(item, item.x, item.getBounds().width, this.nodeWidth);
      if (item.visible) {
        item.y = this.headerHeight + posCounter * SOCKET_HEIGHT;
        item.x = this.nodeWidth - NODE_WIDTH;
        posCounter += 1;
        if (this.showLabels === false) {
          item._SocketNameRef.alpha = 0;
        }
      }
    });

    // redraw inputs
    posCounter = 0;
    this.inputSocketArray.forEach((item) => {
      if (item.visible) {
        item.y =
          this.headerHeight +
          this.countOfVisibleOutputSockets * SOCKET_HEIGHT +
          posCounter * SOCKET_HEIGHT;
        posCounter += 1;
        if (this.showLabels === false) {
          item._SocketNameRef.alpha = 0;
        }
      }
    });

    if (this.onDrawNodeShape) {
      this.onDrawNodeShape();
    }

    // update position of comment
    this.updateCommentPosition();
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

  public addDefaultInput(): void {
    this.addInput(
      this.constructSocketName('Custom Input', this.inputSocketArray),
      DATATYPE.ANY
    );
  }

  public getCanAddOutput(): boolean {
    return false;
  }
  public addDefaultOutput(): void {
    this.addOutput(
      this.constructSocketName('Custom Output', this.outputSocketArray),
      DATATYPE.ANY
    );
  }

  updateCommentPosition(): void {
    // console.log(this.x, this.y);
    this._NodeCommentRef.x = getNodeCommentPosX(this.x, this.width);
    this._NodeCommentRef.y = getNodeCommentPosY(this.y);
  }

  updateConnectionPosition(): void {
    // check for connections and move them too
    this.inputSocketArray.concat(this.outputSocketArray).forEach((socket) => {
      socket.links.map((link) => {
        link.updateConnection();
      });
    });
  }

  drawComment(): void {
    const commentData = this.outputSocketArray[0]?.data;
    // console.log(this.outputSocketArray[0], commentData);
    if (commentData !== undefined) {
      // custom output for pixi elements
      if (
        this.outputSocketArray[0]?.dataType === DATATYPE.PIXI &&
        !Array.isArray(this.outputSocketArray[0].data)
      ) {
        const strippedCommentData = {
          alpha: commentData?.alpha,
          // children: commentData?.children,
          // parent: commentData?.parent,
          // transform: commentData?.transform,
          visible: commentData?.visible,
          height: commentData?.height,
          pivot: commentData?.pivot,
          position: commentData?.position,
          rotation: commentData?.rotation,
          scale: commentData?.scale,
          width: commentData?.width,
          x: commentData?.x,
          y: commentData?.y,
          zIndex: commentData?.zIndex,
          bounds: commentData?.getBounds(),
          localBounds: commentData?.getLocalBounds(),
        };
        this._NodeCommentRef.text = inspect(strippedCommentData, null, 1);
      } else {
        this._NodeCommentRef.text = inspect(commentData, null, 2);
      }
    }
  }

  screenPoint(): PIXI.Point {
    return this.graph.viewport.toScreen(
      this.x + NODE_MARGIN,
      this.y + NODE_MARGIN - 2
    );
  }

  // this function can be called for hybrid nodes, it
  // • creates a container component
  // • adds the onNodeDragOrViewportMove listener to it
  // • adds a react parent component with props
  createContainerComponent(
    parentDocument: Document,
    reactParent,
    reactProps
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

    // when the Node is removed also remove the react component and its container
    this.onNodeRemoved = () => {
      ReactDOM.unmountComponentAtNode(this.container);
      document.body.removeChild(this.container);
    };

    // render react component
    this.renderReactComponent(reactParent, reactProps);

    return this.container;
  }

  // the render method, takes a component and props, and renders it to the page
  renderReactComponent = (component, props) => {
    ReactDOM.render(
      React.createElement(component, {
        ...props,
        id: this.id,
        selected: this.selected,
        doubleClicked: this.doubleClicked,
      }),
      this.container
    );
  };

  getInputSocketByName(slotName: string): Socket {
    if (!this.inputSocketArray) {
      return undefined;
    }

    return this.inputSocketArray[
      this.inputSocketArray.findIndex((el) => el.name === slotName)
    ];
  }

  getOutputSocketByName(slotName: string): Socket {
    if (!this.outputSocketArray) {
      return undefined;
    }

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

  setInputData(name: string, data: any): void {
    console.log('input data set');
    const inputSocket = this.inputSocketArray.find((input: Socket) => {
      return name === input.name;
    });

    if (!inputSocket) {
      console.error('No input socket found with the name: ', name);
      return undefined;
    }

    inputSocket.data = data;
  }

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

  tick(currentTime: number, deltaTime: number): void {
    if (
      this.updateBehaviour.interval &&
      currentTime - this.lastTimeTicked >=
        this.updateBehaviour.intervalFrequency
    ) {
      this.lastTimeTicked = currentTime;
      this.execute(new Set());
    }
  }

  async initialExecute(): Promise<void> {
    return this.execute(new Set());
  }

  // if you want to optimize the mapping, override this function instead of execute()
  protected async rawExecute(): Promise<void> {
    // remap input
    const inputObject = {};
    this.inputSocketArray.forEach((input: Socket) => {
      inputObject[input.name] = input.data;
    });
    const outputObject = {};

    await this.onExecute(inputObject, outputObject);
    this.onAfterExecute();

    // output whatever the user has put in
    this.outputSocketArray.forEach((output: Socket) => {
      if (outputObject[output.name] !== undefined) {
        output.data = outputObject[output.name];
      }
    });
  }

  async execute(upstreamContent: Set<string>): Promise<void> {
    this.drawComment();

    await this.rawExecute();

    this.outputSocketArray.forEach((outputSocket) =>
      outputSocket.notifyChange(upstreamContent)
    );
  }

  // dont call this from outside, only from child class
  protected async onExecute(input, output): Promise<void> {
    // just define function
  }

  protected onAfterExecute(): void {
    // just define function
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
    this.on('added', this._onAdded.bind(this));
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
      console.log('_onPointerDown');

      const shiftKey = event.data.originalEvent.shiftKey;

      // select node if the shiftKey is pressed
      // or the node is not yet selected
      if (shiftKey || !this.selected) {
        this.graph.selection.selectNode(this, shiftKey);
      }

      this.interactionData = event.data;
      this.cursor = 'grabbing';
      this.alpha = 0.5;
      this.isDraggingNode = true;
      this.sourcePoint = this.interactionData.getLocalPosition(this);

      // subscribe to pointermove
      this.on('pointermove', this.onMoveHandler);
    }
  }

  _onPointerUpAndUpOutside(): void {
    console.log('_onPointerUpAndUpOutside');

    // unsubscribe from pointermove
    this.removeListener('pointermove', this.onMoveHandler);

    this.alpha = 1;
    this.isDraggingNode = false;
    this.cursor = 'move';
    // set the interactionData to null
    this.interactionData = null;
  }

  _onPointerMove(): void {
    if (
      this.isDraggingNode &&
      this.interactionData !== null &&
      this.sourcePoint !== null
    ) {
      const targetPoint = this.interactionData.getLocalPosition(this);
      const deltaX = targetPoint.x - this.sourcePoint.x;
      const deltaY = targetPoint.y - this.sourcePoint.y;

      // move selection
      this.graph.selection.moveSelection(deltaX, deltaY);
    }
  }

  _onViewportMove(): void {
    // console.log('_onViewportMove');
    if (this.onNodeDragOrViewportMove) {
      const screenPoint = this.screenPoint();
      this.onNodeDragOrViewportMove({
        screenX: screenPoint.x,
        screenY: screenPoint.y,
        scale: this.graph.viewport.scale.x,
      });
    }
  }

  _onAdded(): void {
    // console.log('_onAdded');
    if (this.onNodeAdded) {
      this.onNodeAdded();
    }
    this.initialExecute();
  }

  _onRemoved(): void {
    // console.log('_onRemoved');

    // remove node comment
    (
      this.graph.viewport.getChildByName('commentContainer') as PIXI.Container
    ).removeChild(this._NodeCommentRef);

    // remove added listener from graph.viewport
    this.graph.viewport.removeListener('moved', this.onViewportMoveHandler);

    if (this.onNodeRemoved) {
      this.onNodeRemoved();
    }
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
    console.log('_onDoubleClick');
    this.doubleClicked = true;

    // turn on pointer events for hybrid nodes so the react components become reactive
    if (this.isHybrid) {
      this.container.style.pointerEvents = 'auto';
    }

    if (this.onNodeDoubleClick) {
      this.onNodeDoubleClick(event);
    }
  }
}

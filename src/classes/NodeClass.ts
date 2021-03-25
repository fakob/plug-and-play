import * as PIXI from 'pixi.js';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import { hri } from 'human-readable-ids';
import { inspect } from 'util'; // or directly
import '../pixi/dbclick.js';

import { SerializedNode } from '../utils/interfaces';
import {
  COMMENT_TEXTSTYLE,
  NODE_BACKGROUNDCOLOR_HEX,
  NODE_SELECTIONCOLOR_HEX,
  NODE_CORNERRADIUS,
  NODE_MARGIN_TOP,
  NODE_MARGIN_BOTTOM,
  NODE_OUTLINE_DISTANCE,
  NODE_HEADER_HEIGHT,
  NODE_HEADER_TEXTMARGIN_LEFT,
  NODE_HEADER_TEXTMARGIN_TOP,
  NODE_TEXTSTYLE,
  NODE_WIDTH,
  SOCKET_HEIGHT,
  SOCKET_WIDTH,
  DATATYPE,
  SOCKET_TYPE,
} from '../utils/constants';
import PPGraph from './GraphClass';
import Socket from './SocketClass';
import { getNodeCommentPosX, getNodeCommentPosY } from '../utils/utils';

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
  nodePosX: number;
  nodePosY: number;
  nodeWidth: number;
  nodeHeight: number;

  inputSocketArray: Socket[];
  outputSocketArray: Socket[];

  _selected: boolean;
  dragging: boolean;
  relativeClickPosition: PIXI.Point | null;
  clickPosition: PIXI.Point | null;
  interactionData: PIXI.InteractionData | null;

  // supported callbacks
  onConfigure: ((node_info: SerializedNode) => void) | null;
  onNodeDoubleClick: ((event: PIXI.InteractionEvent) => void) | null;
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onNodeAdded: (() => void) | null; // called when the node is added to the graph
  onNodeRemoved: (() => void) | null; // called when the node is removed from the graph
  onNodeSelected: ((selected: boolean) => void) | null; // called when the node is selected/unselected
  onNodeDragOrViewportMove: // called when the node or or the viewport with the node is moved or scaled
  | ((positions: {
        globalX: number;
        globalY: number;
        screenX: number;
        screenY: number;
        scale: number;
      }) => void)
    | null;

  constructor(
    type: string,
    graph: PPGraph,
    customArgs?: {
      customId?: string;
      nodePosX?: number;
      nodePosY?: number;
      nodeWidth?: number;
      nodeHeight?: number;
    }
  ) {
    super();
    this.graph = graph;
    this.id = customArgs?.customId ?? hri.random();
    this.name = type;
    this.type = type;
    this.description = '';
    this.inputSocketArray = [];
    this.outputSocketArray = [];
    this.clickedSocketRef = null;

    // customArgs
    this.x = customArgs?.nodePosX ?? 0;
    this.y = customArgs?.nodePosY ?? 0;
    console.log(customArgs);
    this.nodeWidth = customArgs?.nodeWidth ?? NODE_WIDTH;
    this.nodeHeight = customArgs?.nodeHeight ?? NODE_WIDTH;

    const inputNameText = new PIXI.Text(this.name, NODE_TEXTSTYLE);
    inputNameText.x = NODE_HEADER_TEXTMARGIN_LEFT;
    inputNameText.y =
      NODE_OUTLINE_DISTANCE + NODE_MARGIN_TOP + NODE_HEADER_TEXTMARGIN_TOP;
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
    this._NodeCommentRef = (this.graph.viewport.getChildByName(
      'commentContainer'
    ) as PIXI.Container).addChild(nodeComment);

    // draw shape
    this.drawNodeShape();

    this.interactive = true;
    this.interactionData = null;
    this.relativeClickPosition = null;
    this.clickPosition = null;
    this.dragging = false;
    this._selected = false;

    this._addListeners();
  }

  // GETTERS & SETTERS

  get nodeNameRef(): PIXI.DisplayObject {
    return this._NodeNameRef;
  }

  get selected(): boolean {
    return this._selected;
  }

  get nodeName(): string {
    return this.name;
  }

  set nodeName(text: string) {
    this.name = text;
    this._NodeNameRef.text = text;
  }

  // METHODS
  select(selected: boolean): void {
    this._selected = selected;
    this.drawNodeShape(selected);
    if (this.onNodeSelected) {
      this.onNodeSelected(selected);
    }
  }

  addInput(
    name: string,
    type: string,
    data?: any,
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
    const o: SerializedNode = {
      id: this.id,
      name: this.name,
      type: this.type,
      x: this.x,
      y: this.y,
    };

    o.inputSocketArray = [];
    this.inputSocketArray.forEach((item) => {
      o.inputSocketArray.push(item.serialize());
    });

    o.outputSocketArray = [];
    this.outputSocketArray.forEach((item) => {
      o.outputSocketArray.push(item.serialize());
    });

    return o;
  }

  configure(node_info: SerializedNode): void {
    this.x = node_info.x;
    this.y = node_info.y;
    // update position of comment
    this.updateCommentPosition();

    // set parameters on inputSocket
    this.inputSocketArray.forEach((item, index) => {
      console.log(node_info.inputSocketArray[index]);
      item.setName(node_info.inputSocketArray[index]?.name ?? null);
      item.dataType = node_info.inputSocketArray[index]?.dataType ?? null;
      item.data = node_info.inputSocketArray[index]?.data ?? null;
      item.setVisible(node_info.inputSocketArray[index]?.visible ?? true);
      item.custom = node_info.inputSocketArray[index]?.custom ?? undefined;
    });

    // set parameters on outputSocket
    this.outputSocketArray.forEach((item, index) => {
      console.log(node_info.outputSocketArray[index]);
      item.setName(node_info.outputSocketArray[index]?.name ?? null);
      item.dataType = node_info.outputSocketArray[index]?.dataType ?? undefined;
      item.setVisible(node_info.outputSocketArray[index]?.visible ?? true);
      item.custom = node_info.outputSocketArray[index]?.custom ?? undefined;
    });

    if (this.onConfigure) {
      this.onConfigure(node_info);
    }
  }

  drawNodeShape(selected: boolean = this._selected): void {
    const countOfVisibleInputSockets = this.inputSocketArray.filter(
      (item) => item.visible === true
    ).length;
    const countOfVisibleOutputSockets = this.outputSocketArray.filter(
      (item) => item.visible === true
    ).length;

    // redraw background due to size change
    this._BackgroundRef.clear();
    this._BackgroundRef.beginFill(NODE_BACKGROUNDCOLOR_HEX);
    this._BackgroundRef.drawRoundedRect(
      SOCKET_WIDTH / 2,
      NODE_OUTLINE_DISTANCE + 0,
      this.nodeWidth,
      NODE_MARGIN_TOP +
        NODE_HEADER_HEIGHT +
        countOfVisibleInputSockets * SOCKET_HEIGHT +
        countOfVisibleOutputSockets * SOCKET_HEIGHT +
        NODE_MARGIN_BOTTOM,
      NODE_CORNERRADIUS
    );
    this._BackgroundRef.endFill();

    // redraw outputs
    let posCounter = 0;
    this.outputSocketArray.forEach((item) => {
      console.log(item, item.x, item.getBounds().width, this.nodeWidth);
      if (item.visible) {
        item.y =
          NODE_OUTLINE_DISTANCE +
          NODE_MARGIN_TOP +
          NODE_HEADER_HEIGHT +
          posCounter * SOCKET_HEIGHT;
        item.x = this.nodeWidth - NODE_WIDTH;
        posCounter += 1;
      }
    });

    // redraw inputs
    posCounter = 0;
    this.inputSocketArray.forEach((item) => {
      if (item.visible) {
        item.y =
          NODE_OUTLINE_DISTANCE +
          NODE_MARGIN_TOP +
          NODE_HEADER_HEIGHT +
          countOfVisibleOutputSockets * SOCKET_HEIGHT +
          posCounter * SOCKET_HEIGHT;
        posCounter += 1;
      }
    });

    // optional drawShape
    // if (this.drawShape) {
    this.drawShape();
    // }

    if (selected) {
      this._BackgroundRef.lineStyle(2, NODE_SELECTIONCOLOR_HEX, 1, 0);
      this._BackgroundRef.drawRoundedRect(
        SOCKET_WIDTH / 2 - NODE_OUTLINE_DISTANCE,
        0,
        NODE_OUTLINE_DISTANCE * 2 + this.nodeWidth,
        NODE_OUTLINE_DISTANCE * 2 +
          NODE_MARGIN_TOP +
          NODE_HEADER_HEIGHT +
          countOfVisibleInputSockets * SOCKET_HEIGHT +
          countOfVisibleOutputSockets * SOCKET_HEIGHT +
          NODE_MARGIN_BOTTOM,
        NODE_CORNERRADIUS + NODE_OUTLINE_DISTANCE
      );
    }

    // update position of comment
    this.updateCommentPosition();
  }

  updateCommentPosition(): void {
    // console.log(this.x, this.y);
    this._NodeCommentRef.x = getNodeCommentPosX(this.x);
    this._NodeCommentRef.y = getNodeCommentPosY(this.y);
  }

  drawShape(): void {
    // just define function
  }

  drawComment(): void {
    const commentData = this.outputSocketArray[0]?.data;
    // console.log(this.outputSocketArray[0], commentData);
    if (commentData !== undefined) {
      // custom output for pixi elements
      if (this.outputSocketArray[0]?.dataType === DATATYPE.PIXI) {
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

  getInputData<T = any>(slot: number): T {
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
    if (!link) {
      //bug: weird case but it happens sometimes
      // Cringe /Tobias, we need to fix this
      return undefined;
    }

    return link.source.data;
  }

  setOutputData(slot: number, data: any): void {
    if (!this.outputSocketArray) {
      return;
    }

    if (slot === -1 || slot >= this.outputSocketArray.length) {
      return;
    }

    const outputSocket = this.outputSocketArray[slot];
    if (!outputSocket) {
      return;
    }

    //store data in the output itself in case we want to debug
    outputSocket.data = data;

    // //if there are connections, pass the data to the connections
    // if (this.outputSocketArray[slot].links) {
    //   for (let i = 0; i < this.outputSocketArray[slot].links.length; i++) {
    //     const link = this.outputSocketArray[slot].links[i];
    //     if (link) link._data = data;
    //   }
    // }
  }

  execute(): void {
    // remap input
    const inputObject = {};
    this.inputSocketArray
      .filter((socket) => socket.socketType === SOCKET_TYPE.IN)
      .forEach((input: Socket) => {
        inputObject[input.name] = input.data;
      });
    const outputObject = {};

    this.onExecute(inputObject, outputObject);
    this.onAfterExecute();

    // output whatever the user has put in
    this.outputSocketArray
      .filter((socket) => socket.socketType === SOCKET_TYPE.OUT)
      .forEach((output: Socket) => {
        if (outputObject[output.name] !== undefined) {
          output.data = outputObject[output.name];
        }
      });
  }

  // dont call this from outside, only from child class
  protected onExecute(input, output): void {
    // just define function
  }

  protected onAfterExecute(): void {
    // just define function
  }

  // SETUP

  _addListeners(): void {
    this.on('pointerdown', this._onPointerDown.bind(this));
    this.on('pointerup', this._onPointerUpAndUpOutside.bind(this));
    this.on('pointerupoutside', this._onPointerUpAndUpOutside.bind(this));
    this.on('pointermove', this._onPointerMove.bind(this));
    this.on('pointerover', this._onPointerOver.bind(this));
    this.on('pointerout', this._onPointerOut.bind(this));
    this.on('click', this._onClick.bind(this));
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
      // start dragging
      console.log('_onPointerDown');
      this.interactionData = event.data;
      this.clickPosition = new PIXI.Point(
        (event.data.originalEvent as PointerEvent).screenX,
        (event.data.originalEvent as PointerEvent).screenY
      );
      this.cursor = 'grabbing';
      this.alpha = 0.5;
      this.dragging = true;
      const localPositionX = this.position.x;
      const localPositionY = this.position.y;
      const localClickPosition = this.interactionData.getLocalPosition(
        this.parent
      );
      const localClickPositionX = localClickPosition.x;
      const localClickPositionY = localClickPosition.y;
      const deltaX = localClickPositionX - localPositionX;
      const deltaY = localClickPositionY - localPositionY;
      this.relativeClickPosition = new PIXI.Point(deltaX, deltaY);
    }
  }

  _onPointerUpAndUpOutside(event: PIXI.InteractionEvent): void {
    const evData = event.data.originalEvent as PointerEvent;
    // if real dragend
    if (this.clickPosition !== null) {
      if (
        Math.abs(this.clickPosition.x - evData.screenX) < 2 ||
        Math.abs(this.clickPosition.y - evData.screenY) < 2
      ) {
        this._onClick();
      } else {
        event.stopPropagation();
      }
    }

    this.alpha = 1;
    this.dragging = false;
    // set the interactionData to null
    this.interactionData = null;
  }

  _onPointerMove(): void {
    if (
      this.dragging &&
      this.interactionData !== null &&
      this.relativeClickPosition !== null
    ) {
      const newPosition = this.interactionData.getLocalPosition(this.parent);
      const globalX = newPosition.x - this.relativeClickPosition.x;
      const globalY = newPosition.y - this.relativeClickPosition.y;
      this.x = globalX;
      this.y = globalY;
      this.updateCommentPosition();

      // check for connections and move them too
      this.outputSocketArray.map((output) => {
        output.links.map((link) => {
          link.updateConnection();
        });
      });
      this.inputSocketArray.map((input) => {
        input.links.map((link) => {
          link.updateConnection();
        });
      });

      if (this.onNodeDragOrViewportMove) {
        const screenPoint = this.graph.viewport.toScreen(this.x, this.y);
        this.onNodeDragOrViewportMove({
          globalX,
          globalY,
          screenX: screenPoint.x,
          screenY: screenPoint.y,
          scale: this.graph.viewport.scale.x,
        });
      }
    }
  }

  _onViewportMove(): void {
    // console.log('_onViewportMove');
    if (this.onNodeDragOrViewportMove) {
      const screenPoint = this.graph.viewport.toScreen(this.x, this.y);
      this.onNodeDragOrViewportMove({
        globalX: this.x,
        globalY: this.y,
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
  }

  _onRemoved(): void {
    // console.log('_onRemoved');

    // remove node comment
    (this.graph.viewport.getChildByName(
      'commentContainer'
    ) as PIXI.Container).removeChild(this._NodeCommentRef);

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
    if (!this.dragging) {
      this.alpha = 1.0;
      this.cursor = 'default';
    }
  }

  _onClick(): void {
    if (this._selected && !this.dragging) {
      this.select(false);
      this.cursor = 'pointer';
    } else {
      this.select(true);
      this.cursor = 'move';
    }
  }

  _onDoubleClick(event: PIXI.InteractionEvent): void {
    console.log('_onDoubleClick');
    if (this.onNodeDoubleClick) {
      this.onNodeDoubleClick(event);
    }
  }
}

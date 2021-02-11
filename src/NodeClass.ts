import * as PIXI from 'pixi.js';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import { hri } from 'human-readable-ids';
import { inspect } from 'util'; // or directly
import './pixi/dbclick.js';

import { SerializedNode } from './interfaces';
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
  INPUTSOCKET_HEIGHT,
  INPUTSOCKET_WIDTH,
  OUTPUTSOCKET_HEIGHT,
  OUTPUTTYPE,
} from './constants';
import PPGraph from './GraphClass';
import InputSocket from './InputSocketClass';
import OutputSocket from './OutputSocketClass';
import { getNodeCommentPosX, getNodeCommentPosY } from './utils';

export default class PPNode extends PIXI.Container {
  _NodeNameRef: PIXI.Text;
  _NodeCommentRef: PIXI.Text;
  _BackgroundRef: PIXI.Graphics;
  clickedSocketRef: null | OutputSocket;

  graph: PPGraph;
  id: string;
  // name: string; // Display name - at first it is the type with spaces - defined on PIXI.Container
  type: string; // Type
  category: string; // Category - derived from type
  description: string;

  inputSocketArray: InputSocket[];
  outputSocketArray: OutputSocket[];

  _selected: boolean;
  dragging: boolean;
  relativeClickPosition: PIXI.Point | null;
  clickPosition: PIXI.Point | null;
  interactionData: PIXI.InteractionData | null;

  // supported callbacks
  onConfigure: ((node_info: SerializedNode) => void) | null;
  onNodeDoubleClick: ((event: PIXI.InteractionEvent) => void) | null;

  constructor(type: string, graph: PPGraph, customId: string) {
    super();
    this.graph = graph;
    this.id = customId === '' ? hri.random() : customId;
    this.name = type;
    this.type = type;
    this.description = '';
    this.inputSocketArray = [];
    this.outputSocketArray = [];
    this.clickedSocketRef = null;

    const inputNameText = new PIXI.Text(this.name, NODE_TEXTSTYLE);
    inputNameText.x = NODE_OUTLINE_DISTANCE + NODE_HEADER_TEXTMARGIN_LEFT;
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
    this.drawNodeShape(this._selected);

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
  }

  addInput(
    name: string,
    type: string,
    defaultValue?: any,
    visible?: boolean
  ): void {
    const inputSocket = new InputSocket(name, type, defaultValue, visible);
    const inputSocketRef = this.addChild(inputSocket);
    inputSocketRef.y =
      NODE_OUTLINE_DISTANCE +
      NODE_MARGIN_TOP +
      NODE_HEADER_HEIGHT +
      this.outputSocketArray.length * OUTPUTSOCKET_HEIGHT +
      this.inputSocketArray.filter((item) => item.visible === true).length *
        INPUTSOCKET_HEIGHT;

    this.inputSocketArray.push(inputSocketRef);

    // redraw background due to size change
    this.drawNodeShape(this._selected);
  }

  addOutput(name: string, type: string): void {
    const outputSocket = new OutputSocket(name, type);
    const outputSocketRef = this.addChild(outputSocket);
    outputSocketRef.y =
      NODE_OUTLINE_DISTANCE +
      NODE_MARGIN_TOP +
      NODE_HEADER_HEIGHT +
      this.outputSocketArray.length * OUTPUTSOCKET_HEIGHT;

    this.outputSocketArray.push(outputSocketRef);

    // redraw background due to size change
    this.drawNodeShape(this._selected);
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

    if (this.inputSocketArray.length > 0) {
      o.inputSocketArray = [];
      this.inputSocketArray.forEach((item) => {
        o.inputSocketArray.push(item.serialize());
      });
    }

    if (this.outputSocketArray.length > 0) {
      o.outputSocketArray = [];
      this.outputSocketArray.forEach((item) => {
        o.outputSocketArray.push(item.serialize());
      });
    }

    return o;
  }

  configure(node_info: SerializedNode): void {
    this.x = node_info.x;
    this.y = node_info.y;
    // update position of comment
    this.updateCommentPosition();

    // set parameters on inputSocket
    if (this.inputSocketArray.length > 0) {
      this.inputSocketArray.forEach((item, index) => {
        item.defaultValue = node_info.inputSocketArray[index].defaultValue;
        item.value = node_info.inputSocketArray[index].value;
        item.visible = node_info.inputSocketArray[index].visible;
      });
    }

    if (this.onConfigure) {
      this.onConfigure(node_info);
    }
  }

  drawNodeShape(selected: boolean): void {
    // redraw background due to size change
    this._BackgroundRef.clear();
    this._BackgroundRef.beginFill(NODE_BACKGROUNDCOLOR_HEX);
    this._BackgroundRef.drawRoundedRect(
      NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH / 2,
      NODE_OUTLINE_DISTANCE + 0,
      NODE_WIDTH,
      NODE_MARGIN_TOP +
        NODE_HEADER_HEIGHT +
        this.inputSocketArray.length * INPUTSOCKET_HEIGHT +
        this.outputSocketArray.length * OUTPUTSOCKET_HEIGHT +
        NODE_MARGIN_BOTTOM,
      NODE_CORNERRADIUS
    );
    this._BackgroundRef.endFill();

    // optional drawShape
    // if (this.drawShape) {
    this.drawShape();
    // }

    if (selected) {
      this._BackgroundRef.lineStyle(2, NODE_SELECTIONCOLOR_HEX, 1, 0);
      this._BackgroundRef.drawRoundedRect(
        INPUTSOCKET_WIDTH / 2,
        0,
        NODE_OUTLINE_DISTANCE * 2 + NODE_WIDTH,
        NODE_OUTLINE_DISTANCE * 2 +
          NODE_MARGIN_TOP +
          NODE_HEADER_HEIGHT +
          this.inputSocketArray.length * INPUTSOCKET_HEIGHT +
          this.outputSocketArray.length * OUTPUTSOCKET_HEIGHT +
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
      if (this.outputSocketArray[0]?.type === OUTPUTTYPE.PIXI) {
        const strippedCommentData = {
          alpha: commentData.alpha,
          // children: commentData.children,
          // parent: commentData.parent,
          // transform: commentData.transform,
          visible: commentData.visible,
          height: commentData.height,
          pivot: commentData.pivot,
          position: commentData.position,
          rotation: commentData.rotation,
          scale: commentData.scale,
          width: commentData.width,
          x: commentData.x,
          y: commentData.y,
          zIndex: commentData.zIndex,
          bounds: commentData.getBounds(),
          localBounds: commentData.getLocalBounds(),
        };
        this._NodeCommentRef.text = inspect(strippedCommentData, null, 1);
      } else {
        this._NodeCommentRef.text = inspect(commentData, null, 2);
      }
    }
  }

  getInputData<T = any>(slot: number): T {
    if (!this.inputSocketArray) {
      return undefined;
    }

    // if no link, then return value
    if (
      slot >= this.inputSocketArray.length ||
      this.inputSocketArray[slot].link === null
    ) {
      return this.inputSocketArray[slot].value;
    }

    const link = this.inputSocketArray[slot].link;
    if (!link) {
      //bug: weird case but it happens sometimes
      return undefined;
    }

    return link.source.data;
  }

  setOutputData(slot: number, data: any): void {
    if (!this.outputSocketArray) {
      return;
    }

    if (slot == -1 || slot >= this.outputSocketArray.length) {
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

  onExecute(): void {
    // just define function
  }

  onAfterExecute(): void {
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
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
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
      this.x = newPosition.x - this.relativeClickPosition.x;
      this.y = newPosition.y - this.relativeClickPosition.y;
      this.updateCommentPosition();

      // check for connections and move them too
      this.outputSocketArray.map((output) => {
        output.links.map((link) => {
          link.updateConnection();
        });
      });
      this.inputSocketArray.map((input) => {
        if (input.link !== null) {
          input.link.updateConnection();
        }
      });
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

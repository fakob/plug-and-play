import * as PIXI from 'pixi.js';
import { NodeData } from './interfaces';
import {
  COLOR_MAIN,
  NODE_BACKGROUNDCOLOR,
  NODE_CORNERRADIUS,
  NODE_MARGIN_TOP,
  NODE_MARGIN_BOTTOM,
  NODE_OUTLINE_DISTANCE,
  NODE_HEADER_HEIGHT,
  NODE_HEADER_TEXTMARGIN_LEFT,
  NODE_HEADER_TEXTMARGIN_TOP,
  NODE_TEXTSTYLE,
  NODE_WIDTH,
  INPUTNODE_HEIGHT,
  INPUTNODE_TEXTSTYLE,
  INPUTSOCKET_WIDTH,
  INPUTSOCKET_CORNERRADIUS,
  INPUTSOCKET_TEXTMARGIN_LEFT,
  INPUTSOCKET_TEXTMARGIN_TOP,
} from './constants';

const mainColorHex = PIXI.utils.string2hex(COLOR_MAIN);
const nodeBackgroundColorHex = PIXI.utils.string2hex(NODE_BACKGROUNDCOLOR);

export default class PPNode extends PIXI.Container {
  _NodeNameRef: PIXI.DisplayObject;

  _BackgroundRef: PIXI.Graphics;

  _selected: boolean;

  dragging: boolean;

  relativeClickPosition: PIXI.Point | null;

  clickPosition: PIXI.Point | null;

  data: PIXI.InteractionData | null;

  inputNodeArray: PIXI.DisplayObject[];

  type: string;

  id: number | null;

  constructor(node: NodeData) {
    super();
    this.id = null;
    this.name = node.name;
    this.type = node.type;
    this.inputNodeArray = [];

    const inputNameText = new PIXI.Text(this.name, NODE_TEXTSTYLE);
    inputNameText.x = NODE_OUTLINE_DISTANCE + NODE_HEADER_TEXTMARGIN_LEFT;
    inputNameText.y =
      NODE_OUTLINE_DISTANCE + NODE_MARGIN_TOP + NODE_HEADER_TEXTMARGIN_TOP;
    inputNameText.resolution = 8;

    const background = new PIXI.Graphics();

    this._BackgroundRef = this.addChild(background);
    this._NodeNameRef = this.addChild(inputNameText);

    for (let index = 0; index < node.inputs.length; index++) {
      const inputNode = new InputNode(
        node.inputs[index].name,
        node.inputs[index].type
      );
      const inputNodeRef = this.addChild(inputNode);
      inputNodeRef.y =
        NODE_MARGIN_TOP + NODE_HEADER_HEIGHT + index * INPUTNODE_HEIGHT;
      this.inputNodeArray.push(inputNodeRef);
    }

    // draw shape
    this.updateShape(this._selected);

    this.interactive = true;
    this.data = null;
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

  // SETUP

  _addListeners(): void {
    this.on('pointerdown', this._onDragStart.bind(this));
    this.on('pointerup', this._onDragEnd.bind(this));
    this.on('pointerupoutside', this._onDragEnd.bind(this));
    this.on('pointermove', this._onDragMove.bind(this));
    this.on('pointerover', this._onSpriteOver.bind(this));
    this.on('pointerout', this._onSpriteOut.bind(this));
    this.on('click', this._onClick.bind(this));
  }

  _onDragStart(event: any): void {
    console.log('_onDragStart');
    this.data = event.data;
    this.clickPosition = new PIXI.Point(
      event.data.originalEvent.screenX,
      event.data.originalEvent.screenY
    );
    this.cursor = 'grabbing';
    // if (this._selected) {
    this.alpha = 0.5;
    this.dragging = true;
    const localPositionX = this.position.x;
    const localPositionY = this.position.y;
    const localClickPosition = this.data.getLocalPosition(this.parent);
    const localClickPositionX = localClickPosition.x;
    const localClickPositionY = localClickPosition.y;
    const deltaX = localClickPositionX - localPositionX;
    const deltaY = localClickPositionY - localPositionY;
    this.relativeClickPosition = new PIXI.Point(deltaX, deltaY);
    // }
  }

  _onDragEnd(event: any): void {
    const evData = event.data.originalEvent;
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
    // set the interaction data to null
    this.data = null;
  }

  _onDragMove(): void {
    if (
      this.dragging &&
      this.data !== null &&
      this.relativeClickPosition !== null
    ) {
      const newPosition = this.data.getLocalPosition(this.parent);
      this.x = newPosition.x - this.relativeClickPosition.x;
      this.y = newPosition.y - this.relativeClickPosition.y;
    }
  }

  _onSpriteOver(): void {
    this.cursor = 'move';
  }

  _onSpriteOut(): void {
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

  // METHODS
  select(selected: boolean): void {
    this._selected = selected;
    this.updateShape(selected);
  }

  addInput(name: string, type: string): void {
    const inputNode = new InputNode(name, type);
    const inputNodeRef = this.addChild(inputNode);
    inputNodeRef.y =
      NODE_MARGIN_TOP +
      NODE_HEADER_HEIGHT +
      this.inputNodeArray.length * INPUTNODE_HEIGHT;

    this.inputNodeArray.push(inputNodeRef);

    // redraw background due to size change
    this.updateShape(this._selected);
  }

  updateShape(selected: boolean): void {
    // redraw background due to size change
    this._BackgroundRef.clear();
    this._BackgroundRef.beginFill(nodeBackgroundColorHex);
    this._BackgroundRef.drawRoundedRect(
      NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH / 2,
      NODE_OUTLINE_DISTANCE + 0,
      NODE_WIDTH,
      NODE_MARGIN_TOP +
        NODE_HEADER_HEIGHT +
        this.inputNodeArray.length * INPUTNODE_HEIGHT +
        NODE_MARGIN_BOTTOM,
      NODE_CORNERRADIUS
    );
    this._BackgroundRef.endFill();
    if (selected) {
      this._BackgroundRef.lineStyle(1, 0xff00ff, 1, 0);
      this._BackgroundRef.drawRoundedRect(
        INPUTSOCKET_WIDTH / 2,
        0,
        NODE_OUTLINE_DISTANCE * 2 + NODE_WIDTH,
        NODE_OUTLINE_DISTANCE * 2 +
          NODE_MARGIN_TOP +
          NODE_HEADER_HEIGHT +
          this.inputNodeArray.length * INPUTNODE_HEIGHT +
          NODE_MARGIN_BOTTOM,
        NODE_CORNERRADIUS + NODE_OUTLINE_DISTANCE
      );
    }
  }
}

class InputNode extends PIXI.Container {
  _InputNameRef: PIXI.DisplayObject;

  _InputSocketRef: PIXI.DisplayObject;

  data: PIXI.InteractionData | null;

  type: string;

  constructor(name = 'Number', type = 'number') {
    super();
    this.name = name;
    this.type = type;

    const socket = new PIXI.Graphics();
    socket.beginFill(mainColorHex);
    socket.drawRoundedRect(
      NODE_OUTLINE_DISTANCE + 0,
      NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH / 2,
      INPUTSOCKET_WIDTH,
      INPUTSOCKET_WIDTH,
      INPUTSOCKET_CORNERRADIUS
    );
    socket.endFill();

    const inputNameText = new PIXI.Text(name, INPUTNODE_TEXTSTYLE);
    inputNameText.x =
      NODE_OUTLINE_DISTANCE + socket.width + INPUTSOCKET_TEXTMARGIN_LEFT;
    inputNameText.y = NODE_OUTLINE_DISTANCE + INPUTSOCKET_TEXTMARGIN_TOP;
    inputNameText.resolution = 8; // so one can zoom in closer and it keeps a decent resolution

    this._InputSocketRef = this.addChild(socket);
    this._InputNameRef = this.addChild(inputNameText);

    this.data = null;
    this.interactive = true;
    this._InputSocketRef.interactive = true;
    this._InputSocketRef.on('pointerover', this._onSpriteOver.bind(this));
    this._InputSocketRef.on('pointerout', this._onSpriteOut.bind(this));
    this._InputSocketRef.on('click', this._onClick.bind(this));
  }

  // GETTERS & SETTERS

  get inputSocketRef(): PIXI.DisplayObject {
    return this._InputSocketRef;
  }

  get inputNameRef(): PIXI.DisplayObject {
    return this._InputNameRef;
  }

  // SETUP

  _onSpriteOver(): void {
    this.cursor = 'pointer';
    (this._InputSocketRef as PIXI.Graphics).tint = 0x00ff00;
  }

  _onSpriteOut(): void {
    this.alpha = 1.0;
    this.cursor = 'default';
    (this._InputSocketRef as PIXI.Graphics).tint = 0xffffff;
  }

  _onClick(event: PIXI.InteractionEvent): void {
    console.log(event.target);
  }
}

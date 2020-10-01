import * as PIXI from 'pixi.js';
import { NodeData } from './interfaces';
import {
  COLOR_MAIN,
  NODE_BACKGROUNDCOLOR,
  NODE_CORNERRADIUS,
  NODE_MARGIN_TOP,
  NODE_MARGIN_BOTTOM,
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

export default class Node extends PIXI.Container {
  _NodeNameRef: PIXI.DisplayObject;

  inputNodeArray: PIXI.DisplayObject[];

  data: PIXI.InteractionData | null;

  type: string;

  constructor(node: NodeData) {
    super();
    this.name = node.name;
    this.type = node.type;
    this.inputNodeArray = [];

    const inputNameText = new PIXI.Text(this.name, NODE_TEXTSTYLE);
    inputNameText.x = NODE_HEADER_TEXTMARGIN_LEFT;
    inputNameText.y = NODE_MARGIN_TOP + NODE_HEADER_TEXTMARGIN_TOP;
    inputNameText.resolution = 8;

    const background = new PIXI.Graphics();
    background.beginFill(nodeBackgroundColorHex);
    background.drawRoundedRect(
      INPUTSOCKET_WIDTH / 2,
      0,
      NODE_WIDTH,
      NODE_MARGIN_TOP +
        NODE_HEADER_HEIGHT +
        node.inputs.length * INPUTNODE_HEIGHT +
        NODE_MARGIN_BOTTOM,
      NODE_CORNERRADIUS
    );
    background.endFill();

    this.addChild(background);
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

    // this.data = null;
    this.interactive = true;
    // this._InputSocketRef.on('pointerover', this._onSpriteOver.bind(this));
    // this._InputSocketRef.on('pointerout', this._onSpriteOut.bind(this));
    // this._InputSocketRef.on('click', this._onClick.bind(this));
  }

  // GETTERS & SETTERS

  get nodeNameRef(): PIXI.DisplayObject {
    return this._NodeNameRef;
  }

  // SETUP
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
      0,
      INPUTSOCKET_WIDTH / 2,
      INPUTSOCKET_WIDTH,
      INPUTSOCKET_WIDTH,
      INPUTSOCKET_CORNERRADIUS
    );
    socket.endFill();

    const background = new PIXI.Graphics();
    background.beginFill(0xff0000, 0);
    background.drawRect(0, 0, NODE_WIDTH, INPUTNODE_HEIGHT);
    background.endFill();

    const inputNameText = new PIXI.Text(name, INPUTNODE_TEXTSTYLE);
    inputNameText.x = socket.width + INPUTSOCKET_TEXTMARGIN_LEFT;
    inputNameText.y = INPUTSOCKET_TEXTMARGIN_TOP;
    inputNameText.resolution = 8; // so one can zoom in closer and it keeps a decent resolution

    this.addChild(background);
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

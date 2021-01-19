import * as PIXI from 'pixi.js';
import { SerializedInputSocket } from './interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  SOCKET_COLOR_HEX,
  SOCKET_COLOR_TINT_HEX,
  NODE_OUTLINE_DISTANCE,
  INPUTSOCKET_TEXTSTYLE,
  INPUTSOCKET_WIDTH,
  INPUTSOCKET_CORNERRADIUS,
  INPUTSOCKET_TEXTMARGIN_LEFT,
  INPUTSOCKET_TEXTMARGIN_TOP,
  TEXT_RESOLUTION,
  INPUTTYPE,
} from './constants';

export default class InputSocket extends PIXI.Container {
  _InputNameRef: PIXI.DisplayObject;
  _InputSocketRef: PIXI.DisplayObject;

  defaultValue: any;
  _value: any;
  type: string;
  interactionData: PIXI.InteractionData | null;

  link: PPLink | null;

  constructor(
    name = 'Number',
    type = INPUTTYPE.NUMBER,
    defaultValue = null,
    visible = true
  ) {
    super();

    // define defaultValues for different types
    if (defaultValue === null) {
      switch (type) {
        case INPUTTYPE.NUMBER:
          defaultValue = 0;
          break;
        case INPUTTYPE.STRING:
          defaultValue = '';
          break;
        case INPUTTYPE.COLOR:
          defaultValue = [255, 55, 0, 0.5];
          break;
        case INPUTTYPE.ARRAY:
          defaultValue = [];
          break;
        case INPUTTYPE.PIXI:
          defaultValue = undefined;
          break;
        default:
          break;
      }
    }

    this.name = name;
    this.type = type;
    this.link = null;
    this.defaultValue = defaultValue;
    this._value = defaultValue;
    this.visible = visible;

    const socket = new PIXI.Graphics();
    socket.beginFill(SOCKET_COLOR_HEX);
    socket.drawRoundedRect(
      NODE_OUTLINE_DISTANCE + 0,
      NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH / 2,
      INPUTSOCKET_WIDTH,
      INPUTSOCKET_WIDTH,
      INPUTSOCKET_CORNERRADIUS
    );
    socket.endFill();

    const inputNameText = new PIXI.Text(name, INPUTSOCKET_TEXTSTYLE);
    inputNameText.x =
      NODE_OUTLINE_DISTANCE + socket.width + INPUTSOCKET_TEXTMARGIN_LEFT;
    inputNameText.y = NODE_OUTLINE_DISTANCE + INPUTSOCKET_TEXTMARGIN_TOP;
    inputNameText.resolution = TEXT_RESOLUTION;

    this._InputSocketRef = this.addChild(socket);
    this._InputNameRef = this.addChild(inputNameText);

    this.interactionData = null;
    this.interactive = true;
    this._InputSocketRef.interactive = true;
    this._InputSocketRef.on('pointerover', this._onInputOver.bind(this));
    this._InputSocketRef.on('pointerout', this._onInputOut.bind(this));
    this._InputSocketRef.on('click', this._onInputClick.bind(this));
  }

  // GETTERS & SETTERS

  get inputSocketRef(): PIXI.DisplayObject {
    return this._InputSocketRef;
  }

  get inputNameRef(): PIXI.DisplayObject {
    return this._InputNameRef;
  }

  get index(): number {
    return (this.parent as PPNode).inputSocketArray.findIndex((item) => {
      return this === item;
    });
  }

  get value(): any {
    return this._value;
  }

  set value(newValue: any) {
    this._value = newValue;
  }

  // METHODS

  removeLink(): void {
    this.link = null;
  }

  getGraph(): PPGraph {
    return (this.parent as PPNode).graph;
  }

  serialize(): SerializedInputSocket {
    //create serialization object
    return {
      name: this.name,
      type: this.type,
      defaultValue: this.defaultValue,
      value: this.value,
      visible: this.visible,
    };
  }

  // SETUP

  _onInputOver(): void {
    // set overInputRef on graph
    this.getGraph().overInputRef = this;

    this.cursor = 'pointer';
    (this._InputSocketRef as PIXI.Graphics).tint = SOCKET_COLOR_TINT_HEX;
  }

  _onInputOut(): void {
    // reset overInputRef on graph
    this.getGraph().overInputRef = null;

    this.alpha = 1.0;
    this.cursor = 'default';
    (this._InputSocketRef as PIXI.Graphics).tint = 0xffffff;
  }

  _onInputClick(): void {
    // check if this input already has a connection and delete it
    this.getGraph().checkIfSocketHasConnectionAndDeleteIt(this, true);
  }
}

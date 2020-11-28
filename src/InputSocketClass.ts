import * as PIXI from 'pixi.js';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  COLOR_MAIN_HEX,
  NODE_OUTLINE_DISTANCE,
  INPUTSOCKET_TEXTSTYLE,
  INPUTSOCKET_WIDTH,
  INPUTSOCKET_CORNERRADIUS,
  INPUTSOCKET_TEXTMARGIN_LEFT,
  INPUTSOCKET_TEXTMARGIN_TOP,
} from './constants';

export default class InputSocket extends PIXI.Container {
  _InputNameRef: PIXI.DisplayObject;

  _InputSocketRef: PIXI.DisplayObject;

  data: PIXI.InteractionData | null;

  type: string;

  link: PPLink | null;

  constructor(name = 'Number', type = 'number') {
    super();
    this.name = name;
    this.type = type;
    this.link = null;

    const socket = new PIXI.Graphics();
    socket.beginFill(COLOR_MAIN_HEX);
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
    inputNameText.resolution = 8; // so one can zoom in closer and it keeps a decent resolution

    this._InputSocketRef = this.addChild(socket);
    this._InputNameRef = this.addChild(inputNameText);

    this.data = null;
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

  // METHODS

  removeLink(): void {
    this.link = null;
  }

  // SETUP

  _onInputOver(event: PIXI.InteractionEvent): void {
    console.log('_onInputOver', event.target.parent as InputSocket);

    // set overInputRef on graph
    (event.target.parent.parent as PPNode).graph.overInputRef = event.target
      .parent as InputSocket;

    this.cursor = 'pointer';
    (this._InputSocketRef as PIXI.Graphics).tint = 0x00ff00;
  }

  _onInputOut(): void {
    this.alpha = 1.0;
    this.cursor = 'default';
    (this._InputSocketRef as PIXI.Graphics).tint = 0xffffff;
  }

  _onInputClick(event: PIXI.InteractionEvent): void {
    const input = event.target.parent as InputSocket;
    // check if this input already has a connection and delete it
    (event.target.parent
      .parent as PPNode).graph.checkIfInputHasConnectionAndDeleteIt(input);

    console.log(event.target);
  }
}

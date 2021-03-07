import * as PIXI from 'pixi.js';
import { SerializedInputSocket } from '../utils/interfaces';
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
} from '../utils/constants';

export default class InputSocket extends PIXI.Container {
  _InputNameRef: PIXI.DisplayObject;
  _InputSocketRef: PIXI.DisplayObject;

  _defaultData: any;
  _data: any;
  _type: string;
  interactionData: PIXI.InteractionData | null;
  // isMovingLink: boolean;

  link: PPLink | null;

  constructor(
    name = 'Number',
    type = INPUTTYPE.NUMBER.TYPE,
    defaultData = null,
    visible = true
  ) {
    super();

    // define defaultDatas for different types
    if (defaultData === null) {
      switch (type) {
        case INPUTTYPE.NUMBER.TYPE:
          defaultData = INPUTTYPE.NUMBER.DEFAULTVALUE;
          break;
        case INPUTTYPE.STRING.TYPE:
          defaultData = INPUTTYPE.STRING.DEFAULTVALUE;
          break;
        case INPUTTYPE.COLOR.TYPE:
          defaultData = INPUTTYPE.COLOR.DEFAULTVALUE;
          break;
        case INPUTTYPE.ARRAY.TYPE:
          defaultData = INPUTTYPE.ARRAY.DEFAULTVALUE;
          break;
        case INPUTTYPE.PIXI.TYPE:
          defaultData = INPUTTYPE.PIXI.DEFAULTVALUE;
          break;
        default:
          break;
      }
    }

    this.name = name;
    this._type = type;
    this.link = null;
    this._defaultData = defaultData;
    this._data = defaultData;
    this.visible = visible;

    const socket = new PIXI.Graphics();
    socket.beginFill(SOCKET_COLOR_HEX);
    socket.drawRoundedRect(
      0,
      NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH / 2,
      INPUTSOCKET_WIDTH,
      INPUTSOCKET_WIDTH,
      INPUTSOCKET_CORNERRADIUS
    );
    socket.endFill();

    const inputNameText = new PIXI.Text(name, INPUTSOCKET_TEXTSTYLE);
    inputNameText.x = socket.width + INPUTSOCKET_TEXTMARGIN_LEFT;
    inputNameText.y = NODE_OUTLINE_DISTANCE + INPUTSOCKET_TEXTMARGIN_TOP;
    inputNameText.resolution = TEXT_RESOLUTION;

    this._InputSocketRef = this.addChild(socket);
    this._InputNameRef = this.addChild(inputNameText);

    this.interactionData = null;
    this.interactive = true;
    this._InputSocketRef.interactive = true;
    this._InputSocketRef.on('pointerover', this._onPointerOver.bind(this));
    this._InputSocketRef.on('pointerout', this._onPointerOut.bind(this));
    this._InputSocketRef.on('pointerdown', this._onPointerDown.bind(this));
    // this._InputSocketRef.on(
    //   'pointerupoutside',
    //   this._onPointerUpAndUpOutside.bind(this)
    // );
    // this._InputSocketRef.on(
    //   'pointerup',
    //   this._onPointerUpAndUpOutside.bind(this)
    // );
    // this._InputSocketRef.on('click', this._onInputClick.bind(this));
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

  get data(): any {
    return this._data;
  }

  set data(newValue: any) {
    this._data = newValue;
  }

  get type(): string {
    return this._type;
  }

  set type(newValue: string) {
    this._type = newValue;
  }

  get defaultData(): any {
    return this._defaultData;
  }

  set defaultData(newValue: any) {
    this._defaultData = newValue;
  }

  // METHODS

  setName(newName: string): void {
    this.name = newName;
    (this._InputNameRef as PIXI.Text).text = newName;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

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
      defaultData: this._defaultData,
      data: this.data,
      visible: this.visible,
    };
  }

  // SETUP

  _onPointerOver(): void {
    // set overInputRef on graph
    this.getGraph().overInputRef = this;

    this.cursor = 'pointer';
    (this._InputSocketRef as PIXI.Graphics).tint = SOCKET_COLOR_TINT_HEX;
  }

  _onPointerOut(): void {
    // reset overInputRef on graph
    this.getGraph().overInputRef = null;

    this.alpha = 1.0;
    this.cursor = 'default';
    (this._InputSocketRef as PIXI.Graphics).tint = 0xffffff;
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    console.log('_onPointerDown');
    this.getGraph().clickedSocketRef = event.target.parent as InputSocket;
  }

  // _onPointerUpAndUpOutside(): void {
  //   console.log('_onPointerUpAndUpOutside');
  //   // this.isMovingLink = false;
  // }

  // _onInputClick(): void {
  //   // check if this input already has a connection and delete it
  //   this.getGraph().checkIfSocketHasConnectionAndDeleteIt(this, true);
  // }
}

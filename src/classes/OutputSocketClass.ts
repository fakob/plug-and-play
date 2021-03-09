import * as PIXI from 'pixi.js';
import { SerializedOutputSocket } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  SOCKET_COLOR_HEX,
  SOCKET_COLOR_TINT_HEX,
  NODE_OUTLINE_DISTANCE,
  NODE_WIDTH,
  OUTPUTSOCKET_TEXTSTYLE,
  OUTPUTSOCKET_WIDTH,
  OUTPUTSOCKET_CORNERRADIUS,
  OUTPUTSOCKET_TEXTMARGIN_RIGHT,
  OUTPUTSOCKET_TEXTMARGIN_TOP,
  TEXT_RESOLUTION,
  OUTPUTTYPE,
} from '../utils/constants';

export default class OutputSocket extends PIXI.Container {
  _OutputNameRef: PIXI.DisplayObject;
  _OutputSocketRef: PIXI.DisplayObject;

  data: any;
  type: string;
  linkDragPos: null | PIXI.Point;
  // data: PIXI.InteractionData | null;

  links: PPLink[];

  constructor(name = 'Number', type = OUTPUTTYPE.NUMBER.TYPE, visible = true) {
    super();
    this.name = name;
    this.type = type;
    this.visible = visible;
    this.linkDragPos = null;
    this.links = [];

    const socket = new PIXI.Graphics();
    socket.beginFill(SOCKET_COLOR_HEX);
    socket.drawRoundedRect(
      NODE_WIDTH,
      NODE_OUTLINE_DISTANCE + OUTPUTSOCKET_WIDTH / 2,
      OUTPUTSOCKET_WIDTH,
      OUTPUTSOCKET_WIDTH,
      OUTPUTSOCKET_CORNERRADIUS
    );
    socket.endFill();

    const outputNameText = new PIXI.Text(name, OUTPUTSOCKET_TEXTSTYLE);
    outputNameText.x =
      NODE_WIDTH -
      outputNameText.getBounds().width -
      OUTPUTSOCKET_TEXTMARGIN_RIGHT;
    outputNameText.y = NODE_OUTLINE_DISTANCE + OUTPUTSOCKET_TEXTMARGIN_TOP;
    outputNameText.resolution = TEXT_RESOLUTION;

    this._OutputSocketRef = this.addChild(socket);
    this._OutputNameRef = this.addChild(outputNameText);

    this.data = null;
    this.interactive = true;
    this._OutputSocketRef.interactive = true;
    this._OutputSocketRef.on('pointerover', this._onPointerOver.bind(this));
    this._OutputSocketRef.on('pointerout', this._onPointerOut.bind(this));
    this._OutputSocketRef.on('pointerdown', this._onPointerDown.bind(this));
    // this._OutputSocketRef.on('pointerup', this._onDragEnd.bind(this));
    // this._OutputSocketRef.on('pointermove', this._onDragMove.bind(this));
    // this._OutputSocketRef.on('click', this._onClick.bind(this));
  }

  // GETTERS & SETTERS

  get outputSocketRef(): PIXI.DisplayObject {
    return this._OutputSocketRef;
  }

  get outputNameRef(): PIXI.DisplayObject {
    return this._OutputNameRef;
  }

  get index(): number {
    return (this.parent as PPNode).outputSocketArray.findIndex((item) => {
      return this === item;
    });
  }

  // METHODS

  setName(newName: string): void {
    this.name = newName;
    (this._OutputNameRef as PIXI.Text).text = newName;
  }

  setVisible(value: boolean): void {
    this.visible = value;

    // visibility change can result in position change
    // therefore redraw Node and connected Links
    this.getNode().drawNodeShape();
    this.getNode().outputSocketArray.map((output) => {
      output.links.map((link) => {
        link.updateConnection();
      });
    });
  }

  removeLink(link: PPLink): void {
    this.links = this.links.filter((item) => item.id !== link.id);
  }

  getNode(): PPNode {
    return this.parent as PPNode;
  }

  getGraph(): PPGraph {
    return (this.parent as PPNode).graph;
  }

  serialize(): SerializedOutputSocket {
    //create serialization object
    return {
      name: this.name,
      type: this.type,
    };
  }

  // SETUP

  _onPointerOver(): void {
    this.cursor = 'pointer';
    (this._OutputSocketRef as PIXI.Graphics).tint = SOCKET_COLOR_TINT_HEX;
  }

  _onPointerOut(): void {
    this.alpha = 1.0;
    this.cursor = 'default';
    (this._OutputSocketRef as PIXI.Graphics).tint = 0xffffff;
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    console.log('_onPointerDown');
    this.getGraph().clickedSocketRef = event.target.parent as OutputSocket;
  }
}

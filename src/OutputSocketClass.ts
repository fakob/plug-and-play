import * as PIXI from 'pixi.js';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  COLOR_MAIN_HEX,
  NODE_OUTLINE_DISTANCE,
  NODE_WIDTH,
  OUTPUTSOCKET_TEXTSTYLE,
  OUTPUTSOCKET_WIDTH,
  OUTPUTSOCKET_CORNERRADIUS,
  OUTPUTSOCKET_TEXTMARGIN_RIGHT,
  OUTPUTSOCKET_TEXTMARGIN_TOP,
  TEXT_RESOLUTION,
} from './constants';

export default class OutputSocket extends PIXI.Container {
  _OutputNameRef: PIXI.DisplayObject;

  _OutputSocketRef: PIXI.DisplayObject;

  // data: PIXI.InteractionData | null;
  data: any;

  type: string;
  linkDragPos: null | PIXI.Point;

  links: PPLink[];

  constructor(name = 'Number', type = 'number') {
    super();
    this.name = name;
    this.type = type;
    this.linkDragPos = null;
    this.links = [];

    const socket = new PIXI.Graphics();
    socket.beginFill(COLOR_MAIN_HEX);
    socket.drawRoundedRect(
      NODE_OUTLINE_DISTANCE + NODE_WIDTH,
      NODE_OUTLINE_DISTANCE + OUTPUTSOCKET_WIDTH / 2,
      OUTPUTSOCKET_WIDTH,
      OUTPUTSOCKET_WIDTH,
      OUTPUTSOCKET_CORNERRADIUS
    );
    socket.endFill();

    const outputNameText = new PIXI.Text(name, OUTPUTSOCKET_TEXTSTYLE);
    outputNameText.x =
      NODE_OUTLINE_DISTANCE +
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
    this._OutputSocketRef.on('pointerover', this._onOutputOver.bind(this));
    this._OutputSocketRef.on('pointerout', this._onOutputOut.bind(this));
    this._OutputSocketRef.on('pointerdown', this._onOutputDown.bind(this));
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

  // METHODS

  removeLink(link: PPLink): void {
    this.links = this.links.filter((item) => item.id !== link.id);
  }

  getGraph(): PPGraph {
    return (this.parent as PPNode).graph;
  }

  // SETUP

  _onOutputOver(): void {
    this.cursor = 'pointer';
    (this._OutputSocketRef as PIXI.Graphics).tint = 0x00ff00;
  }

  _onOutputOut(): void {
    this.alpha = 1.0;
    this.cursor = 'default';
    (this._OutputSocketRef as PIXI.Graphics).tint = 0xffffff;
  }

  _onOutputDown(event: PIXI.InteractionEvent): void {
    console.log('_onOutputDown');
    const output = event.target.parent as OutputSocket;
    // set clickedOutputRef on graph
    output.getGraph().clickedOutputRef = event.target.parent as OutputSocket;
  }
}

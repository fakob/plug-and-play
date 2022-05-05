import * as PIXI from 'pixi.js';
import { TRgba } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  COLOR_WHITE_TEXT,
  NODE_MARGIN,
  SOCKET_TEXTMARGIN_TOP,
  SOCKET_TEXTMARGIN,
  UPDATEBEHAVIOURHEADER_TEXTSTYLE,
  SOCKET_TYPE,
  SOCKET_WIDTH,
  TEXT_RESOLUTION,
  COLOR_DARK,
} from '../utils/constants';

export interface IUpdateBehaviour {
  update: boolean;
  interval: boolean;
  intervalFrequency: number;
}

export default class UpdateBehaviourClass extends PIXI.Container {
  _UpdateBehaviourNameRef: PIXI.Text;
  _UpdateBehaviourRef: PIXI.Graphics;
  private _update: boolean;
  private _interval: boolean;
  private _intervalFrequency: number;
  private anchorX: number;
  private anchorY: number;

  constructor(
    inUpdate: boolean,
    inInterval: boolean,
    inIntervalFrequency: number
  ) {
    super();

    this._update = inUpdate;
    this._interval = inInterval;
    this._intervalFrequency = inIntervalFrequency;
    this.anchorX = NODE_MARGIN + 16;
    this.anchorY = -6;

    //   let defaultData;
    //   if (socketType === SOCKET_TYPE.IN) {
    //     // define defaultData for different types
    //     if (data === null && dataType) {
    //       data = dataType.getDefaultValue();
    //     }
    //   }

    //   this._socketType = socketType;
    //   this.name = name;
    //   this._dataType = dataType;
    //   this._data = data;
    //   this._defaultData = defaultData;
    //   this.visible = visible;
    //   this._custom = custom;
    //   this._links = [];

    const FrequencyText = new PIXI.Text(
      this._intervalFrequency.toString(),
      UPDATEBEHAVIOURHEADER_TEXTSTYLE
    );
    // FrequencyText.x = this.anchorX + 16;
    FrequencyText.y = this.anchorY - 5;
    FrequencyText.resolution = TEXT_RESOLUTION;

    this._UpdateBehaviourNameRef = this.addChild(FrequencyText);
    const updateHeader = new PIXI.Graphics();
    this._UpdateBehaviourRef = this.addChild(updateHeader);

    //   this.interactionData = null;
    //   this.interactive = true;
    //   this._UpdateBehaviourNameRef.interactive = true;
    //   this._UpdateBehaviourNameRef.on('pointerover', this._onPointerOver.bind(this));
    //   this._UpdateBehaviourNameRef.on('pointerout', this._onPointerOut.bind(this));
    //   this._UpdateBehaviourNameRef.on('pointerdown', (event) => {
    //     this.getGraph().socketNameRefMouseDown(this, event);
    //   });

    this.redrawAnythingChanging();
  }

  redrawAnythingChanging(): void {
    this.removeChild(this._UpdateBehaviourRef);
    // redraw update behaviour header
    this._UpdateBehaviourRef = new PIXI.Graphics();
    this._UpdateBehaviourNameRef.text = '';
    let newX = 0;
    if (this.update) {
      const whiteColor = TRgba.fromString(COLOR_DARK);
      this._UpdateBehaviourRef.beginFill(whiteColor.hexNumber(), whiteColor.a);
      this._UpdateBehaviourRef.drawCircle(this.anchorX, this.anchorY, 4);
      this._UpdateBehaviourRef.endFill();
      newX = 10;
    }
    if (this.interval) {
      const whiteColor = TRgba.fromString(COLOR_DARK);
      this._UpdateBehaviourRef.beginFill(whiteColor.hexNumber(), whiteColor.a);
      this._UpdateBehaviourRef.drawRect(
        newX + this.anchorX - 4,
        this.anchorY - 4,
        8,
        8
      );
      this._UpdateBehaviourRef.endFill();
      this._UpdateBehaviourNameRef.x = newX + this.anchorX + 6;
      this._UpdateBehaviourNameRef.text = this.intervalFrequency.toString();
    }
    this.addChild(this._UpdateBehaviourRef);

    // this._UpdateBehaviourRef.beginFill(this.dataType.getColor().hexNumber());
    // this._UpdateBehaviourRef.drawRoundedRect(
    //   this.socketType === SOCKET_TYPE.IN ? 0 : NODE_WIDTH,
    //   SOCKET_WIDTH / 2,
    //   SOCKET_WIDTH,
    //   SOCKET_WIDTH,
    //   SOCKET_CORNERRADIUS
    // );
    // this._UpdateBehaviourRef.endFill();
    // this._UpdateBehaviourRef.name = 'SocketRef';
    // this._UpdateBehaviourRef.interactive = true;
    // this._UpdateBehaviourRef.on('pointerover', this._onPointerOver.bind(this));
    // this._UpdateBehaviourRef.on('pointerout', this._onPointerOut.bind(this));
    // this._UpdateBehaviourRef.on('pointerdown', (event) => this._onPointerDown(event));
    // this._UpdateBehaviourRef.on('pointerup', (event) => this._onPointerUp(event));
  }

  setUpdateBehaviour(
    newUpdate: boolean,
    newInterval: boolean,
    newIntervalFrequency: number
  ): void {
    this._update = newUpdate;
    this._interval = newInterval;
    this._intervalFrequency = newIntervalFrequency;
    this.redrawAnythingChanging();
  }

  // GETTERS & SETTERS

  get update(): boolean {
    return this._update;
  }

  set update(newInterval: boolean) {
    this._update = newInterval;
    this.redrawAnythingChanging();
  }

  get interval(): boolean {
    return this._interval;
  }

  set interval(newInterval: boolean) {
    this._interval = newInterval;
    this.redrawAnythingChanging();
  }

  get intervalFrequency(): number {
    return this._intervalFrequency;
  }

  set intervalFrequency(frequency: number) {
    console.log(frequency);
    this._intervalFrequency = frequency;
    this.redrawAnythingChanging();
  }

  // // METHODS

  // isInput(): boolean {
  //   return this.socketType === SOCKET_TYPE.IN;
  // }

  // hasLink(): boolean {
  //   return this.links.length > 0;
  // }

  // setName(newName: string): void {
  //   this.name = newName;
  //   (this._UpdateBehaviourNameRef as PIXI.Text).text = newName;
  // }

  // setVisible(value: boolean): void {
  //   this.visible = value;

  //   // visibility change can result in position change
  //   // therefore redraw Node and connected Links
  //   this.getNode().drawNodeShape();
  //   this.getNode().updateConnectionPosition();
  // }

  // getNode(): PPNode {
  //   return this.parent as PPNode;
  // }

  // getGraph(): PPGraph {
  //   return (this.parent as PPNode).graph;
  // }

  // // SETUP

  // _onPointerOver(): void {
  //   this.cursor = 'pointer';
  //   (this._SocketRef as PIXI.Graphics).tint = TRgba.white().hexNumber();
  //   this.getGraph().socketHoverOver(this);
  // }

  // _onPointerOut(): void {
  //   this.alpha = 1.0;
  //   this.cursor = 'default';
  //   (this._SocketRef as PIXI.Graphics).tint = 0xffffff;
  //   this.getGraph().socketHoverOut(this);
  // }

  // _onPointerDown(event: PIXI.InteractionEvent): void {
  //   this.getGraph().socketMouseDown(this, event);
  // }
  // _onPointerUp(event: PIXI.InteractionEvent): void {
  //   this.getGraph().socketMouseUp(this, event);
  // }
}

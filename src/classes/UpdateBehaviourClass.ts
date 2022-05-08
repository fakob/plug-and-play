import * as PIXI from 'pixi.js';
import { TRgba } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  COLOR_WHITE,
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
  private _hover: boolean;

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

    this._UpdateBehaviourRef.interactive = true;
    this._UpdateBehaviourRef.on('pointerover', this._onPointerOver.bind(this));
    this._UpdateBehaviourRef.on('pointerout', this._onPointerOut.bind(this));
    this._UpdateBehaviourRef.on('pointerdown', this._onPointerDown.bind(this));

    this.redrawAnythingChanging();
  }

  redrawAnythingChanging(): void {
    this.removeChild(this._UpdateBehaviourRef);
    // redraw update behaviour header
    this._UpdateBehaviourRef = new PIXI.Graphics();
    this._UpdateBehaviourNameRef.text = '';
    let newX = 10;
    // if (this.update) {
    const color = TRgba.fromString(COLOR_DARK);
    this._UpdateBehaviourRef.beginFill(
      color.hexNumber(),
      this.hover || !this.update ? color.a : 0.001
    );
    this._UpdateBehaviourRef.drawCircle(this.anchorX, this.anchorY, 4);
    this._UpdateBehaviourRef.endFill();
    newX = 10;
    // }
    if (this.interval) {
      // const color = TRgba.fromString(COLOR_DARK);
      // this._UpdateBehaviourRef.beginFill(color.hexNumber(), color.a);
      // this._UpdateBehaviourRef.drawRect(
      //   newX + this.anchorX - 4,
      //   this.anchorY - 4,
      //   8,
      //   8
      // );
      // this._UpdateBehaviourRef.endFill();
      this._UpdateBehaviourNameRef.x = newX + this.anchorX - 4;
      this._UpdateBehaviourNameRef.text = this.intervalFrequency.toString();
    }
    this.addChild(this._UpdateBehaviourRef);

    this._UpdateBehaviourRef.interactive = true;
    this._UpdateBehaviourRef.on('pointerover', this._onPointerOver.bind(this));
    this._UpdateBehaviourRef.on('pointerout', this._onPointerOut.bind(this));
    this._UpdateBehaviourRef.on('pointerdown', this._onPointerDown.bind(this));
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

  get hover(): boolean {
    return this._hover;
  }

  set hover(isHovering: boolean) {
    this._hover = isHovering;
    this.redrawAnythingChanging();
  }

  // METHODS

  getNode(): PPNode {
    return this.parent as PPNode;
  }

  getGraph(): PPGraph {
    return (this.parent as PPNode).graph;
  }

  // SETUP

  _onPointerOver(): void {
    console.log('_onPointerOver');
    this.cursor = 'pointer';
  }

  _onPointerOut(): void {
    console.log('_onPointerOut');
    this.alpha = 1.0;
    this.cursor = 'default';
  }

  _onPointerDown(): void {
    console.log('_onPointerDown');
    this.getNode().executeOptimizedChain();
  }
}

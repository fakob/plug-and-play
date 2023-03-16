import * as PIXI from 'pixi.js';
import Color from 'color';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import {
  RANDOMMAINCOLOR,
  TEXT_RESOLUTION,
  UPDATEBEHAVIOURHEADER_TEXTSTYLE,
  UPDATEBEHAVIOURHEADER_NOUPDATE,
  UPDATEBEHAVIOURHEADER_UPDATE,
} from '../utils/constants';

export interface IUpdateBehaviour {
  update: boolean;
  interval: boolean;
  intervalFrequency: number;
}

export default class UpdateBehaviourClass extends PIXI.Container {
  _frequencyRef: PIXI.Text;
  _updateRef: PIXI.Sprite;
  _noUpdateRef: PIXI.Sprite;
  private _update: boolean;
  private _interval: boolean;
  private _intervalFrequency: number;
  private _hoverNode: boolean;
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

    const FrequencyText = new PIXI.Text(
      this._intervalFrequency.toString(),
      UPDATEBEHAVIOURHEADER_TEXTSTYLE
    );
    FrequencyText.x = 26;
    FrequencyText.y = 6;
    FrequencyText.resolution = TEXT_RESOLUTION;
    FrequencyText.alpha = 0.5;

    this._frequencyRef = this.addChild(FrequencyText);
    this._frequencyRef.tint = PIXI.utils.string2hex(
      Color(RANDOMMAINCOLOR).darken(0.7).hex()
    );

    this._updateRef = this.addChild(
      PIXI.Sprite.from(UPDATEBEHAVIOURHEADER_UPDATE)
    );
    this._updateRef.tint = PIXI.utils.string2hex(
      Color(RANDOMMAINCOLOR).darken(0.7).hex()
    );

    this._noUpdateRef = this.addChild(
      PIXI.Sprite.from(UPDATEBEHAVIOURHEADER_NOUPDATE)
    );
    this._noUpdateRef.visible = false;
    this._noUpdateRef.tint = PIXI.utils.string2hex(
      Color(RANDOMMAINCOLOR).darken(0.7).hex()
    );

    this.addChild(this._updateRef);
    this.addChild(this._noUpdateRef);

    this._updateRef.eventMode = 'static';
    this._updateRef.cursor = 'pointer';
    this._updateRef.alpha = 0.05;
    this._updateRef.x = 0;
    this._updateRef.width = 24;
    this._updateRef.height = 24;

    this._updateRef.addEventListener(
      'pointerover',
      this._onPointerOver.bind(this)
    );
    this._updateRef.addEventListener(
      'pointerout',
      this._onPointerOut.bind(this)
    );
    this._updateRef.addEventListener(
      'pointerdown',
      this._onPointerDown.bind(this)
    );

    this._noUpdateRef.width = 24;
    this._noUpdateRef.height = 24;

    this.redrawAnythingChanging();
  }

  redrawAnythingChanging(): void {
    // reset
    this._updateRef.alpha = 0.05;
    this._noUpdateRef.visible = false;
    this._frequencyRef.text = '';

    // update and noupdate
    if (this.hover) {
      this._updateRef.alpha = 1.0;
    } else if (this.getNode()?.isHovering) {
      this._updateRef.alpha = 0.5;
    } else if (!this.update) {
      this._noUpdateRef.visible = true;
    }

    // frequency text
    if (this.interval) {
      this._frequencyRef.text = this.intervalFrequency.toString();
    }
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
    return PPGraph.currentGraph;
  }

  // SETUP

  _onPointerOver(): void {
    this.hover = true;
  }

  _onPointerOut(): void {
    this.cursor = 'default';
    this.hover = false;
  }

  _onPointerDown(): void {
    this.getNode().executeOptimizedChain();
  }
}

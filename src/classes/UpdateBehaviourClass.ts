import * as PIXI from 'pixi.js';
import { TRgba } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import {
  COLOR_DARK,
  NODE_MARGIN,
  TEXT_RESOLUTION,
  UPDATEBEHAVIOURHEADER_TEXTSTYLE,
} from '../utils/constants';

export interface IUpdateBehaviour {
  update: boolean;
  interval: boolean;
  intervalFrequency: number;
}

export default class UpdateBehaviourClass extends PIXI.Container {
  _frequencyRef: PIXI.Text;
  _updateRef: PIXI.Graphics;
  _noUpdateRef: PIXI.Graphics;
  private _update: boolean;
  private _interval: boolean;
  private _intervalFrequency: number;
  private anchorX: number;
  private anchorY: number;
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
    this.anchorX = NODE_MARGIN + 16;
    this.anchorY = -6;

    const FrequencyText = new PIXI.Text(
      this._intervalFrequency.toString(),
      UPDATEBEHAVIOURHEADER_TEXTSTYLE
    );
    FrequencyText.x = this.anchorX - 4;
    FrequencyText.y = this.anchorY - 5;
    FrequencyText.resolution = TEXT_RESOLUTION;
    FrequencyText.alpha = 0.5;

    this._frequencyRef = this.addChild(FrequencyText);
    this._updateRef = this.addChild(new PIXI.Graphics());
    this._noUpdateRef = this.addChild(new PIXI.Graphics());

    this.addChild(this._updateRef);
    this.addChild(this._noUpdateRef);

    this._updateRef.interactive = true;
    this._updateRef.buttonMode = true;
    this._updateRef.on('pointerover', this._onPointerOver.bind(this));
    this._updateRef.on('pointerout', this._onPointerOut.bind(this));
    this._updateRef.on('pointerdown', this._onPointerDown.bind(this));

    this.redrawAnythingChanging();
  }

  redrawAnythingChanging(): void {
    // reset
    this._updateRef.clear();
    this._noUpdateRef.clear();
    this._frequencyRef.text = '';

    // update now button
    let offsetX = 0;
    const color = TRgba.fromString(COLOR_DARK);
    this._updateRef.beginFill(color.hexNumber(), 0.01);
    this._updateRef.drawCircle(this.anchorX, this.anchorY, 6);
    this._updateRef.endFill();
    this._updateRef.beginFill(color.hexNumber(), color.a);
    if (this.hover) {
      this._updateRef.lineStyle(2, color.hexNumber(), 0.5, 1);
      this._updateRef.drawCircle(this.anchorX, this.anchorY, 4);
    } else if (this.hoverNode) {
      this._updateRef.lineStyle(1, color.hexNumber(), 0.1, 1);
      this._updateRef.drawCircle(this.anchorX, this.anchorY, 4);
    }
    this._updateRef.lineStyle(0);
    this._updateRef.endFill();

    // no update shape
    offsetX += 12;
    if (!this.update) {
      this._noUpdateRef.beginFill(color.hexNumber(), 0.5);
      this._noUpdateRef.drawRect(
        offsetX + this.anchorX - 4,
        this.anchorY - 4,
        8,
        8
      );
      this._noUpdateRef.endFill();
    }

    // frequency text
    offsetX += 10;
    if (this.interval) {
      this._frequencyRef.x = offsetX + this.anchorX - 4;
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

  get hoverNode(): boolean {
    return this._hoverNode;
  }

  set hoverNode(isHovering: boolean) {
    this._hoverNode = isHovering;
    this.redrawAnythingChanging();
  }

  // METHODS

  getNode(): PPNode {
    return this.parent as PPNode;
  }

  getGraph(): PPGraph {
    return (this.parent as PPNode)?.graph;
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

import * as PIXI from 'pixi.js';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import {
  RANDOMMAINCOLORLIGHTHEX2,
  NODE_TEXTSTYLE,
  PINNED,
} from '../utils/constants';
import { screenSpaceGridToPx } from '../utils/utils';

export interface IUpdateBehaviour {
  update: boolean;
  interval: boolean;
  intervalFrequency: number;
}

export default class PinnedClass extends PIXI.Container {
  node: PPNode;
  _nameRef: PIXI.Text;
  _pinRef: PIXI.Sprite;
  _noUpdateRef: PIXI.Sprite;
  private _hover: boolean;

  constructor(node: PPNode) {
    super();

    this.node = node;

    this._pinRef = this.addChild(PIXI.Sprite.from(PINNED));
    // this._pinRef.tint = PIXI.utils.string2hex(
    //   Color(RANDOMMAINCOLOR).darken(0.7).hex()
    // );

    const graphics = new PIXI.Graphics();
    graphics.clear();
    graphics.beginFill(RANDOMMAINCOLORLIGHTHEX2, 1);
    const screenSpaceGridInPx = screenSpaceGridToPx(node.screenSpaceSettings);
    graphics.drawRoundedRect(
      0,
      0,
      screenSpaceGridInPx.width,
      screenSpaceGridInPx.height,
      0
    );
    graphics.endFill();

    this.addChild(graphics);
    this.addChild(this._pinRef);

    const inputNameText = new PIXI.Text(
      node.getNodeTextString(),
      NODE_TEXTSTYLE
    );
    this._nameRef = this.addChild(inputNameText);

    this.eventMode = 'static';
    this._pinRef.eventMode = 'static';
    this._pinRef.cursor = 'pointer';
    // this._pinRef.alpha = 0.05;
    this._pinRef.x = this.width - 16;
    this._pinRef.width = 16;
    this._pinRef.height = 16;

    this.addEventListener('pointerover', this.onPointerOver.bind(this));
    this.addEventListener('pointerout', this.onPointerOut.bind(this));
    this._pinRef.addEventListener('pointerdown', this.onPointerDown.bind(this));

    this.redrawAnythingChanging();
  }

  redrawAnythingChanging(): void {
    // reset
    this._pinRef.alpha = 0.05;
    // this._nameRef.text = '';

    // update and noupdate
    if (this.hover) {
      this._pinRef.alpha = 1.0;
    } else if (this.node?.isHovering) {
      this._pinRef.alpha = 0.5;
    }

    // // frequency text
    // if (this.interval) {
    //   this._nameRef.text = this.intervalFrequency.toString();
    // }
  }

  // setUpdateBehaviour(
  //   newUpdate: boolean,
  //   newInterval: boolean,
  //   newIntervalFrequency: number
  // ): void {
  //   this._update = newUpdate;
  //   this._interval = newInterval;
  //   this._intervalFrequency = newIntervalFrequency;
  //   this.redrawAnythingChanging();
  // }

  // GETTERS & SETTERS

  get hover(): boolean {
    return this._hover;
  }

  set hover(isHovering: boolean) {
    this._hover = isHovering;
    this.redrawAnythingChanging();
  }

  // METHODS

  getGraph(): PPGraph {
    return PPGraph.currentGraph;
  }

  // SETUP

  onPointerOver(): void {
    this.hover = true;
  }

  onPointerOut(): void {
    this.cursor = 'default';
    this.hover = false;
  }

  onPointerDown(): void {
    this.node.pinned = false;
  }
}

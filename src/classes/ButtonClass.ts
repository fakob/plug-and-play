import * as PIXI from 'pixi.js';
import Color from 'color';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import { RANDOMMAINCOLOR } from '../utils/constants';

export default class Button extends PIXI.Sprite {
  graph: PPGraph;
  node: PPNode;
  up: boolean;
  down: boolean;

  constructor(imageURL: string) {
    super(PIXI.Texture.from(imageURL));

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.alpha = 0.5;
    this.width = 24;
    this.height = 24;
    this.tint = new PIXI.Color(
      Color(RANDOMMAINCOLOR).darken(0.7).hex()
    ).toNumber();
    this.addEventListener('pointerover', this.onPointerOver.bind(this));
    this.addEventListener('pointerout', this.onPointerOut.bind(this));
  }

  // SETUP

  onPointerOver(): void {
    this.alpha = 1.0;
    this.cursor = 'pointer';
  }

  onPointerOut(): void {
    this.alpha = 0.5;
    this.cursor = 'default';
  }
}

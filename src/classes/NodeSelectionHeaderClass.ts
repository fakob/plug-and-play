import * as PIXI from 'pixi.js';
import { TRgba } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import { COLOR_DARK, NODE_MARGIN } from '../utils/constants';

export default class NodeSelectionHeaderClass extends PIXI.Container {
  _selectBranch: PIXI.Graphics;
  private anchorX: number;
  private anchorY: number;
  private _hoverNode: boolean;
  private _hover: boolean;

  constructor() {
    super();

    // this.anchorX = NODE_MARGIN + (this.parent as PPNode)?.nodeWidth - 16;
    this.anchorX = NODE_MARGIN + 100 - 16;
    this.anchorY = -10;

    this._selectBranch = this.addChild(new PIXI.Graphics());

    this.addChild(this._selectBranch);

    this._selectBranch.interactive = true;
    this._selectBranch.buttonMode = true;
    this._selectBranch.on('pointerover', this._onPointerOver.bind(this));
    this._selectBranch.on('pointerout', this._onPointerOut.bind(this));
    this._selectBranch.on('pointerdown', this._onPointerDown.bind(this));

    this.redrawAnythingChanging();
  }

  redrawAnythingChanging(): void {
    // reset
    this._selectBranch.clear();

    // update now button
    const color = TRgba.fromString(COLOR_DARK);
    this._selectBranch.beginFill(color.hexNumber(), 0.01);
    this._selectBranch.drawRoundedRect(this.anchorX, this.anchorY, 10, 10, 2);
    this._selectBranch.endFill();
    this._selectBranch.beginFill(color.hexNumber(), color.a);
    if (this.hover) {
      this._selectBranch.lineStyle(2, color.hexNumber(), 0.5, 1);
      this._selectBranch.drawRoundedRect(this.anchorX, this.anchorY, 8, 8, 2);
    } else if (this.hoverNode) {
      this._selectBranch.lineStyle(1, color.hexNumber(), 0.1, 1);
      this._selectBranch.drawRoundedRect(this.anchorX, this.anchorY, 8, 8, 2);
    }
    this._selectBranch.lineStyle(0);
    this._selectBranch.endFill();
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
    this.getGraph().selection.selectNodes(
      Object.values(this.getNode().getAllUpDownstreamNodes(true, true))
    );
  }
}

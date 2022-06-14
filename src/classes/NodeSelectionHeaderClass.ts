import * as PIXI from 'pixi.js';
import { TRgba } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import { COLOR_DARK, NODE_MARGIN } from '../utils/constants';

export default class NodeSelectionHeaderClass extends PIXI.Container {
  _selectDownstreamBranch: PIXI.Graphics;
  _selectUpstreamBranch: PIXI.Graphics;
  _selectWholeBranch: PIXI.Graphics;
  private anchorX: number;
  private anchorY: number;
  private _hoverNode: boolean;
  private _hover: boolean;

  constructor() {
    super();

    // this.anchorX = NODE_MARGIN + (this.parent as PPNode)?.nodeWidth - 16;
    this.anchorX = NODE_MARGIN + 100 - 16;
    this.anchorY = -10;

    this._selectDownstreamBranch = this.addChild(new PIXI.Graphics());
    this._selectUpstreamBranch = this.addChild(new PIXI.Graphics());
    this._selectWholeBranch = this.addChild(new PIXI.Graphics());

    this.addChild(this._selectDownstreamBranch);
    this.addChild(this._selectUpstreamBranch);
    this.addChild(this._selectWholeBranch);

    this._selectDownstreamBranch.interactive = true;
    this._selectDownstreamBranch.buttonMode = true;
    this._selectDownstreamBranch.on(
      'pointerover',
      this._onPointerOver.bind(this)
    );
    this._selectDownstreamBranch.on(
      'pointerout',
      this._onPointerOut.bind(this)
    );
    this._selectDownstreamBranch.on(
      'pointerdown',
      this._onPointerDownDownstream.bind(this)
    );

    this._selectUpstreamBranch.interactive = true;
    this._selectUpstreamBranch.buttonMode = true;
    this._selectUpstreamBranch.on(
      'pointerover',
      this._onPointerOver.bind(this)
    );
    this._selectUpstreamBranch.on('pointerout', this._onPointerOut.bind(this));
    this._selectUpstreamBranch.on(
      'pointerdown',
      this._onPointerDownUpstream.bind(this)
    );

    this._selectWholeBranch.interactive = true;
    this._selectWholeBranch.buttonMode = true;
    this._selectWholeBranch.on('pointerover', this._onPointerOver.bind(this));
    this._selectWholeBranch.on('pointerout', this._onPointerOut.bind(this));
    this._selectWholeBranch.on(
      'pointerdown',
      this._onPointerDownWhole.bind(this)
    );

    this.redrawAnythingChanging();
  }

  redrawOne(button: PIXI.Graphics, offsetX: number): void {
    // reset
    button.clear();

    // update now button
    const color = TRgba.fromString(COLOR_DARK);
    button.beginFill(color.hexNumber(), 0.01);
    button.drawRoundedRect(this.anchorX + offsetX, this.anchorY, 10, 10, 2);
    button.endFill();
    button.beginFill(color.hexNumber(), color.a);
    if (this.hover) {
      button.lineStyle(2, color.hexNumber(), 0.5, 1);
      button.drawRoundedRect(this.anchorX + offsetX, this.anchorY, 8, 8, 2);
    } else if (this.hoverNode) {
      button.lineStyle(1, color.hexNumber(), 0.1, 1);
      button.drawRoundedRect(this.anchorX + offsetX, this.anchorY, 8, 8, 2);
    }
    button.lineStyle(0);
    button.endFill();
  }

  redrawAnythingChanging(): void {
    // reset
    this.redrawOne(this._selectUpstreamBranch, 0);
    this.redrawOne(this._selectWholeBranch, 16);
    this.redrawOne(this._selectDownstreamBranch, 32);
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

  _onPointerDownDownstream(): void {
    this.getGraph().selection.selectNodes(
      Object.values(this.getNode().getAllUpDownstreamNodes(false, true))
    );
  }

  _onPointerDownUpstream(): void {
    this.getGraph().selection.selectNodes(
      Object.values(this.getNode().getAllUpDownstreamNodes(true, false))
    );
  }

  _onPointerDownWhole(): void {
    this.getGraph().selection.selectNodes(
      Object.values(this.getNode().getAllUpDownstreamNodes(true, true))
    );
  }
}

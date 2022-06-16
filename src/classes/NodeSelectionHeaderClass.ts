import * as PIXI from 'pixi.js';
import { TRgba } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import {
  NODE_MARGIN,
  SELECTION_DOWNSTREAM_TEXTURE,
  SELECTION_UPSTREAM_TEXTURE,
  SELECTION_WHOLE_TEXTURE,
} from '../utils/constants';

export default class NodeSelectionHeaderClass extends PIXI.Container {
  _selectDownstreamBranch: PIXI.Sprite;
  _selectUpstreamBranch: PIXI.Sprite;
  _selectWholeBranch: PIXI.Sprite;
  private anchorX: number;
  private anchorY: number;
  private _hoverNode: boolean;
  private _hover: boolean;

  constructor() {
    super();

    // this.anchorX = NODE_MARGIN + (this.parent as PPNode)?.nodeWidth - 16;
    this.anchorX = NODE_MARGIN + 100 - 16;
    this.anchorY = -20;

    this._selectDownstreamBranch = PIXI.Sprite.from(
      SELECTION_DOWNSTREAM_TEXTURE
    );
    this._selectUpstreamBranch = PIXI.Sprite.from(SELECTION_UPSTREAM_TEXTURE);
    this._selectWholeBranch = PIXI.Sprite.from(SELECTION_WHOLE_TEXTURE);

    this.addChild(this._selectDownstreamBranch);
    this.addChild(this._selectUpstreamBranch);
    this.addChild(this._selectWholeBranch);

    this.configure(this._selectUpstreamBranch, 0, true, false);
    this.configure(this._selectWholeBranch, 20, true, true);
    this.configure(this._selectDownstreamBranch, 40, false, true);

    this.redrawAnythingChanging();
  }

  configure(
    button: PIXI.Sprite,
    offsetX: number,
    up: boolean,
    down: boolean
  ): void {
    button.interactive = true;
    button.buttonMode = true;
    button.width = 16;
    button.height = 16;
    button.x = this.anchorX + offsetX;
    button.y = this.anchorY;
    button.on('pointerover', this._onPointerOver.bind(this, up, down));
    button.on('pointerout', this._onPointerOut.bind(this));
    button.on('pointerdown', this._onPointerDown.bind(this, up, down));
  }

  redrawOne(button: PIXI.Sprite): void {
    // reset
    // button.visible = false;
    button.alpha = 0.01;

    // update now button
    if (this.hover) {
      // button.visible = true;
      button.alpha = 1;
    } else if (this.hoverNode) {
      // button.visible = true;
      button.alpha = 0.5;
    }
  }

  redrawAnythingChanging(): void {
    // reset
    this.redrawOne(this._selectUpstreamBranch);
    this.redrawOne(this._selectWholeBranch);
    this.redrawOne(this._selectDownstreamBranch);
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

  _onPointerDown(up: boolean, down: boolean): void {
    this.getGraph().selection.selectNodes(
      Object.values(this.getNode().getAllUpDownstreamNodes(up, down))
    );
  }
}

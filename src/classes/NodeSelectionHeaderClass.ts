import * as PIXI from 'pixi.js';
import Color from 'color';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import {
  RANDOMMAINCOLOR,
  SELECTION_DOWNSTREAM_TEXTURE,
  SELECTION_UPSTREAM_TEXTURE,
  SELECTION_WHOLE_TEXTURE,
} from '../utils/constants';

class Button extends PIXI.Sprite {
  graph: PPGraph;
  node: PPNode;
  up: boolean;
  down: boolean;

  constructor(up: boolean, down: boolean, imageURL: string) {
    super(PIXI.Texture.from(imageURL));

    this.up = up;
    this.down = down;
    this.interactive = true;
    this.buttonMode = true;
    this.alpha = 0.5;
    this.width = 24;
    this.height = 24;
    this.tint = PIXI.utils.string2hex(Color(RANDOMMAINCOLOR).darken(0.7).hex());
    this.on('pointerover', this._onPointerOver.bind(this));
    this.on('pointerout', this._onPointerOut.bind(this));
    this.on('pointerdown', this._onPointerDown.bind(this));
  }

  // SETUP

  _onPointerOver(): void {
    this.alpha = 1.0;
    this.cursor = 'pointer';
  }

  _onPointerOut(): void {
    this.alpha = 0.5;
    this.cursor = 'default';
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    const altKey = event.data.originalEvent.altKey;
    const node = this.parent?.parent as PPNode;
    const graph = PPGraph.currentGraph;
    graph.selection.selectNodes(
      Object.values(node.getAllUpDownstreamNodes(this.up, this.down, altKey))
    );
  }
}

export default class NodeSelectionHeaderClass extends PIXI.Container {
  _selectDownstreamBranch: Button;
  _selectUpstreamBranch: Button;
  _selectWholeBranch: Button;
  private _hoverNode: boolean;

  constructor() {
    super();

    this._selectUpstreamBranch = new Button(
      true,
      false,
      SELECTION_UPSTREAM_TEXTURE
    );
    this._selectWholeBranch = new Button(true, true, SELECTION_WHOLE_TEXTURE);
    this._selectDownstreamBranch = new Button(
      false,
      true,
      SELECTION_DOWNSTREAM_TEXTURE
    );

    this.addChild(this._selectDownstreamBranch);
    this.addChild(this._selectUpstreamBranch);
    this.addChild(this._selectWholeBranch);

    this._selectUpstreamBranch.x = 0;
    this._selectWholeBranch.x = 24;
    this._selectDownstreamBranch.x = 48;

    this.redrawAnythingChanging();
  }

  redrawAnythingChanging(): void {
    this.alpha = 0.01;
    if (this.hoverNode) {
      this.alpha = 1.0;
    }
  }

  get hoverNode(): boolean {
    return this._hoverNode;
  }

  set hoverNode(isHovering: boolean) {
    this._hoverNode = isHovering;
    this.redrawAnythingChanging();
  }
}

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
import FlowLogic from './FlowLogic';

class Button extends PIXI.Sprite {
  graph: PPGraph;
  node: PPNode;
  up: boolean;
  down: boolean;

  constructor(up: boolean, down: boolean, imageURL: string) {
    super(PIXI.Texture.from(imageURL));

    this.up = up;
    this.down = down;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.alpha = 0.5;
    this.width = 24;
    this.height = 24;
    this.tint = PIXI.utils.string2hex(Color(RANDOMMAINCOLOR).darken(0.7).hex());
    this.addEventListener('pointerover', this._onPointerOver.bind(this));
    this.addEventListener('pointerout', this._onPointerOut.bind(this));
    this.addEventListener('pointerdown', this._onPointerDown.bind(this));
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

  _onPointerDown(event: PIXI.FederatedPointerEvent): void {
    const altKey = event.altKey;
    const node = this.parent?.parent as PPNode;
    const graph = PPGraph.currentGraph;
    graph.selection.selectNodes(
      Object.values(
        FlowLogic.getAllUpDownstreamNodes(node, this.up, this.down, altKey)
      )
    );
  }
}

export default class NodeSelectionHeaderClass extends PIXI.Container {
  _selectDownstreamBranch: Button;
  _selectUpstreamBranch: Button;
  _selectWholeBranch: Button;

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

  public redrawAnythingChanging(hoverNode = false): void {
    this.alpha = 0.01;
    if (hoverNode) {
      this.alpha = 1.0;
    }
  }
}

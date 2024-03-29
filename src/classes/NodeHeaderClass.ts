import * as PIXI from 'pixi.js';
import PPGraph from './GraphClass';
import Button from './ButtonClass';
import PPNode from './NodeClass';
import InterfaceController from '../InterfaceController';
import {
  EDIT_ICON,
  SELECTION_DOWNSTREAM_TEXTURE,
  SELECTION_UPSTREAM_TEXTURE,
  SELECTION_WHOLE_TEXTURE,
} from '../utils/constants';
import FlowLogic from './FlowLogic';

export default class NodeHeaderClass extends PIXI.Container {
  _selectDownstreamBranch: Button;
  _selectUpstreamBranch: Button;
  _selectWholeBranch: Button;
  _editNode: Button;

  constructor() {
    super();

    this._selectUpstreamBranch = new Button(SELECTION_UPSTREAM_TEXTURE);
    this._selectUpstreamBranch.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, true, false),
    );
    this._selectWholeBranch = new Button(SELECTION_WHOLE_TEXTURE);
    this._selectWholeBranch.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, true, true),
    );
    this._selectDownstreamBranch = new Button(SELECTION_DOWNSTREAM_TEXTURE);
    this._selectDownstreamBranch.addEventListener('pointerdown', (e) =>
      this.onPointerDown(e, false, true),
    );
    this._editNode = new Button(EDIT_ICON);
    this._editNode.addEventListener(
      'pointerdown',
      this.editNodeMouseDown.bind(this),
    );

    this.addChild(this._selectUpstreamBranch);
    this.addChild(this._selectWholeBranch);
    this.addChild(this._selectDownstreamBranch);
    this.addChild(this._editNode);

    this._selectUpstreamBranch.x = 0;
    this._selectWholeBranch.x = 24;
    this._selectDownstreamBranch.x = 48;
    this._editNode.x = 72;

    this.redrawAnythingChanging();
  }

  public redrawAnythingChanging(hoverNode = false): void {
    this.alpha = 0.01;
    if (hoverNode) {
      this.alpha = 1.0;
    }
  }

  onPointerDown(
    event: PIXI.FederatedPointerEvent,
    up: boolean,
    down: boolean,
  ): void {
    const altKey = event.altKey;
    const node = this.parent?.parent as PPNode;
    const graph = PPGraph.currentGraph;
    console.log(this, node, up, down);
    graph.selection.selectNodes(
      Object.values(FlowLogic.getAllUpDownstreamNodes(node, up, down, altKey)),
    );
  }

  editNodeMouseDown(): void {
    const node = this.parent?.parent as PPNode;
    PPGraph.currentGraph.socketToInspect = null;

    if (node.selected) {
      InterfaceController.toggleRightSideDrawer();
    } else {
      PPGraph.currentGraph.selection.selectNodes([node], false, true);
      InterfaceController.toggleRightSideDrawer(true);
    }
  }
}

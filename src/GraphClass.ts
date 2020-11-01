import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
// import PPLink from './LinkClass';
import PPNode from './NodeClass';

export default class PPGraph {
  app: PIXI.Application;
  viewport: Viewport;

  last_node_id: number;

  last_link_id: number;

  _nodes: PPNode[];

  selected_nodes: number[];

  // links: PPLink;

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    console.log('Graph created');

    // clear the stage
    this.clear();
  }

  onNodeDragStart(event: PIXI.InteractionEvent, node: PPNode): void {
    this.viewport.plugins.pause('drag');
    this.selectNode(node);
    // if (this._selected) {
    //   this.select(false);
    // } else {
    // this.select(true);
    // }
  }

  onNodeDragEnd(): void {
    this.viewport.plugins.resume('drag');
  }

  // selectNode(node, add_to_current_selection) {
  //   if (node == null) {
  //     this.deselectAllNodes();
  //   } else {
  //     this.selectNodes([node], add_to_current_selection);
  //   }
  // }

  add(node: PPNode): PPNode {
    if (!node) {
      return;
    }

    node
      .on('pointerdown', (e: PIXI.InteractionEvent) =>
        this.onNodeDragStart(e, node)
      )
      .on('pointerup', this.onNodeDragEnd);

    this.viewport.addChild(node);

    this._nodes.push(node);

    return node; //to chain actions
  }

  clear(): void {
    this.last_node_id = 0;
    this.last_link_id = 0;

    //nodes
    this._nodes = [];

    //links
    // this.links = {}; //container with all the links

    this.viewport.removeChildren();
    const texture = PIXI.Texture.from('assets/old_mathematics_@2X.png');

    const tilingSprite = new PIXI.TilingSprite(
      texture,
      this.app.screen.width,
      this.app.screen.height
    );
    this.viewport.addChild(tilingSprite);
  }

  selectNode(node: PPNode): void {
    if (node === null) {
      this.deselectAllNodes();
    } else {
      this.deselectAllNodes();
      node.select(true);
      this.selected_nodes = [node.id];
    }
  }

  deselectAllNodes(): void {
    const nodes = this._nodes;
    for (let i = 0, l = nodes.length; i < l; ++i) {
      const node = nodes[i];
      if (node.selected) {
        node.select(false);
      }
    }
    this.selected_nodes = [];
  }
}

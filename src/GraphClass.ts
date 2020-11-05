import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import PPLink from './LinkClass';
import PPNode from './NodeClass';

export default class PPGraph {
  app: PIXI.Application;
  viewport: Viewport;

  last_node_id: number;

  last_link_id: number;

  _nodes: PPNode[];
  _connections: PPLink[];

  selected_nodes: number[];

  _dragLink: boolean;

  linkGraphics: PIXI.Graphics;

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    console.log('Graph created');

    // clear the stage
    this.clear();
    this._dragLink = false;

    // const linkGraphics = new PIXI.Graphics();
    this.linkGraphics = new PIXI.Graphics();
    this.viewport.addChild(this.linkGraphics);

    this.viewport.on('pointerdown', this._onPointerDown.bind(this));
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    this.deselectAllNodes();
    console.log(this.dragLink);
  }

  onNodeDragStart(event: PIXI.InteractionEvent, node: PPNode): void {
    event.stopPropagation();
    console.log(node);
    if (node.clickedSlotRef === null) {
      // clicked on the node, but not on a slot
      // this.viewport.plugins.pause('drag');
      this.selectNode(node);
    } else {
      console.log(event.data.global);
      // console.log(node.clickedSlotRef);
      console.log(node.clickedSlotRef.children);
      console.log(node.clickedSlotRef.children[0].getBounds());
      node.data = event.data;
      node.dragSource = node.clickedSlotRef.children[0].getBounds();
      // node.dragSource = event.data.global.clone();
      // this.alpha = 0.5;
      // this.dragging = true;
    }
  }

  onNodeDragMove(event: PIXI.InteractionEvent, node: PPNode): void {
    if (node.clickedSlotRef !== null) {
      console.log(node.dragSource);
      console.log(node.data.global);
      // const newPosition = this.data.getLocalPosition(this.parent);
      // this.x = node.clickedSlotRef.children[0].getGlobalPosition().x;
      // this.y = node.clickedSlotRef.children[0].getGlobalPosition().y;

      this.linkGraphics.clear();
      this.linkGraphics.lineStyle(2, 0xff00ff, 1);
      const sourcePointX = node.dragSource.x + node.dragSource.width / 2;
      const sourcePointY = node.dragSource.y + node.dragSource.height / 2;
      const toX = event.data.global.x - sourcePointX;
      const toY = event.data.global.y - sourcePointY;
      const cpX = Math.abs(toX - sourcePointX) / 2;
      const cpY = sourcePointY;
      const cpX2 = toX - Math.abs(toX - sourcePointX) / 2;
      const cpY2 = toY;

      this.linkGraphics.beginFill(0xde3249);
      this.linkGraphics.drawRect(sourcePointX, sourcePointY, 10, 10);
      this.linkGraphics.drawRect(cpX, cpY, 10, 10);
      this.linkGraphics.drawRect(cpX2, cpY2, 10, 10);
      this.linkGraphics.endFill();

      this.linkGraphics.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);
      // this.linkGraphics.x = sourcePointX;
      // this.linkGraphics.y = sourcePointY;
    }
  }

  onNodeDragEnd(event: PIXI.InteractionEvent, node: PPNode): void {
    console.log('onNodeDragEnd');
    if (node.clickedSlotRef === null) {
      // this.viewport.plugins.resume('drag');
    } else {
      node.clickedSlotRef = null;
    }
  }

  // GETTERS & SETTERS

  get dragLink(): boolean {
    return this._dragLink;
  }

  set dragLink(isDraggingLink: boolean) {
    this._dragLink = isDraggingLink;
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
      .on('pointermove', (e: PIXI.InteractionEvent) =>
        this.onNodeDragMove(e, node)
      )
      .on('pointerupoutside', (e: PIXI.InteractionEvent) =>
        this.onNodeDragEnd(e, node)
      )
      .on('pointerup', (e: PIXI.InteractionEvent) =>
        this.onNodeDragEnd(e, node)
      );

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

  // connect(slot, target_node, target_slot) {
  //   target_slot = target_slot || 0;

  //   var output = this.outputs[slot];

  //   var input = target_node.inputs[target_slot];
  //   var link_info = null;

  //   //create link class
  //   link_info = new LLink(
  //     ++this.graph.last_link_id,
  //     input.type,
  //     this.id,
  //     slot,
  //     target_node.id,
  //     target_slot
  //   );

  //   //add to graph links list
  //   this.graph.links[link_info.id] = link_info;

  //   //connect in output
  //   if (output.links == null) {
  //     output.links = [];
  //   }
  //   output.links.push(link_info.id);
  //   //connect in input
  //   target_node.inputs[target_slot].link = link_info.id;
  //   if (this.graph) {
  //     this.graph._version++;
  //   }
  //   if (this.onConnectionsChange) {
  //     this.onConnectionsChange(LiteGraph.OUTPUT, slot, true, link_info, output);
  //   } //link_info has been created now, so its updated
  //   if (target_node.onConnectionsChange) {
  //     target_node.onConnectionsChange(
  //       LiteGraph.INPUT,
  //       target_slot,
  //       true,
  //       link_info,
  //       input
  //     );
  //   }
  //   if (this.graph && this.graph.onNodeConnectionChange) {
  //     this.graph.onNodeConnectionChange(
  //       LiteGraph.INPUT,
  //       target_node,
  //       target_slot,
  //       this,
  //       slot
  //     );
  //     this.graph.onNodeConnectionChange(
  //       LiteGraph.OUTPUT,
  //       this,
  //       slot,
  //       target_node,
  //       target_slot
  //     );
  //   }

  //   return link_info;
  // }
}

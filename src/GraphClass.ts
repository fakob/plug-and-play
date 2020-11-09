import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import PPLink from './LinkClass';
import { PPNode, InputNode, OutputNode } from './NodeClass';
import { CONNECTION_COLOR_HEX } from './constants';

export default class PPGraph {
  app: PIXI.Application;
  viewport: Viewport;

  lastNodeId: number;

  lastLinkId: number;

  _nodes: { [key: number]: PPNode };
  _links: { [key: number]: PPLink };

  selected_nodes: number[];
  connectingOutput: null | OutputNode;

  tempConnection: PIXI.Graphics;
  connectionContainer: PIXI.Container;
  nodeContainer: PIXI.Container;

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    console.log('Graph created');

    // clear the stage
    this.clear();
    this.connectingOutput = null;

    this.tempConnection = new PIXI.Graphics();
    this.connectionContainer = new PIXI.Container();
    this.connectionContainer.name = 'connectionContainer';
    this.nodeContainer = new PIXI.Container();
    this.nodeContainer.name = 'nodeContainer';

    this.viewport.addChild(this.connectionContainer, this.nodeContainer);
    this.connectionContainer.addChild(this.tempConnection);
    this.tempConnection.name = 'tempConnection';

    this.viewport.on('pointerdown', this._onPointerDown.bind(this));
  }

  _onPointerDown(): void {
    this.deselectAllNodes();
  }

  onNodeDragStart(event: PIXI.InteractionEvent, node: PPNode): void {
    event.stopPropagation();
    console.log(node);
    if (node.clickedOutputRef === null) {
      // clicked on the node, but not on a slot
      this.selectNode(node);
    } else {
      this.connectingOutput = node.clickedOutputRef;
      // event.data.global delivers the mouse coordinates from the top left corner in pixel
      node.data = event.data;

      const dragSourceRect = node.clickedOutputRef.children[0].getBounds();
      const dragSourcePoint = new PIXI.Point(
        dragSourceRect.x + dragSourceRect.width / 2,
        dragSourceRect.y + dragSourceRect.height / 2
      );
      // change dragSourcePoint coordinates from screen to world space
      node.dragSourcePoint = this.viewport.toWorld(dragSourcePoint);
      // this.alpha = 0.5;
      // this.dragging = true;
    }
  }

  onNodeDragMove(event: PIXI.InteractionEvent, node: PPNode): void {
    if (this.connectingOutput !== null && node.clickedOutputRef !== null) {
      // temporarily draw connection while dragging
      const sourcePointX = node.dragSourcePoint.x;
      const sourcePointY = node.dragSourcePoint.y;

      // change mouse coordinates from screen to world space
      const mousePoint = this.viewport.toWorld(event.data.global);
      const mousePointX = mousePoint.x;
      const mousePointY = mousePoint.y;

      // draw curve from 0,0 as PIXI.Graphics originates from 0,0
      const toX = mousePointX - sourcePointX;
      const toY = mousePointY - sourcePointY;
      const cpX = Math.abs(toX) / 2;
      const cpY = 0;
      const cpX2 = toX - cpX;
      const cpY2 = toY;

      this.tempConnection.clear();
      this.tempConnection.lineStyle(2, CONNECTION_COLOR_HEX, 1);
      this.tempConnection.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

      // offset curve to start from source
      this.tempConnection.x = sourcePointX;
      this.tempConnection.y = sourcePointY;
    }
  }

  onNodeDragEnd(event: PIXI.InteractionEvent, node: PPNode): void {
    console.log('onNodeDragEnd');
    if (this.connectingOutput === null) {
      // this.viewport.plugins.resume('drag');
    } else {
      // check if over input
      if (node.overInputRef !== null) {
        console.log(
          'connecting Output:',
          this.connectingOutput.name,
          'of',
          this.connectingOutput.parent.name,
          'with Input:',
          node.overInputRef.name,
          'of',
          node.overInputRef.parent.name
        );
        this.connect(this.connectingOutput, node.overInputRef, this.viewport);
      }
      this.tempConnection.clear();
      this.connectingOutput = null;
      node.clickedOutputRef = null;
      node.overInputRef = null;
    }
  }

  onNodeOver(event: PIXI.InteractionEvent, node: PPNode): void {
    console.log('onNodeOver');
    // is connecting node
    if (this.connectingOutput !== null) {
      console.log('over other node', node.name);
      if (node.overInputRef !== null) {
        console.log('over other nodes socket', node.overInputRef.name);
      }
    }
  }

  // GETTERS & SETTERS

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
      )
      .on('pointerover', (e: PIXI.InteractionEvent) =>
        this.onNodeOver(e, node)
      );

    // give the node an id
    node.id = ++this.lastNodeId;

    // add the node to the canvas
    this.nodeContainer.addChild(node);

    // add the node to the _nodes object
    this._nodes[node.id] = node;

    return node; //to chain actions
  }

  connect(output: OutputNode, input: InputNode, viewport: Viewport): PPLink {
    // //if there is something already plugged there, disconnect
    // if (target_node.inputs[target_slot].link != null) {
    //   this.graph.beforeChange();
    //   target_node.disconnectInput(target_slot);
    //   changed = true;
    // }

    let linkInfo = null;

    // //this slots cannot be connected (different types)
    // if (!LiteGraph.isValidConnection(output.type, input.type)) {
    //   this.setDirtyCanvas(false, true);
    //   if (changed) this.graph.connectionChange(this, linkInfo);
    //   return null;
    // }

    //create link class
    linkInfo = new PPLink(
      (this.lastLinkId += 1),
      input.type,
      output,
      input,
      viewport
    );

    //add to graph links list
    this._links[linkInfo.id] = linkInfo;

    //connect in output
    output.links.push(linkInfo);
    //connect in input
    input.link = linkInfo;

    console.log(linkInfo);

    this.connectionContainer.addChild(linkInfo);

    return linkInfo;
  }

  clear(): void {
    this.lastNodeId = 0;
    this.lastLinkId = 0;

    //nodes
    this._nodes = [];

    //links
    this._links = {}; //container with all the links
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
    Object.entries(nodes).forEach(([, node]) => {
      if (node.selected) {
        node.select(false);
      }
    });
    this.selected_nodes = [];
  }
}

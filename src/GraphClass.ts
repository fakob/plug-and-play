import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { CONNECTION_COLOR_HEX } from './constants';
import { PPNodeConstructor } from './interfaces';
import PPNode from './NodeClass';
import InputSocket from './InputSocketClass';
import OutputSocket from './OutputSocketClass';
import PPLink from './LinkClass';

export default class PPGraph {
  app: PIXI.Application;
  viewport: Viewport;

  lastNodeId: number;

  lastLinkId: number;

  _nodes: { [key: number]: PPNode };
  _links: { [key: number]: PPLink };
  _registeredNodeTypes: Record<string, PPNodeConstructor>;

  selected_nodes: number[];
  clickedOutputRef: null | OutputSocket;
  overInputRef: null | InputSocket;
  dragSourcePoint: null | PIXI.Point;

  tempConnection: PIXI.Graphics;
  connectionContainer: PIXI.Container;
  nodeContainer: PIXI.Container;

  constructor(app: PIXI.Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    console.log('Graph created');

    // clear the stage
    this.clear();
    this.clickedOutputRef = null;
    this.overInputRef = null;
    this.dragSourcePoint = null;

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

  // SETUP

  _onPointerDown(): void {
    this.deselectAllNodes();
  }

  _onNodePointerDown(event: PIXI.InteractionEvent): void {
    console.log('_onNodePointerDown');
    // stop propagation so viewport does not get dragged
    event.stopPropagation();

    const node = event.currentTarget as PPNode;
    console.log(node.id);

    if (this.clickedOutputRef === null) {
      // clicked on the node, but not on a slot
      this.selectNode(node);
    } else {
      // event.data.global delivers the mouse coordinates from the top left corner in pixel
      node.interactionData = event.data;

      const dragSourceRect = this.clickedOutputRef.children[0].getBounds();
      const dragSourcePoint = new PIXI.Point(
        dragSourceRect.x + dragSourceRect.width / 2,
        dragSourceRect.y + dragSourceRect.height / 2
      );
      // change dragSourcePoint coordinates from screen to world space
      this.dragSourcePoint = this.viewport.toWorld(dragSourcePoint);
    }

    // subscribe to pointermove
    this.viewport.on('pointermove', this.onNodeDragMove.bind(this));
  }

  onNodeDragMove(event: PIXI.InteractionEvent): void {
    // console.log('onNodeDragMove');

    if (this.clickedOutputRef !== null) {
      // temporarily draw connection while dragging
      const sourcePointX = this.dragSourcePoint.x;
      const sourcePointY = this.dragSourcePoint.y;

      // change mouse coordinates from screen to world space
      const mousePoint = this.viewport.toWorld(event.data.global);
      const mousePointX = mousePoint.x;
      const mousePointY = mousePoint.y;

      // draw curve from 0,0 as PIXI.thisics originates from 0,0
      const toX = mousePointX - sourcePointX;
      const toY = mousePointY - sourcePointY;
      const cpX = Math.abs(toX) / 2;
      const cpY = 0;
      const cpX2 = toX - cpX;
      const cpY2 = toY;
      // console.log(sourcePointX, toX);

      this.tempConnection.clear();
      this.tempConnection.lineStyle(2, CONNECTION_COLOR_HEX, 1);
      this.tempConnection.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

      // offset curve to start from source
      this.tempConnection.x = sourcePointX;
      this.tempConnection.y = sourcePointY;
    }
  }

  _onNodePointerUpAndUpOutside(event: PIXI.InteractionEvent): void {
    console.log('_onNodePointerUpAndUpOutside');

    const node = event.currentTarget as PPNode;
    console.log(node.id);

    // unsubscribe from pointermove
    this.viewport.removeListener('pointermove', this.onNodeDragMove);

    if (this !== null) {
      if (this.clickedOutputRef === null) {
        // this.viewport.plugins.resume('drag');
      } else {
        // check if over input
        console.log(this.overInputRef);
        if (this.overInputRef !== null) {
          console.log(
            'connecting Output:',
            this.clickedOutputRef.name,
            'of',
            this.clickedOutputRef.parent.name,
            'with Input:',
            this.overInputRef.name,
            'of',
            this.overInputRef.parent.name
          );
          this.connect(this.clickedOutputRef, this.overInputRef, this.viewport);
        }
      }
    }
    this.tempConnection.clear();
    this.clickedOutputRef = null;
    this.overInputRef = null;
  }

  _onNodePointerOver(event: PIXI.InteractionEvent): void {
    console.log('_onNodePointerOver');

    const node = event.currentTarget as PPNode;
    console.log(node.id);
  }

  // METHODS

  // selectNode(node, add_to_current_selection) {
  //   if (node == null) {
  //     this.deselectAllNodes();
  //   } else {
  //     this.selectNodes([node], add_to_current_selection);
  //   }
  // }

  registerNodeType(type: string, baseClass: PPNodeConstructor): void {
    // baseClass.type = type;
    console.log('Node registered: ' + type);

    // const classname = baseClass.name;

    // const pos = type.lastIndexOf('/');
    // baseClass.category = type.substr(0, pos);

    // if (!baseClass.title) {
    //   baseClass.title = classname;
    // }
    console.log(this._registeredNodeTypes);
    this._registeredNodeTypes[type] = baseClass;
  }

  // createNode(type: string): PPNode {
  createNode<T extends PPNode = PPNode>(type: string): T {
    const baseClass = this._registeredNodeTypes[type];
    if (!baseClass) {
      console.log('GraphNode type "' + type + '" not registered.');
      return null;
    }

    const title = type;
    const node = new baseClass(title, this) as T;
    return node;
  }

  add<T extends PPNode = PPNode>(node: T): T {
    // if (!node) {
    //   return;
    // }

    node
      .on('pointerdown', this._onNodePointerDown.bind(this))
      .on('pointerupoutside', this._onNodePointerUpAndUpOutside.bind(this))
      .on('pointerup', this._onNodePointerUpAndUpOutside.bind(this))
      .on('pointerover', this._onNodePointerOver.bind(this));

    // give the node an id
    node.id = ++this.lastNodeId;

    // change add id to title
    const newTitle = `${node.nodeTitle} : ${node.id}`;
    node.nodeTitle = newTitle;
    console.log(node.nodeTitle);

    // add the node to the canvas
    this.nodeContainer.addChild(node);

    // add the node to the _nodes object
    this._nodes[node.id] = node;

    return node; //to chain actions
  }

  createAndAdd<T extends PPNode = PPNode>(type: string): T {
    const node = this.createNode(type) as T;
    // if (node) {
    this.add(node);
    return node;
    // }
  }

  connect(
    output: OutputSocket,
    input: InputSocket,
    viewport: Viewport
  ): PPLink {
    // check if this input already has a connection
    this.checkIfInputHasConnectionAndDeleteIt(input);

    let link = null;

    // //this slots cannot be connected (different types)
    // if (!LiteGraph.isValidConnection(output.type, input.type)) {
    //   this.setDirtyCanvas(false, true);
    //   if (changed) this.graph.connectionChange(this, link);
    //   return null;
    // }

    //create link class
    link = new PPLink(
      (this.lastLinkId += 1),
      input.type,
      output,
      input,
      viewport
    );

    //add to graph links list
    this._links[link.id] = link;

    //add link to output
    output.links.push(link);
    //add link to input
    input.link = link;

    this.connectionContainer.addChild(link);

    return link;
  }

  checkIfInputHasConnectionAndDeleteIt(input: InputSocket): boolean {
    // check if this input already has a connection
    Object.entries(this._links).forEach(([key, link]) => {
      if (link.target === input) {
        console.log('deleting link:', link.target);

        // remove link from source and target socket
        link.getTarget().removeLink();
        link.getSource().removeLink(link);

        // remove link from graph
        this.connectionContainer.removeChild(this._links[key]);
        return delete this._links[key];
      }
    });
    return false;
  }

  clear(): void {
    this.lastNodeId = 0;
    this.lastLinkId = 0;

    // nodes
    this._nodes = [];

    // links
    this._links = {}; //container with all the links

    // registered note types
    this._registeredNodeTypes = {};
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

  runStep(): void {
    const nodes = this._nodes;
    if (!nodes) {
      return;
    }

    Object.entries(nodes).forEach(([key, node]) => {
      node.onExecute(); //hard to send elapsed time
      if (true) {
        node.drawComment();
      }
      node.onAfterExecute();
    });
  }
}

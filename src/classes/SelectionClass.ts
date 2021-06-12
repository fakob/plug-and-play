import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import PPNode from './NodeClass';
import { CONNECTION_COLOR_HEX, NODE_MARGIN } from '../utils/constants';
import { getBoundsOfNodes, getObjectsInsideBounds } from '../pixi/utils-pixi';

export default class PPSelection extends PIXI.Container {
  protected viewport: Viewport;
  protected nodes: PPNode[];
  protected selectedNodes: PPNode[];

  protected selectionGraphics: PIXI.Graphics;
  protected sourcePoint: null | PIXI.Point;
  hasStarted: boolean;

  protected onMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onSelectionChange: ((selectedNodes: PPNode[]) => void) | null; // called when the selection has changed

  constructor(viewport: Viewport, nodes: PPNode[]) {
    super();
    this.viewport = viewport;
    this.nodes = nodes;
    this.sourcePoint = null;
    this.hasStarted = false;
    this.selectedNodes = null;

    this.name = 'selectionContainer';
    this.selectionGraphics = new PIXI.Graphics();
    this.selectionGraphics.name = 'selectionGraphics';
    this.addChild(this.selectionGraphics);

    this.interactive = true;

    this.on('pointerupoutside', this.onPointerUpAndUpOutside.bind(this));
    this.on('pointerup', this.onPointerUpAndUpOutside.bind(this));
    this.viewport.on('moved', (this as any).onViewportMoved.bind(this));

    // define callbacks
    this.onSelectionChange = null; //called if the selection changes
  }

  onViewportMoved(): void {
    this.drawRectangleFromSelection(this.selectedNodes);
  }

  onPointerUpAndUpOutside(): void {
    console.log('Selection: onPointerUpAndUpOutside');
    if (this.hasStarted) {
      // unsubscribe from pointermove
      this.removeListener('pointermove', this.onMoveHandler);
      console.log(this.selectedNodes);
      this.drawFinalSelection();
    } else {
      this.resetSelectionGraphics();
    }
  }

  onMove(event: PIXI.InteractionEvent): void {
    // temporarily draw rectangle while dragging
    const targetPoint = new PIXI.Point(
      (event.data.originalEvent as MouseEvent).clientX,
      (event.data.originalEvent as MouseEvent).clientY
    );
    // console.log(targetPoint);
    const selX = Math.min(this.sourcePoint.x, targetPoint.x);
    const selY = Math.min(this.sourcePoint.y, targetPoint.y);
    const selWidth = Math.max(this.sourcePoint.x, targetPoint.x) - selX;
    const selHeight = Math.max(this.sourcePoint.y, targetPoint.y) - selY;

    this.selectionGraphics.clear();
    this.selectionGraphics.beginFill(CONNECTION_COLOR_HEX, 0.2);
    this.selectionGraphics.lineStyle(1, CONNECTION_COLOR_HEX, 0.3);
    this.selectionGraphics.drawRect(selX, selY, selWidth, selHeight);

    // bring drawing rect into node nodeContainer space
    const selectionRect = new PIXI.Rectangle(selX, selY, selWidth, selHeight);
    this.selectedNodes = getObjectsInsideBounds(this.nodes, selectionRect);

    this.selectNodes(this.selectedNodes);
  }

  resetSelectionGraphics(): void {
    this.hasStarted = false;
    this.sourcePoint = null;

    this.selectionGraphics.clear();
    this.selectionGraphics.x = 0;
    this.selectionGraphics.y = 0;
    this.selectionGraphics.scale.x = 1;
    this.selectionGraphics.scale.y = 1;
  }

  drawStart(event: PIXI.InteractionEvent): void {
    this.resetSelectionGraphics();

    this.hasStarted = true;
    const sourcePoint = new PIXI.Point(
      (event.data.originalEvent as MouseEvent).clientX,
      (event.data.originalEvent as MouseEvent).clientY
    );
    // change sourcePoint coordinates from screen to world space
    this.sourcePoint = sourcePoint;

    // subscribe to pointermove
    this.onMoveHandler = this.onMove.bind(this);
    this.on('pointermove', this.onMoveHandler);
  }

  drawFinalSelection(): void {
    if (this.hasStarted) {
      // unsubscribe from pointermove
      this.removeListener('pointermove', this.onMoveHandler);
      console.log(this.selectedNodes);
      if (this.selectedNodes.length > 0) {
        this.drawRectangleFromSelection(this.selectedNodes);
      } else {
        this.resetSelectionGraphics();
      }
    }
  }

  drawRectangleFromSelection(selectedNodes: PPNode[]): void {
    const selectionRect = getBoundsOfNodes(selectedNodes);
    this.selectionGraphics.clear();
    this.selectionGraphics.x = 0;
    this.selectionGraphics.y = 0;
    this.selectionGraphics.beginFill(CONNECTION_COLOR_HEX, 0.2);
    this.selectionGraphics.lineStyle(1, CONNECTION_COLOR_HEX, 0.3);
    this.selectionGraphics.drawRect(
      selectionRect.x - NODE_MARGIN / 2,
      selectionRect.y - NODE_MARGIN / 2,
      selectionRect.width + NODE_MARGIN,
      selectionRect.height + NODE_MARGIN
    );
  }

  selectNode(node: PPNode): void {
    if (node == null) {
      this.deselectAllNodes();
    } else {
      this.selectNodes([node]);
    }
  }

  selectNodes(nodes: PPNode[]): void {
    this.deselectAllNodes();
    if (nodes == null) {
      this.deselectAllNodes();
    } else {
      nodes.map((node) => {
        node.select(true);
        this.selectedNodes.push(node);
      });
    }
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedNodes);
    }
  }

  deselectAllNodes(): void {
    Object.entries(this.nodes).forEach(([, node]) => {
      if (node.selected) {
        node.select(false);
      }
    });
    this.selectedNodes = [];

    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedNodes);
    }
  }
}

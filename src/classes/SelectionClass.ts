import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import PPNode from './NodeClass';
import { CONNECTION_COLOR_HEX, NODE_MARGIN } from '../utils/constants';
import { getBoundsOfNodes, getObjectsInsideBounds } from '../pixi/utils-pixi';

export default class PPSelection extends PIXI.Container {
  protected viewport: Viewport;
  protected nodes: PPNode[];
  selectedNodes: PPNode[];

  protected selectionGraphics: PIXI.Graphics;
  protected sourcePoint: null | PIXI.Point;
  isDrawingSelection: boolean;
  isDraggingSelection: boolean;
  interactionData: PIXI.InteractionData | null;

  protected onMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onSelectionChange: ((selectedNodes: PPNode[]) => void) | null; // called when the selection has changed

  constructor(viewport: Viewport, nodes: PPNode[]) {
    super();
    this.viewport = viewport;
    this.nodes = nodes;
    this.sourcePoint = null;
    this.isDrawingSelection = false;
    this.isDraggingSelection = false;
    this.selectedNodes = null;
    this.interactionData = null;

    this.name = 'selectionContainer';
    this.selectionGraphics = new PIXI.Graphics();
    this.selectionGraphics.name = 'selectionGraphics';
    this.addChild(this.selectionGraphics);

    this.interactive = true;

    this.on('pointerdown', this.onPointerDown.bind(this));
    this.on('pointerupoutside', this.onPointerUpAndUpOutside.bind(this));
    this.on('pointerup', this.onPointerUpAndUpOutside.bind(this));
    this.on('pointerover', this.onPointerOver.bind(this));
    this.viewport.on('moved', (this as any).onViewportMoved.bind(this));

    this.onMoveHandler = this.onMove.bind(this);

    // define callbacks
    this.onSelectionChange = null; //called if the selection changes
  }

  onPointerDown(event: PIXI.InteractionEvent): void {
    console.log('Selection: onPointerDown');
    if (this.selectedNodes.length > 0) {
      console.log('startDragAction');
      this.cursor = 'move';
      this.isDraggingSelection = true;
      this.interactionData = event.data;
      this.sourcePoint = this.interactionData.getLocalPosition(
        this.selectedNodes[0]
      );

      // subscribe to pointermove
      this.on('pointermove', this.onMoveHandler);
    }
  }

  onPointerOver(): void {
    this.cursor = 'move';
  }

  onViewportMoved(): void {
    this.drawRectangleFromSelection();
  }

  onPointerUpAndUpOutside(): void {
    console.log('Selection: onPointerUpAndUpOutside');
    if (this.isDraggingSelection) {
      this.cursor = 'default';
      this.isDraggingSelection = false;
      this.interactionData = null;
      // unsubscribe from pointermove
      this.removeListener('pointermove', this.onMoveHandler);
    }
  }

  onMove(event: PIXI.InteractionEvent): void {
    // console.log('onMove');
    if (this.isDrawingSelection) {
      // console.log('onMove: isDrawingSelection');

      // temporarily draw rectangle while dragging
      const targetPoint = new PIXI.Point(
        (event.data.originalEvent as MouseEvent).clientX,
        (event.data.originalEvent as MouseEvent).clientY
      );
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
    } else if (this.isDraggingSelection) {
      // console.log('onMove: isDraggingSelection');

      const targetPoint = this.interactionData.getLocalPosition(
        this.selectedNodes[0]
      );
      const deltaX = targetPoint.x - this.sourcePoint.x;
      const deltaY = targetPoint.y - this.sourcePoint.y;

      // update nodes positions
      this.selectedNodes.forEach((node) => {
        node.x += deltaX;
        node.y += deltaY;

        node.updateCommentPosition();
        node.updateConnectionPosition();

        if (node.shouldExecuteOnMove()) {
          node.execute(new Set());
        }

        if (node.onNodeDragOrViewportMove) {
          const screenPoint = node.screenPoint();
          node.onNodeDragOrViewportMove({
            globalX: undefined,
            globalY: undefined,
            screenX: screenPoint.x,
            screenY: screenPoint.y,
            scale: this.viewport.scale.x,
          });
        }
      });

      // update selection position
      this.drawRectangleFromSelection();
    }
  }

  resetSelection(): void {
    this.sourcePoint = null;

    this.selectionGraphics.clear();
    this.selectionGraphics.x = 0;
    this.selectionGraphics.y = 0;
    this.selectionGraphics.scale.x = 1;
    this.selectionGraphics.scale.y = 1;
  }

  drawStart(event: PIXI.InteractionEvent): void {
    console.log('startDrawAction');
    this.resetSelection();

    this.isDrawingSelection = true;
    this.interactionData = event.data;
    this.sourcePoint = new PIXI.Point(
      (event.data.originalEvent as MouseEvent).clientX,
      (event.data.originalEvent as MouseEvent).clientY
    );

    // subscribe to pointermove
    this.on('pointermove', this.onMoveHandler);
  }

  drawFinalSelection(): void {
    this.isDrawingSelection = false;
    // unsubscribe from pointermove
    this.removeListener('pointermove', this.onMoveHandler);
    console.log(this.selectedNodes);
    if (this.selectedNodes.length > 0) {
      this.drawRectangleFromSelection();
    } else {
      this.resetSelection();
    }
  }

  drawRectangleFromSelection(): void {
    const selectionRect = getBoundsOfNodes(this.selectedNodes);
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

  deselectAllNodesAndResetSelection(): void {
    this.resetSelection();
    this.deselectAllNodes();
  }
}

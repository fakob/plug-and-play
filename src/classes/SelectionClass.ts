import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import PPNode from './NodeClass';
import { SELECTION_COLOR_HEX } from '../utils/constants';
import { getObjectsInsideBounds } from '../pixi/utils-pixi';
import { getDifferenceSelection } from '../utils/utils';

export default class PPSelection extends PIXI.Container {
  protected viewport: Viewport;
  protected nodes: PPNode[];
  protected previousSelectedNodes: PPNode[];
  selectedNodes: PPNode[];

  protected selectionIntendGraphics: PIXI.Graphics;
  protected selectionGraphics: PIXI.Graphics;
  protected singleSelectionsGraphics: PIXI.Graphics;
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
    this.previousSelectedNodes = [];
    this.selectedNodes = null;
    this.interactionData = null;

    this.name = 'selectionContainer';

    this.selectionIntendGraphics = new PIXI.Graphics();
    this.selectionIntendGraphics.name = 'selectionIntendGraphics';
    this.addChild(this.selectionIntendGraphics);

    this.singleSelectionsGraphics = new PIXI.Graphics();
    this.singleSelectionsGraphics.name = 'singleSelectionsGraphics';
    this.addChild(this.singleSelectionsGraphics);

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
    this.drawRectanglesFromSelection();
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

      this.selectionIntendGraphics.clear();
      this.selectionIntendGraphics.beginFill(SELECTION_COLOR_HEX, 0.05);
      this.selectionIntendGraphics.lineStyle(1, SELECTION_COLOR_HEX, 0.8);
      this.selectionIntendGraphics.drawRect(selX, selY, selWidth, selHeight);

      // bring drawing rect into node nodeContainer space
      const selectionRect = new PIXI.Rectangle(selX, selY, selWidth, selHeight);

      // get differenceSelection of newlySelectedNodes and
      // previousSelectedNodes (is empty if not addToOrToggleSelection)
      const newlySelectedNodes = getObjectsInsideBounds(
        this.nodes,
        selectionRect
      );
      const differenceSelection = getDifferenceSelection(
        this.previousSelectedNodes,
        newlySelectedNodes
      );

      this.selectNodes(differenceSelection);
      this.drawRectanglesFromSelection();
      // this.drawSingleSelections();
    }
  }

  moveSelection(deltaX: number, deltaY: number): void {
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
          screenX: screenPoint.x,
          screenY: screenPoint.y,
          scale: this.viewport.scale.x,
        });
      }
    });

    // update selection position
    this.drawRectanglesFromSelection();
  }

  resetAllGraphics(): void {
    this.resetGraphics(this.selectionIntendGraphics);
    this.resetGraphics(this.singleSelectionsGraphics);
    this.resetGraphics(this.selectionGraphics);
  }

  resetGraphics(graphics: PIXI.Graphics): void {
    graphics.clear();
    graphics.x = 0;
    graphics.y = 0;
    graphics.scale.x = 1;
    graphics.scale.y = 1;
  }

  drawSelectionStart(
    event: PIXI.InteractionEvent,
    addToOrToggleSelection: boolean
  ): void {
    console.log('startDrawAction');

    // store selectedNodes in previousSelectedNodes
    // if addToOrToggleSelection is true
    this.previousSelectedNodes = addToOrToggleSelection
      ? this.selectedNodes
      : [];

    this.resetGraphics(this.selectionIntendGraphics);
    addToOrToggleSelection || this.resetGraphics(this.singleSelectionsGraphics);
    addToOrToggleSelection || this.resetGraphics(this.selectionGraphics);

    this.isDrawingSelection = true;
    this.interactionData = event.data;
    this.sourcePoint = new PIXI.Point(
      (event.data.originalEvent as MouseEvent).clientX,
      (event.data.originalEvent as MouseEvent).clientY
    );

    // subscribe to pointermove
    this.on('pointermove', this.onMoveHandler);
  }

  drawSelectionFinish(): void {
    this.isDrawingSelection = false;
    this.selectionIntendGraphics.clear();

    // reset previousSelectedNodes
    this.previousSelectedNodes = [];

    // unsubscribe from pointermove
    this.removeListener('pointermove', this.onMoveHandler);
    console.log(this.selectedNodes);
    if (this.selectedNodes.length > 0) {
      this.drawRectanglesFromSelection();
    } else {
      this.resetAllGraphics();
    }
  }

  drawSingleSelections(): void {
    this.singleSelectionsGraphics.clear();
    this.singleSelectionsGraphics.x = 0;
    this.singleSelectionsGraphics.y = 0;
    this.singleSelectionsGraphics.lineStyle(1, SELECTION_COLOR_HEX, 0.8);

    // draw single selections
    this.selectedNodes.map((node) => {
      const nodeBounds = node.getBounds();
      this.singleSelectionsGraphics.drawRect(
        nodeBounds.x,
        nodeBounds.y,
        nodeBounds.width,
        nodeBounds.height
      );
    });
  }

  drawRectanglesFromSelection(): void {
    this.drawSingleSelections();

    const selectionBounds = this.singleSelectionsGraphics.getBounds();
    this.selectionGraphics.clear();
    this.selectionGraphics.x = 0;
    this.selectionGraphics.y = 0;
    // this.selectionGraphics.beginFill(SELECTION_COLOR_HEX, 0.05);
    this.selectionGraphics.lineStyle(2, SELECTION_COLOR_HEX, 1);
    this.selectionGraphics.drawRect(
      selectionBounds.x,
      selectionBounds.y,
      selectionBounds.width,
      selectionBounds.height
    );
  }

  isNodeSelected(node: PPNode): boolean {
    return this.selectedNodes.includes(node);
  }

  selectNode(node: PPNode, addToOrToggleSelection = false): void {
    if (node == null) {
      this.deselectAllNodes();
    } else {
      this.selectNodes([node], addToOrToggleSelection);
      this.drawRectanglesFromSelection();
    }
  }

  selectNodes(nodes: PPNode[], addToOrToggleSelection = false): void {
    if (nodes == null) {
      this.deselectAllNodes();
    } else {
      if (addToOrToggleSelection) {
        const differenceSelection = getDifferenceSelection(
          this.selectedNodes,
          nodes
        );
        this.selectedNodes = differenceSelection;
      } else {
        this.selectedNodes = nodes;
      }
    }
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedNodes);
    }
  }

  deselectAllNodes(): void {
    this.selectedNodes = [];

    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedNodes);
    }
  }

  deselectAllNodesAndResetSelection(): void {
    this.resetAllGraphics();
    this.deselectAllNodes();
  }
}

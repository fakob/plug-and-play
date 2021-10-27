import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import PPNode from './NodeClass';
import {
  NODE_MARGIN,
  SCALEHANDLE_SIZE,
  SELECTION_COLOR_HEX,
  WHITE_HEX,
} from '../utils/constants';
import { getObjectsInsideBounds } from '../pixi/utils-pixi';
import { getDifferenceSelection } from '../utils/utils';

export default class PPSelection extends PIXI.Container {
  protected viewport: Viewport;
  protected nodes: PPNode[];
  protected previousSelectedNodes: PPNode[];
  _selectedNodes: PPNode[];

  protected selectionIntendGraphics: PIXI.Graphics;
  selectionGraphics: PIXI.Graphics;
  protected singleSelectionsGraphics: PIXI.Graphics;
  protected scaleHandle: ScaleHandle;

  protected sourcePoint: null | PIXI.Point;
  isDrawingSelection: boolean;
  isDraggingSelection: boolean;
  interactionData: PIXI.InteractionData | null;

  protected onMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onSelectionChange: ((selectedNodes: PPNode[]) => void) | null; // called when the selection has changed

  onRightClick:
    | ((event: PIXI.InteractionEvent, target: PIXI.DisplayObject) => void)
    | null; // called when the selection is right clicked

  constructor(viewport: Viewport, nodes: PPNode[]) {
    super();
    this.viewport = viewport;
    this.nodes = nodes;
    this.sourcePoint = null;
    this.isDrawingSelection = false;
    this.isDraggingSelection = false;
    this.previousSelectedNodes = [];
    this._selectedNodes = [];
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

    this.scaleHandle = new ScaleHandle(
      this.onScaling,
      this.onScaled,
      this.onScaleReset
    );
    this.addChild(this.scaleHandle);

    this.interactive = true;

    this.on('pointerdown', this.onPointerDown.bind(this));
    this.on('pointerupoutside', this.onPointerUpAndUpOutside.bind(this));
    this.on('pointerup', this.onPointerUpAndUpOutside.bind(this));
    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('rightclick', this.onPointerRightClicked.bind(this));
    this.viewport.on('moved', (this as any).onViewportMoved.bind(this));

    this.onMoveHandler = this.onMove.bind(this);

    // define callbacks
    this.onSelectionChange = null; //called if the selection changes
  }

  get selectedNodes(): PPNode[] {
    return this._selectedNodes;
  }

  set selectedNodes(newNodes: PPNode[]) {
    this._selectedNodes = newNodes;
    this._selectedNodes.forEach((node) => {
      node.select();
    });
  }

  onScaling = (pointerPosition: PIXI.Point): void => {
    const worldPosition = this.viewport.toWorld(
      pointerPosition.x,
      pointerPosition.y
    );

    this.selectedNodes[0].resizeNode(
      Math.abs(worldPosition.x - this.selectedNodes[0].x),
      Math.abs(worldPosition.y - this.selectedNodes[0].y)
    );
    this.drawRectanglesFromSelection();
  };

  onScaled = (): void => {
    this.selectedNodes[0].resizedNode();
  };

  onScaleReset = (): void => {
    this.selectedNodes[0].resetSize();
    this.drawRectanglesFromSelection();
  };

  onPointerRightClicked(event: PIXI.InteractionEvent): void {
    console.log('Selection - onPointerRightClicked');
    event.stopPropagation();
    const target = event.target;
    console.log(target, event.data.originalEvent);

    if (this.onRightClick) {
      this.onRightClick(event, target);
    }
  }

  onPointerDown(event: PIXI.InteractionEvent): void {
    console.log('Selection: onPointerDown');
    if (this.selectedNodes.length > 0) {
      if (event.data.originalEvent.shiftKey) {
        const targetPoint = new PIXI.Point(
          (event.data.originalEvent as MouseEvent).clientX,
          (event.data.originalEvent as MouseEvent).clientY
        );
        const selectionRect = new PIXI.Rectangle(
          targetPoint.x,
          targetPoint.y,
          1,
          1
        );
        const newlySelectedNodes = getObjectsInsideBounds(
          this.nodes,
          selectionRect
        );
        const differenceSelection = getDifferenceSelection(
          this.selectedNodes,
          newlySelectedNodes
        );

        this.selectNodes(differenceSelection);
        this.drawRectanglesFromSelection();
      } else {
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
    } else if (this.isDraggingSelection) {
      const targetPoint = this.interactionData.getLocalPosition(
        this.selectedNodes[0]
      );
      const deltaX = targetPoint.x - this.sourcePoint.x;
      const deltaY = targetPoint.y - this.sourcePoint.y;
      this.moveSelection(deltaX, deltaY);
    }
  }

  moveSelection(deltaX: number, deltaY: number): void {
    // update nodes positions
    this.selectedNodes.forEach((node) => {
      node.setPosition(deltaX, deltaY, true);
    });

    // update selection position
    this.drawRectanglesFromSelection();
  }

  resetAllGraphics(): void {
    this.resetGraphics(this.selectionIntendGraphics);
    this.resetGraphics(this.singleSelectionsGraphics);
    this.resetGraphics(this.selectionGraphics);
    this.scaleHandle.visible = false;
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

    // if only one node is selected, do not add fill
    // the fill blocks mouse events on the node
    // like doubleclick and clicks on sockets
    this.selectedNodes.length > 1 &&
      this.selectionGraphics.beginFill(SELECTION_COLOR_HEX, 0.01);

    this.selectionGraphics.lineStyle(1, SELECTION_COLOR_HEX, 1);
    this.selectionGraphics.drawRect(
      selectionBounds.x,
      selectionBounds.y,
      selectionBounds.width,
      selectionBounds.height
    );
    this.selectionGraphics.endFill();

    this.scaleHandle.x =
      selectionBounds.x + selectionBounds.width - SCALEHANDLE_SIZE / 2;
    this.scaleHandle.y =
      selectionBounds.y + selectionBounds.height - SCALEHANDLE_SIZE / 2;
  }

  isNodeSelected(node: PPNode): boolean {
    return this.selectedNodes.includes(node);
  }

  screenPoint(): PIXI.Point {
    return new PIXI.Point(
      this.selectionGraphics.getBounds().x + NODE_MARGIN,
      this.selectionGraphics.getBounds().y
    );
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
      // show scaleHandle only if there is only 1 node selected
      this.scaleHandle.visible = this.selectedNodes.length === 1;
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

class ScaleHandle extends PIXI.Graphics {
  onHandleResize: (pointerPosition: PIXI.Point) => void;
  onHandleResized: () => void;
  onHandleReset: () => void;

  private _pointerDown: boolean;
  private _pointerDragging: boolean;
  private _pointerPosition: PIXI.Point;
  private _pointerMoveTarget: PIXI.Container | null;

  constructor(
    onResize: (pointerPosition: PIXI.Point) => void,
    onResized: () => void,
    onReset: () => void
  ) {
    super();

    this.onHandleResize = onResize;
    this.onHandleResized = onResized;
    this.onHandleReset = onReset;

    this.interactive = true;

    this._pointerDown = false;
    this._pointerDragging = false;
    this._pointerPosition = new PIXI.Point();
    this._pointerMoveTarget = null;
    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('mousedown', this.onPointerDown, this);
    this.on('mouseup', this.onPointerUp, this);
    this.on('mouseupoutside', this.onPointerUp, this);
    this.on('dblclick', this._onDoubleClick.bind(this));
  }

  render(renderer: PIXI.Renderer): void {
    this.clear();
    this.beginFill(WHITE_HEX);
    this.lineStyle(1, SELECTION_COLOR_HEX);
    this.drawRect(0, 0, SCALEHANDLE_SIZE, SCALEHANDLE_SIZE);
    this.endFill();

    super.render(renderer);
  }

  protected onPointerOver(event: PIXI.InteractionEvent): void {
    event.stopPropagation();
    this.cursor = 'nwse-resize';
  }

  protected onPointerDown(event: PIXI.InteractionEvent): void {
    this._pointerDown = true;
    this._pointerDragging = false;

    event.stopPropagation();

    if (this._pointerMoveTarget) {
      this._pointerMoveTarget.off('pointermove', this.onPointerMove, this);
      this._pointerMoveTarget = null;
    }

    this._pointerMoveTarget = this;
    this._pointerMoveTarget.on('pointermove', this.onPointerMove, this);
  }

  protected onPointerMove(event: PIXI.InteractionEvent): void {
    if (!this._pointerDown) {
      return;
    }

    if (this._pointerDragging) {
      this.onDrag(event);
    } else {
      this.onDragStart(event);
    }

    event.stopPropagation();
  }

  protected onPointerUp(event: PIXI.InteractionEvent): void {
    if (this._pointerDragging) {
      this.onDragEnd(event);
    }

    this._pointerDown = false;

    if (this._pointerMoveTarget) {
      this._pointerMoveTarget.off('pointermove', this.onPointerMove, this);
      this._pointerMoveTarget = null;
    }
  }

  protected _onDoubleClick(event: PIXI.InteractionEvent): void {
    event.stopPropagation();
    if (this.onHandleReset) {
      this.onHandleReset();
    }
    if (this.onHandleResized) {
      this.onHandleResized();
    }
  }

  protected onDragStart(event: PIXI.InteractionEvent): void {
    this._pointerPosition.copyFrom(event.data.global);
    this._pointerDragging = true;
  }

  protected onDrag(event: PIXI.InteractionEvent): void {
    const currentPosition = event.data.global;

    // Callback handles the rest!
    if (this.onHandleResize) {
      this.onHandleResize(currentPosition);
    }

    this._pointerPosition.copyFrom(currentPosition);
  }

  protected onDragEnd(_: PIXI.InteractionEvent): void {
    this._pointerDragging = false;

    if (this.onHandleResized) {
      this.onHandleResized();
    }
  }
}

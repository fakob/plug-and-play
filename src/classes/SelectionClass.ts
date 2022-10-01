/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import PPNode from './NodeClass';
import PPGraph from './GraphClass';
import {
  NODE_MARGIN,
  SCALEHANDLE_SIZE,
  SELECTION_COLOR_HEX,
  WHITE_HEX,
} from '../utils/constants';
import { getObjectsInsideBounds } from '../pixi/utils-pixi';

export default class PPSelection extends PIXI.Container {
  protected viewport: Viewport;
  _selectedNodes: PPNode[];

  selectionGraphics: PIXI.Graphics;
  protected scaleHandle: ScaleHandle;

  protected sourcePoint: PIXI.Point;
  protected targetPoint: PIXI.Point;
  isDrawingSelection: boolean;
  isDraggingSelection: boolean;

  onSelectionChange: ((selectedNodes: PPNode[]) => void) | null; // called when the selection has changed
  onSelectionDragging: ((isDraggingSelection: boolean) => void) | null; // called when the selection is being dragged
  onSelectionRedrawn: ((screenPoint: PIXI.Point) => void) | null; // called when the selection is redrawn becaused its boundaries changed, were moved

  onRightClick: (
    event: PIXI.InteractionEvent,
    target: PIXI.DisplayObject
  ) => void;

  constructor(viewport: Viewport) {
    super();
    this.viewport = viewport;
    this.sourcePoint = new PIXI.Point(0, 0);
    this.targetPoint = new PIXI.Point(0, 0);
    this.isDrawingSelection = false;
    this.isDraggingSelection = false;
    this._selectedNodes = [];

    this.name = 'selectionContainer';

    this.selectionGraphics = new PIXI.Graphics();
    this.selectionGraphics.name = 'selectionGraphics';
    this.addChild(this.selectionGraphics);

    this.scaleHandle = new ScaleHandle(this);
    this.addChild(this.scaleHandle);

    this.interactive = true;

    this.on('pointerdown', this.onPointerDown.bind(this));
    this.on('pointerupoutside', this.onPointerUpAndUpOutside.bind(this));
    this.on('pointerup', this.onPointerUpAndUpOutside.bind(this));
    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('rightclick', this.onPointerRightClicked.bind(this));
    this.viewport.on('moved', (this as any).onViewportMoved.bind(this));

    // define callbacks
    this.onSelectionChange = (nodes: PPNode[]) => {};
    this.onSelectionDragging = (isDraggingSelection: boolean) => {};
    this.onSelectionRedrawn = () => {};
    this.on('pointermove', this.onMove);
  }

  get selectedNodes(): PPNode[] {
    return this._selectedNodes;
  }

  set selectedNodes(newNodes: PPNode[]) {
    this._selectedNodes = newNodes;
  }

  onScaling = (pointerPosition: PIXI.Point, shiftKeyPressed: boolean): void => {
    const worldPosition = this.viewport.toWorld(
      pointerPosition.x,
      pointerPosition.y
    );

    this.selectedNodes[0].resizeNode(
      Math.abs(worldPosition.x - this.selectedNodes[0].x),
      Math.abs(worldPosition.y - this.selectedNodes[0].y),
      shiftKeyPressed
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

    this.onRightClick(event, target);
  }

  startDragAction(event: PIXI.InteractionEvent) {
    console.log('startDragAction');
    this.cursor = 'move';
    this.isDraggingSelection = true;
    this.onSelectionDragging(this.isDraggingSelection);
    this.sourcePoint = event.data.getLocalPosition(this); //event.data.getLocalPosition(this.selectedNodes[0]);
    console.log('current p: ' + this.sourcePoint.x + ', ' + this.sourcePoint.y);
  }

  onPointerDown(event: PIXI.InteractionEvent): void {
    console.log('Selection: onPointerDown');
    /*if (event.data.originalEvent.shiftKey) {
      const targetPoint = new PIXI.Point(
        (event.data.originalEvent as MouseEvent).clientX,
        (event.data.originalEvent as MouseEvent).clientY
      );
      const selectionRect = new PIXI.Rectangle(
        targetPoint.x,
        targetPoint.y,
        0,
        0
      );
      const newlySelectedNodes = getObjectsInsideBounds(
        Object.values(PPGraph.currentGraph.nodes),
        selectionRect
      );
      /*const differenceSelection = getDifferenceSelection(
        this.selectedNodes,
        newlySelectedNodes
      );*

      this.removeFromSelection(newlySelectedNodes);
      this.drawRectanglesFromSelection();
    } else {*/
    this.startDragAction(event);
    //}
  }

  onPointerOver(): void {
    this.cursor = 'move';
  }

  onViewportMoved(): void {
    this.drawRectanglesFromSelection();
  }

  onPointerUpAndUpOutside(): void {
    this.cursor = 'default';
    this.isDraggingSelection = false;
    this.onSelectionDragging(this.isDraggingSelection);
  }

  getNodeUnderCursor() {}

  onMove(event: PIXI.InteractionEvent): void {
    this.drawRectanglesFromSelection();
    //console.log('onMove');
    this.targetPoint = event.data.getLocalPosition(this);
    this.selectionGraphics.clear();
    if (this.isDrawingSelection) {
      // console.log('onMove: isDrawingSelection');

      // temporarily draw rectangle while dragging
      const selX = Math.min(this.sourcePoint.x, this.targetPoint.x);
      const selY = Math.min(this.sourcePoint.y, this.targetPoint.y);
      const selWidth = Math.max(this.sourcePoint.x, this.targetPoint.x) - selX;
      const selHeight = Math.max(this.sourcePoint.y, this.targetPoint.y) - selY;

      // bring drawing rect into node nodeContainer space
      const selectionRect = new PIXI.Rectangle(selX, selY, selWidth, selHeight);

      // get differenceSelection of newlySelectedNodes and
      // previousSelectedNodes (is empty if not addToOrToggleSelection)
      const newlySelectedNodes = getObjectsInsideBounds(
        Object.values(PPGraph.currentGraph.nodes),
        selectionRect
      );
      /*const differenceSelection = getDifferenceSelection(
        this.previousSelectedNodes,
        newlySelectedNodes
      );*/

      //console.log('im drawin');
      //this.drawRectangle(this.sourcePoint, this.targetPoint);
      this.selectNodes(newlySelectedNodes);
      // this.drawSingleSelections();
    } else if (this.isDraggingSelection) {
      /*const targetPoint = event.data.getLocalPosition(this.selectedNodes[0]);
      const deltaX = targetPoint.x - this.sourcePoint.x;
      const deltaY = targetPoint.y - this.sourcePoint.y;
      this.moveSelection(deltaX, deltaY);*/
    }
  }

  nodeMousePressed(node: PPNode, event: PIXI.InteractionEvent) {
    const shiftKey = event.data.originalEvent.shiftKey;
    // select node if the shiftKey is pressed
    // or the node is not yet selected
    if (shiftKey) {
      this.addToSelection([node]);
    } else {
      this.removeFromSelection([node]);
    }
    //this.selectNodes([node], shiftKey, true);
    if (this.selectedNodes.length == 1) {
      this.startDragAction(event);
    }
  }

  nodeMouseReleased(node: PPNode, event: PIXI.InteractionEvent) {
    this.onPointerUpAndUpOutside();
  }

  moveSelection(deltaX: number, deltaY: number): void {
    // update nodes positions
    this.selectedNodes.forEach((node) => {
      node.setPosition(deltaX, deltaY, true);
    });

    this.drawRectanglesFromSelection();
  }

  resetAllGraphics(): void {
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

  drawSelectionStart(event: PIXI.InteractionEvent): void {
    console.log('startDrawAction');
    this.isDrawingSelection = true;

    this.sourcePoint = event.data.getLocalPosition(this);
    console.log('current p: ' + this.sourcePoint.x + ', ' + this.sourcePoint.y);
  }

  drawSelectionFinish(event: PIXI.InteractionEvent): void {
    console.log('finished drawing');
    this.isDrawingSelection = false;

    // reset previousSelectedNodes
    //this.previousSelectedNodes = [];

    console.log('selected nodes: ' + this.selectedNodes);
    this.onSelectionChange(this.selectedNodes);
    //this.drawRectanglesFromSelection();

    // only trigger deselect if the mouse was not moved and onMove was not called
    /*const targetPoint = new PIXI.Point(
      (event.data.originalEvent as MouseEvent).clientX,
      (event.data.originalEvent as MouseEvent).clientY
    );
    if (
      this.sourcePoint.x === targetPoint.x &&
      this.sourcePoint.y === targetPoint.y
    ) {
      console.log('deselectAllNodesAndResetSelection');
      this.deselectAllNodesAndResetSelection();
    }*/
  }

  drawSingleSelections(): void {
    //this.selectionGraphics.clear();

    if (this.isDrawingSelection) {
      this.drawRectangle(this.sourcePoint, this.targetPoint);
    }

    //this.singleSelectionsGraphics.clear();
    //this.singleSelectionsGraphics.x = 0;
    //this.singleSelectionsGraphics.y = 0;
    //this.singleSelectionsGraphics.lineStyle(1, SELECTION_COLOR_HEX, 0.8);

    // draw single selections
    this.selectedNodes.map((node) => {
      const nodeBounds = node._BackgroundRef.getBounds();
      this.drawRectangle(
        new PIXI.Point(nodeBounds.left, nodeBounds.top),
        new PIXI.Point(nodeBounds.right, nodeBounds.bottom)
      );
    });
    /*this.selectionGraphics.drawRect(
        nodeBounds.x,
        nodeBounds.y,
        nodeBounds.width,
        nodeBounds.height
      );
    });*/
  }

  drawRectangle(upperLeft: PIXI.Point, lowerRight: PIXI.Point) {
    this.selectionGraphics.beginFill(SELECTION_COLOR_HEX, 0.05);

    this.selectionGraphics.lineStyle(1, SELECTION_COLOR_HEX, 1);
    this.selectionGraphics.drawRect(
      upperLeft.x,
      upperLeft.y,
      lowerRight.x - upperLeft.x,
      lowerRight.y - upperLeft.y
    );
    this.selectionGraphics.endFill();
  }

  drawRectanglesFromSelection(): void {
    this.selectionGraphics.clear();
    this.drawSingleSelections();
    const selectionBounds = this.selectionGraphics.getBounds();

    this.scaleHandle.x =
      selectionBounds.x + selectionBounds.width - SCALEHANDLE_SIZE / 2;
    this.scaleHandle.y =
      selectionBounds.y + selectionBounds.height - SCALEHANDLE_SIZE / 2;

    this.onSelectionRedrawn(this.screenPoint());
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

  addToSelection(nodes: PPNode[]) {
    nodes.forEach((node) => {
      if (!this.selectedNodes.includes(node)) {
        this.selectedNodes.push(node);
      }
    });
  }
  removeFromSelection(toRemoveNodes: PPNode[]) {
    this.selectNodes(
      this.selectedNodes.filter((node) => !toRemoveNodes.includes(node))
    );
  }

  selectNodes(nodes: PPNode[]): void {
    console.log('ey im selecting here: ' + nodes.length);
    this.selectedNodes = nodes;
    // show scaleHandle only if there is only 1 node selected
    this.scaleHandle.visible = this.selectedNodes.length === 1;
    //this.drawRectanglesFromSelection();
    //if (notify) {
    //this.onSelectionChange(this.selectedNodes);
    //}
  }

  selectAllNodes(): void {
    this.selectNodes(Object.values(PPGraph.currentGraph.nodes));
  }

  deselectAllNodes(): void {
    this.selectNodes([]);
  }

  deselectAllNodesAndResetSelection(): void {
    this.resetAllGraphics();
    this.deselectAllNodes();
  }
}

class ScaleHandle extends PIXI.Graphics {
  selection: PPSelection;

  private _pointerDown: boolean;
  private _pointerDragging: boolean;
  private _pointerPosition: PIXI.Point;

  constructor(selection: PPSelection) {
    super();

    this.interactive = true;

    this.selection = selection;

    this._pointerDown = false;
    this._pointerDragging = false;
    this._pointerPosition = new PIXI.Point();
    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('mousedown', this.onPointerDown, this);
    this.on('mouseup', this.onPointerUp, this);
    this.on('mouseupoutside', this.onPointerUp, this);
    this.on('dblclick', this._onDoubleClick.bind(this));
    this.on('pointermove', this.onPointerMove, this);
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
    console.log('scale pointer down');
    this._pointerDown = true;
    this._pointerDragging = false;
    event.stopPropagation();
  }

  protected onPointerMove(event: PIXI.InteractionEvent): void {
    if (this._pointerDown) {
      if (this._pointerDragging) {
        this.onDrag(event);
      } else {
        this.onDragStart(event);
      }
    }
  }

  protected onPointerUp(event: PIXI.InteractionEvent): void {
    this._pointerDown = false;
    this.onDragEnd(event);
  }

  protected _onDoubleClick(event: PIXI.InteractionEvent): void {
    event.stopPropagation();
    this.selection.onScaled();
    this.selection.onScaleReset();
  }

  protected onDragStart(event: PIXI.InteractionEvent): void {
    this._pointerPosition.copyFrom(event.data.global);
    this._pointerDragging = true;
  }

  protected onDrag(event: PIXI.InteractionEvent): void {
    const currentPosition = event.data.global;

    // Callback handles the rest!
    const shiftKeyPressed = event.data.originalEvent.shiftKey;
    this.selection.onScaling(currentPosition, shiftKeyPressed);

    this._pointerPosition.copyFrom(currentPosition);
  }

  protected onDragEnd(_: PIXI.InteractionEvent): void {
    this._pointerDragging = false;
    this.selection.onScaled();
  }
}

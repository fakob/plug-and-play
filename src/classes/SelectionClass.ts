/* eslint-disable @typescript-eslint/no-empty-function */
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
import {
  getCurrentCursorPosition,
  getDifferenceSelection,
} from '../utils/utils';
import PPGraph from './GraphClass';
import { ActionHandler } from '../utils/actionHandler';
import InterfaceController, { ListenEvent } from '../InterfaceController';

export default class PPSelection extends PIXI.Container {
  protected viewport: Viewport;
  protected previousSelectedNodes: PPNode[];
  _selectedNodes: PPNode[];

  protected selectionIntendGraphics: PIXI.Graphics;
  selectionGraphics: PIXI.Graphics;
  protected singleSelectionsGraphics: PIXI.Graphics;
  protected scaleHandle: ScaleHandle;

  protected sourcePoint: PIXI.Point;
  private nodePosBeforeMovement: PIXI.Point;
  isDrawingSelection: boolean;
  isDraggingSelection: boolean;
  interactionData: PIXI.FederatedPointerEvent | null;
  listenID: string;

  protected onMoveHandler: (event?: PIXI.FederatedPointerEvent) => void;

  constructor(viewport: Viewport) {
    super();
    this.viewport = viewport;
    this.sourcePoint = new PIXI.Point(0, 0);
    this.isDrawingSelection = false;
    this.isDraggingSelection = false;
    this.previousSelectedNodes = [];
    this._selectedNodes = [];
    this.interactionData = null;
    this.listenID = '';

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

    this.scaleHandle = new ScaleHandle(this);
    this.addChild(this.scaleHandle);

    this.eventMode = 'dynamic';

    this.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.addEventListener(
      'pointerupoutside',
      this.onPointerUpAndUpOutside.bind(this)
    );
    this.addEventListener('pointerup', this.onPointerUpAndUpOutside.bind(this));
    this.addEventListener('pointerover', this.onPointerOver.bind(this));
    this.addEventListener('rightclick', (event) =>
      InterfaceController.onRightClick(event, event.target)
    );
    this.viewport.addEventListener(
      'moved',
      (this as any).onViewportMoved.bind(this)
    );
    this.onMoveHandler = this.onMove.bind(this);

    this.viewport.addEventListener(
      'gesturestart',
      (this as any).onPointerGestureStart.bind(this)
    );
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

    this.selectedNodes[0].resizeAndDraw(
      Math.abs(worldPosition.x - this.selectedNodes[0].x),
      Math.abs(worldPosition.y - this.selectedNodes[0].y),
      shiftKeyPressed
    );
    this.drawRectanglesFromSelection();
  };

  onScaleReset = (): void => {
    this.selectedNodes[0].resetSize();
    this.drawRectanglesFromSelection();
  };

  public startDragAction(event: PIXI.FederatedPointerEvent) {
    this.cursor = 'move';
    this.isDraggingSelection = true;
    InterfaceController.notifyListeners(ListenEvent.SelectionDragging, true);
    this.interactionData = event;
    this.sourcePoint = this.interactionData.getLocalPosition(
      this.selectedNodes[0]
    );

    this.nodePosBeforeMovement = getCurrentCursorPosition();

    // subscribe to pointermove
    this.listenID = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      this.onMoveHandler
    );
  }

  moveNodesByID(nodeIDs: string[], deltaX: number, deltaY: number) {
    const instantiated = nodeIDs
      .map((id) => PPGraph.currentGraph.nodes[id])
      .filter(Boolean);
    this.selectedNodes = instantiated;
    this.moveSelection(deltaX, deltaY);
  }

  public async stopDragAction() {
    if (!this.isDraggingSelection) {
      return;
    }
    this.cursor = 'default';
    this.isDraggingSelection = false;
    this.interactionData = null;
    InterfaceController.notifyListeners(ListenEvent.SelectionDragging, false);

    // unsubscribe from pointermove
    InterfaceController.removeListener(this.listenID);

    const endPoint = getCurrentCursorPosition();
    const deltaX = endPoint.x - this.nodePosBeforeMovement.x;
    const deltaY = endPoint.y - this.nodePosBeforeMovement.y;

    const nodeIDs = this.selectedNodes.map((node) => node.id);
    const doMove = async () => {
      this.moveNodesByID(nodeIDs, deltaX, deltaY);
    };
    const undoMove = async () => {
      this.moveNodesByID(nodeIDs, -deltaX, -deltaY);
    };
    await ActionHandler.performAction(doMove, undoMove, 'Move node(s)', false);
  }

  onPointerDown(event: PIXI.FederatedPointerEvent): void {
    console.log('Selection: onPointerDown');
    if (event.pointerType === 'touch' && event.isPrimary) {
      // Single touch gesture
      console.log('Single touch');
    } else if (event.pointerType === 'touch' && !event.isPrimary) {
      // Multi-touch gesture
      console.log('Multi-touch');
    }
    if (this.selectedNodes.length > 0) {
      if (event.shiftKey) {
        const targetPoint = new PIXI.Point(event.clientX, event.clientY);
        const selectionRect = new PIXI.Rectangle(
          targetPoint.x,
          targetPoint.y,
          1,
          1
        );
        const newlySelectedNodes = getObjectsInsideBounds(
          Object.values(PPGraph.currentGraph.nodes),
          selectionRect
        );
        const differenceSelection = getDifferenceSelection(
          this.selectedNodes,
          newlySelectedNodes
        );

        this.selectNodes(differenceSelection, false, true);
        this.drawRectanglesFromSelection();
      } else {
        this.startDragAction(event);
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
    this.stopDragAction();
    // we remove the fill of the selection on the nodes if its just one, so that sockets etc on it can be pressed
    if (this.selectedNodes.length == 1) {
      this.drawRectanglesFromSelection(false);
    }
  }

  onPointerGestureStart(): void {
    console.log('selection: onPointerGestureStart');
  }

  onMove(event: PIXI.FederatedPointerEvent): void {
    console.log(event.pointerType, event.isPrimary);
    if (this.isDrawingSelection) {
      console.log('this.isDrawingSelection');
      // temporarily draw rectangle while dragging
      const targetPoint = new PIXI.Point(event.clientX, event.clientY);
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
        Object.values(PPGraph.currentGraph.nodes),
        selectionRect
      );
      const differenceSelection = getDifferenceSelection(
        this.previousSelectedNodes,
        newlySelectedNodes
      );

      this.selectNodes(differenceSelection);
      this.drawRectanglesFromSelection();
      // this.drawSingleSelections();
    } else if (
      this.isDraggingSelection &&
      this.interactionData &&
      event.isPrimary
    ) {
      // console.log(this.isDraggingSelection, event.isPrimary);
      if (event.isPrimary) {
        const targetPoint = this.interactionData.getLocalPosition(
          this.selectedNodes[0]
        );
        const deltaX = targetPoint.x - this.sourcePoint.x;
        const deltaY = targetPoint.y - this.sourcePoint.y;
        this.moveSelection(deltaX, deltaY);
      }
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
    event: PIXI.FederatedPointerEvent,
    addToOrToggleSelection: boolean
  ): void {
    // store selectedNodes in previousSelectedNodes
    // if addToOrToggleSelection is true
    this.previousSelectedNodes = addToOrToggleSelection
      ? this.selectedNodes
      : [];

    this.resetGraphics(this.selectionIntendGraphics);
    addToOrToggleSelection || this.resetGraphics(this.singleSelectionsGraphics);
    addToOrToggleSelection || this.resetGraphics(this.selectionGraphics);

    this.isDrawingSelection = true;
    this.interactionData = event;
    this.sourcePoint = new PIXI.Point(event.clientX, event.clientY);

    // subscribe to pointermove
    this.listenID = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      this.onMoveHandler
    );
  }

  drawSelectionFinish(event: PIXI.FederatedPointerEvent): void {
    this.isDrawingSelection = false;
    this.selectionIntendGraphics.clear();

    // reset previousSelectedNodes
    this.previousSelectedNodes = [];

    // unsubscribe from pointermove
    InterfaceController.removeListener(this.listenID);
    console.log(this.selectedNodes);
    if (this.selectedNodes.length > 0) {
      this.drawRectanglesFromSelection();
    } else {
      this.resetAllGraphics();
    }
    InterfaceController.notifyListeners(
      ListenEvent.SelectionChanged,
      this.selectedNodes
    );

    // only trigger deselect if the mouse was not moved and onMove was not called
    const targetPoint = new PIXI.Point(event.clientX, event.clientY);
    if (
      this.sourcePoint.x === targetPoint.x &&
      this.sourcePoint.y === targetPoint.y
    ) {
      console.log('deselectAllNodesAndResetSelection');
      this.deselectAllNodesAndResetSelection();
    }
  }

  drawSingleSelections(): void {
    this.singleSelectionsGraphics.clear();
    this.singleSelectionsGraphics.x = 0;
    this.singleSelectionsGraphics.y = 0;
    this.singleSelectionsGraphics.lineStyle(1, SELECTION_COLOR_HEX, 0.8);

    // draw single selections
    this.selectedNodes.forEach((node) => {
      const nodeBounds = node._BackgroundRef.getBounds();
      this.singleSelectionsGraphics.drawRect(
        nodeBounds.x,
        nodeBounds.y,
        nodeBounds.width,
        nodeBounds.height
      );
    });
  }

  drawRectanglesFromSelection(fill = true): void {
    this.drawSingleSelections();

    const selectionBounds = this.singleSelectionsGraphics.getBounds();
    this.selectionGraphics.clear();
    this.selectionGraphics.x = 0;
    this.selectionGraphics.y = 0;

    if (fill) {
      this.selectionGraphics.beginFill(SELECTION_COLOR_HEX, 0.01);
    }

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

    InterfaceController.selectionRedrawn(this.screenPoint());
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
  selectNodes(
    nodes: PPNode[],
    addToOrToggleSelection = false,
    notify = false
  ): void {
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
      this.scaleHandle.visible =
        (this.selectedNodes.length === 1 ||
          this.selectedNodes[0]?.shouldShowResizeRectangleEvenWhenMultipleNodesAreSelected()) &&
        this.selectedNodes[0]?.allowResize();
    }
    this.drawRectanglesFromSelection();
    if (notify) {
      InterfaceController.notifyListeners(
        ListenEvent.SelectionChanged,
        this.selectedNodes
      );
    }
  }

  selectAllNodes(): void {
    this.selectNodes(Object.values(PPGraph.currentGraph.nodes), false, true);
  }

  deselectAllNodes(): void {
    console.log('deselectAllNodes');
    this.selectNodes([], false, true);
  }

  deselectAllNodesAndResetSelection(): void {
    console.trace('deselectAllNodesAndResetSelection');
    this.resetAllGraphics();
    this.deselectAllNodes();
  }
}

class ScaleHandle extends PIXI.Graphics {
  selection: PPSelection;

  private _pointerDown: boolean;
  private _pointerDragging: boolean;
  private _pointerPosition: PIXI.Point;
  private _pointerMoveTarget: PIXI.Container | null;
  listenID: string;

  constructor(selection: PPSelection) {
    super();

    this.eventMode = 'dynamic';

    this.selection = selection;
    this.listenID = '';

    this._pointerDown = false;
    this._pointerDragging = false;
    this._pointerPosition = new PIXI.Point();
    this._pointerMoveTarget = null;
    this.addEventListener('pointerover', this.onPointerOver.bind(this));
    this.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.addEventListener('pointerupoutside', this.onPointerUp.bind(this));
    this.addEventListener('click', this.onPointerClick.bind(this));
  }

  render(renderer: PIXI.Renderer): void {
    this.clear();
    this.beginFill(WHITE_HEX);
    this.lineStyle(1, SELECTION_COLOR_HEX);
    this.drawRect(0, 0, SCALEHANDLE_SIZE, SCALEHANDLE_SIZE);
    this.endFill();

    super.render(renderer);
  }

  protected onPointerOver(event: PIXI.FederatedPointerEvent): void {
    event.stopPropagation();
    this.cursor = 'nwse-resize';
  }

  protected onPointerDown(event: PIXI.FederatedPointerEvent): void {
    this._pointerDown = true;
    this._pointerDragging = false;

    event.stopPropagation();

    if (this._pointerMoveTarget) {
      InterfaceController.removeListener(this.listenID);
      this._pointerMoveTarget = null;
    }

    this._pointerMoveTarget = this;
    this.listenID = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      this.onPointerMove.bind(this)
    );
  }

  protected onPointerMove(event: PIXI.FederatedPointerEvent): void {
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

  protected onPointerUp(event: PIXI.FederatedPointerEvent): void {
    if (this._pointerDragging) {
      this.onDragEnd(event);
    }

    this._pointerDown = false;

    if (this._pointerMoveTarget) {
      InterfaceController.removeListener(this.listenID);
      this._pointerMoveTarget = null;
    }
  }

  protected onPointerClick(event: PIXI.FederatedPointerEvent): void {
    // check if double clicked
    if (event.detail === 2) {
      event.stopPropagation();
      this.selection.onScaleReset();
    }
  }

  protected onDragStart(event: PIXI.FederatedPointerEvent): void {
    this._pointerPosition = new PIXI.Point(event.clientX, event.clientY);
    this._pointerDragging = true;
  }

  protected onDrag(event: PIXI.FederatedPointerEvent): void {
    const currentPosition = new PIXI.Point(event.clientX, event.clientY);

    // Callback handles the rest!
    const shiftKeyPressed = event.shiftKey;
    this.selection.onScaling(currentPosition, shiftKeyPressed);

    this._pointerPosition = currentPosition;
  }

  protected onDragEnd(_: PIXI.FederatedPointerEvent): void {
    this._pointerDragging = false;
  }
}

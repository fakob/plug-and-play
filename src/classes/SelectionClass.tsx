/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import React from 'react';
import { Box } from '@mui/material';
import { CodeEditor } from '../components/Editor';
import { Viewport } from 'pixi-viewport';
import SelectionHeaderClass from './SelectionHeaderClass';
import PPNode from './NodeClass';
import { Tooltipable } from '../components/Tooltip';
import {
  ALIGNOPTIONS,
  ERROR_COLOR,
  ONCLICK_DOUBLECLICK,
  SCALEHANDLE_SIZE,
  SELECTION_COLOR_HEX,
  TOOLTIP_DISTANCE,
  TOOLTIP_WIDTH,
  WHITE_HEX,
} from '../utils/constants';
import { TAlignOptions } from '../utils/interfaces';
import { getObjectsInsideBounds } from '../pixi/utils-pixi';
import {
  getCircularReplacer,
  getCurrentCursorPosition,
  getDifferenceSelection,
} from '../utils/utils';
import PPGraph from './GraphClass';
import { ActionHandler } from '../utils/actionHandler';
import InterfaceController, { ListenEvent } from '../InterfaceController';

export enum Interaction {
  Passive,
  Drawing,
  Dragging,
}

export default class PPSelection extends PIXI.Container implements Tooltipable {
  public viewport: Viewport;
  protected previousSelectedNodes: PPNode[];
  _selectedNodes: PPNode[];

  protected selectionIntendGraphics: PIXI.Graphics;
  selectionGraphics: PIXI.Graphics;
  protected singleSelectionsGraphics: PIXI.Graphics;
  protected focusGraphics: PIXI.Graphics;
  protected scaleHandle: ScaleHandle;
  selectionHeader: SelectionHeaderClass;

  protected sourcePoint: PIXI.Point;
  protected lastPointMovedTo: PIXI.Point;
  interaction: Interaction = Interaction.Passive;
  listenID: string;

  protected onMoveHandler: (event?: PIXI.FederatedPointerEvent) => void;

  constructor(viewport: Viewport) {
    super();
    globalThis.__PPSELECTION__ = this;
    this.viewport = viewport;
    this.sourcePoint = new PIXI.Point(0, 0);
    this.previousSelectedNodes = [];
    this._selectedNodes = [];
    this.listenID = '';

    this.name = 'selectionContainer';

    this.selectionIntendGraphics = new PIXI.Graphics();
    this.selectionIntendGraphics.name = 'selectionIntendGraphics';
    this.addChild(this.selectionIntendGraphics);

    this.singleSelectionsGraphics = new PIXI.Graphics();
    this.singleSelectionsGraphics.name = 'singleSelectionsGraphics';
    this.addChild(this.singleSelectionsGraphics);

    this.focusGraphics = new PIXI.Graphics();
    this.focusGraphics.name = 'focusGraphics';
    this.addChild(this.focusGraphics);

    this.selectionGraphics = new PIXI.Graphics();
    this.selectionGraphics.name = 'selectionGraphics';
    this.addChild(this.selectionGraphics);

    this.selectionHeader = new SelectionHeaderClass();
    this.selectionGraphics.addChild(this.selectionHeader);

    this.scaleHandle = new ScaleHandle(this);
    this.addChild(this.scaleHandle);

    this.eventMode = 'dynamic';
    this.focusGraphics.eventMode = 'none';

    this.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.addEventListener(
      'pointerupoutside',
      this.onPointerUpAndUpOutside.bind(this),
    );
    this.addEventListener('pointerup', this.onPointerUpAndUpOutside.bind(this));
    this.addEventListener('pointerover', this.onPointerOver.bind(this));
    this.addEventListener('rightclick', (event) =>
      InterfaceController.onRightClick(event, event.target),
    );
    this.viewport.addEventListener(
      'zoomed',
      (this as any).onViewportMoved.bind(this),
    );

    this.onMoveHandler = this.onMove.bind(this);
  }

  get selectedNodes(): PPNode[] {
    return this._selectedNodes;
  }

  set selectedNodes(newNodes: PPNode[]) {
    this._selectedNodes = newNodes;
  }

  onScaleReset = (): void => {
    this.selectedNodes[0].resetSize();
    this.drawRectanglesFromSelection();
  };

  public setInteraction(interaction: Interaction) {
    switch (interaction) {
      case Interaction.Dragging: {
        this.cursor = 'move';
        break;
      }
      case Interaction.Drawing: {
        this.cursor = 'default';
        break;
      }
      case Interaction.Passive: {
        this.cursor = 'default';
        break;
      }
    }
    this.interaction = interaction;
  }

  public startDragAction(event: PIXI.FederatedPointerEvent) {
    this.setInteraction(Interaction.Dragging);
    InterfaceController.notifyListeners(ListenEvent.SelectionDragging, true);
    this.sourcePoint = this.toLocal(
      new PIXI.Point(event.clientX, event.clientY),
    );
    this.lastPointMovedTo = this.sourcePoint;
    event.stopPropagation();

    // subscribe to pointermove
    this.listenID = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      this.onMoveHandler,
    );
  }

  moveNodesByID(nodeIDs: string[], deltaX: number, deltaY: number) {
    const instantiated = nodeIDs
      .map((id) => PPGraph.currentGraph.nodes[id])
      .filter(Boolean);
    this.selectedNodes = instantiated;
    this.moveSelection(deltaX, deltaY);
  }

  public async stopDragAction(event) {
    this.setInteraction(Interaction.Passive);
    InterfaceController.notifyListeners(ListenEvent.SelectionDragging, false);

    // unsubscribe from pointermove
    InterfaceController.removeListener(this.listenID);

    const endPoint = this.toLocal(new PIXI.Point(event.clientX, event.clientY));
    const deltaX = endPoint.x - this.sourcePoint.x;
    const deltaY = endPoint.y - this.sourcePoint.y;

    const nodeIDs = this.selectedNodes.map((node) => node.id);
    const doMove = async () => {
      this.moveNodesByID(nodeIDs, deltaX, deltaY);
    };
    const undoMove = async () => {
      this.moveNodesByID(nodeIDs, -deltaX, -deltaY);
    };
    await ActionHandler.performAction(doMove, undoMove, 'Move node(s)', false);
  }

  async onPointerDown(event: PIXI.FederatedPointerEvent): Promise<void> {
    console.log('Selection: onPointerDown');
    const shiftKey = event.shiftKey;
    const altKey = event.altKey;

    if (shiftKey) {
      const targetPoint = this.toLocal(
        new PIXI.Point(event.clientX, event.clientY),
      );
      const selectionRect = new PIXI.Rectangle(
        targetPoint.x,
        targetPoint.y,
        1,
        1,
      );
      const newlySelectedNodes = getObjectsInsideBounds(
        Object.values(PPGraph.currentGraph.nodes),
        selectionRect,
      );
      const differenceSelection = getDifferenceSelection(
        this.selectedNodes,
        newlySelectedNodes,
      );

      this.selectNodes(differenceSelection, false, true);
      this.drawRectanglesFromSelection();
    } else {
      if (altKey) {
        const duplicatedNodes = await PPGraph.currentGraph.duplicateSelection(
          new PIXI.Point(24, 24),
        );
        this.selectNodes(duplicatedNodes, false, true);
      }

      this.startDragAction(event);
    }
  }

  onPointerOver(): void {
    this.cursor = 'move';
  }

  onViewportMoved(): void {
    this.drawRectanglesFromSelection();
  }

  onPointerUpAndUpOutside(event): void {
    console.log('Selection: onPointerUpAndUpOutside');
    this.stopDragAction(event);

    // we remove the fill of the selection on the nodes if its just one, so that sockets etc on it can be pressed
    this.drawRectanglesFromSelection();
  }

  onMove(event: PIXI.FederatedPointerEvent): void {
    switch (this.interaction) {
      case Interaction.Drawing: {
        // temporarily draw rectangle while dragging
        const targetPoint = this.toLocal(
          new PIXI.Point(event.clientX, event.clientY),
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
        const selectionRect = new PIXI.Rectangle(
          selX,
          selY,
          selWidth,
          selHeight,
        );

        // get differenceSelection of newlySelectedNodes and
        // previousSelectedNodes (is empty if not addToOrToggleSelection)
        const newlySelectedNodes = getObjectsInsideBounds(
          Object.values(PPGraph.currentGraph.nodes),
          selectionRect,
        );
        const differenceSelection = getDifferenceSelection(
          this.previousSelectedNodes,
          newlySelectedNodes,
        );

        this.selectNodes(differenceSelection);
        this.drawRectanglesFromSelection();
        break;
      }
      case Interaction.Dragging: {
        const targetPoint = this.toLocal(
          new PIXI.Point(event.clientX, event.clientY),
        );
        const deltaX = targetPoint.x - this.lastPointMovedTo.x;
        const deltaY = targetPoint.y - this.lastPointMovedTo.y;
        this.lastPointMovedTo = targetPoint;
        this.moveSelection(deltaX, deltaY);
        break;
      }
    }
  }

  moveSelection(deltaX: number, deltaY: number, finalPosition = false): void {
    // requestanimationframe to improve performance
    // update nodes positions
    this.selectedNodes.forEach((node) => {
      node.setPosition(deltaX, deltaY, true);
    });

    if (finalPosition) {
      this.drawRectanglesFromSelection();
    }

    // looks cool with these not moving
    //this.selectionGraphics.x += deltaX;
    //this.selectionGraphics.y += deltaY;
    //this.scaleHandle.x += deltaX;
    //this.scaleHandle.y += deltaY;
    //this.singleSelectionsGraphics.x += deltaX;
    //this.singleSelectionsGraphics.y += deltaY;
  }

  async action_alignNodes(alignAndDistribute: TAlignOptions): Promise<void> {
    const selection = PPGraph.currentGraph.selection;
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = -Number.MAX_VALUE;
    let maxY = -Number.MAX_VALUE;
    selection.selectedNodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.nodeWidth);
      maxY = Math.max(maxY, node.y + node.nodeHeight);
    });

    const nodeIDsPos = selection.selectedNodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.nodeWidth,
      height: node.nodeHeight,
    }));

    let incrementPos = 0;

    function alignNode(
      node: PPNode,
      alignAndDistribute: TAlignOptions,
      interval: number,
      index: number,
    ) {
      let x;
      let y;
      switch (alignAndDistribute) {
        case ALIGNOPTIONS.ALIGN_LEFT:
          x = minX;
          break;
        case ALIGNOPTIONS.ALIGN_CENTER_HORIZONTAL:
          x = minX + (maxX - minX) / 2 - node.nodeWidth / 2;
          break;
        case ALIGNOPTIONS.ALIGN_RIGHT:
          console.log(node.width, node.nodeWidth, node.getMinNodeWidth());
          x = maxX - node.nodeWidth;
          break;
        case ALIGNOPTIONS.ALIGN_TOP:
          y = minY;
          break;
        case ALIGNOPTIONS.ALIGN_CENTER_VERTICAL:
          y = minY + (maxY - minY) / 2 - node.nodeHeight / 2;
          break;
        case ALIGNOPTIONS.ALIGN_BOTTOM:
          y = maxY - node.nodeHeight;
          break;
        case ALIGNOPTIONS.DISTRIBUTE_HORIZONTAL:
          x = index === 0 ? minX : incrementPos + interval;
          incrementPos = x + node.nodeWidth;
          break;
        case ALIGNOPTIONS.DISTRIBUTE_VERTICAL:
          y = index === 0 ? minY : incrementPos + interval;
          incrementPos = y + node.nodeHeight;
          break;
      }
      node.setPosition(x, y);
    }

    const doAlign = async () => {
      const calcInterval = (min, max, sum, length) =>
        (max - min - sum) / (length - 1);

      nodeIDsPos.sort((a, b) => {
        return alignAndDistribute === ALIGNOPTIONS.DISTRIBUTE_VERTICAL
          ? a.y - b.y
          : a.x - b.x;
      });

      const sumOfWidthHeight =
        alignAndDistribute === ALIGNOPTIONS.DISTRIBUTE_VERTICAL
          ? nodeIDsPos.reduce((n, { height }) => n + height, 0)
          : nodeIDsPos.reduce((n, { width }) => n + width, 0);

      const interval =
        alignAndDistribute === ALIGNOPTIONS.DISTRIBUTE_VERTICAL
          ? calcInterval(minY, maxY, sumOfWidthHeight, nodeIDsPos.length)
          : calcInterval(minX, maxX, sumOfWidthHeight, nodeIDsPos.length);

      nodeIDsPos.forEach((idAndPos, index) => {
        const node = PPGraph.currentGraph.nodes[idAndPos.id];
        alignNode(node, alignAndDistribute, interval, index);
      });
      incrementPos = 0; // reset

      selection.drawRectanglesFromSelection();
    };

    const undoAlign = async () => {
      nodeIDsPos.forEach((idAndPos, index) => {
        const node = PPGraph.currentGraph.nodes[idAndPos.id];
        const oldPosition = nodeIDsPos[index];
        node.setPosition(oldPosition.x, oldPosition.y);
      });
      selection.drawRectanglesFromSelection();
    };

    await ActionHandler.performAction(doAlign, undoAlign, 'Align node(s)');
  }

  resetAllGraphics(): void {
    this.resetGraphics(this.selectionIntendGraphics);
    this.resetGraphics(this.singleSelectionsGraphics);
    this.resetGraphics(this.focusGraphics);
    this.resetGraphics(this.selectionGraphics);
    this.selectionHeader.visible = false;
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
    addToOrToggleSelection: boolean,
  ): void {
    // store selectedNodes in previousSelectedNodes
    // if addToOrToggleSelection is true
    this.previousSelectedNodes = addToOrToggleSelection
      ? this.selectedNodes
      : [];

    this.resetGraphics(this.selectionIntendGraphics);
    addToOrToggleSelection || this.resetGraphics(this.singleSelectionsGraphics);
    addToOrToggleSelection || this.resetGraphics(this.focusGraphics);
    addToOrToggleSelection || this.resetGraphics(this.selectionGraphics);

    this.setInteraction(Interaction.Drawing);
    this.sourcePoint = this.toLocal(
      new PIXI.Point(event.clientX, event.clientY),
    );
    this.lastPointMovedTo = this.sourcePoint;

    // subscribe to pointermove
    this.listenID = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      this.onMoveHandler,
    );
  }

  drawSelectionFinish(event: PIXI.FederatedPointerEvent): void {
    const interactionPre = this.interaction;
    this.setInteraction(Interaction.Passive);
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
      this.selectedNodes,
    );

    // only trigger deselect if the mouse was not moved and onMove was not called
    const adjustedP = this.toLocal(
      new PIXI.Point(event.clientX, event.clientY),
    );
    if (
      this.sourcePoint.x === adjustedP.x &&
      this.sourcePoint.y === adjustedP.y &&
      interactionPre == Interaction.Drawing
    ) {
      console.log('deselectAllNodesAndResetSelection');
      this.deselectAllNodesAndResetSelection();
    }
  }
  ROUNDNESS = 5;

  drawSingleSelections(): void {
    this.focusGraphics.clear();
    this.singleSelectionsGraphics.clear();
    this.singleSelectionsGraphics.x = 0;
    this.singleSelectionsGraphics.y = 0;
    this.singleSelectionsGraphics.lineStyle(
      1 / this.viewport.scale.x,
      SELECTION_COLOR_HEX,
    );

    //this.singleSelectionsGraphics.beginFill(SELECTION_COLOR_HEX);

    // draw single selections
    this.selectedNodes.forEach((node) => {
      //  console.trace();
      const nodeBounds = node.getSelectionBounds();
      this.singleSelectionsGraphics.drawRoundedRect(
        nodeBounds.x,
        nodeBounds.y,
        nodeBounds.width,
        nodeBounds.height,
        this.ROUNDNESS,
      );
    });
  }

  public drawSingleFocus(node: PPNode): void {
    this.focusGraphics.clear();
    this.focusGraphics.x = 0;
    this.focusGraphics.y = 0;
    this.focusGraphics.lineStyle(2, ERROR_COLOR.hexNumber(), 0.8, 1);
    this.focusGraphics.beginFill(ERROR_COLOR.hexNumber(), 0.15);

    // draw single selections
    const nodeBounds = node.getSelectionBounds();
    this.focusGraphics.drawRoundedRect(
      nodeBounds.x - 4,
      nodeBounds.y - 4,
      nodeBounds.width + 8,
      nodeBounds.height + 8,
      this.ROUNDNESS,
    );
    this.focusGraphics.endFill();
  }

  getBoundsFromNodes(nodes: PPNode[], margin: number = 0): PIXI.Rectangle {
    let x = Infinity;
    let y = Infinity;
    let endX = -Infinity;
    let endY = -Infinity;
    nodes.forEach((node) => {
      const nodeBounds = node.getSelectionBounds();
      x = Math.min(x, nodeBounds.x);
      y = Math.min(y, nodeBounds.y);
      endX = Math.max(endX, nodeBounds.width + nodeBounds.x);
      endY = Math.max(endY, nodeBounds.height + nodeBounds.y);
    });
    return new PIXI.Rectangle(
      x - margin,
      y - margin,
      endX - x + margin * 2,
      endY - y + margin * 2,
    );
  }

  drawRectanglesFromSelection(): void {
    this.drawSingleSelections();
    const selectionBounds = this.getBoundsFromNodes(this.selectedNodes);

    this.selectionGraphics.clear();
    this.selectionGraphics.x = 0;
    this.selectionGraphics.y = 0;

    if (this.selectedNodes.length > 1) {
      this.selectionGraphics.beginFill(SELECTION_COLOR_HEX, 0.01);
    }

    this.selectionGraphics.lineStyle(
      1 / this.viewport.scale.x,
      SELECTION_COLOR_HEX,
      1,
    );
    this.selectionGraphics.drawRoundedRect(
      selectionBounds.x,
      selectionBounds.y,
      selectionBounds.width,
      selectionBounds.height,
      this.ROUNDNESS,
    );
    this.selectionGraphics.endFill();

    this.selectionHeader.x = selectionBounds.x;
    this.selectionHeader.y = selectionBounds.y + selectionBounds.height + 4;

    this.selectionHeader.scale.x = 1 / this.viewport.scale.x;
    this.selectionHeader.scale.y = 1 / this.viewport.scale.y;

    this.scaleHandle.x = selectionBounds.x + selectionBounds.width;
    this.scaleHandle.y = selectionBounds.y + selectionBounds.height;
  }

  isNodeSelected(node: PPNode): boolean {
    return this.selectedNodes.includes(node);
  }

  selectNodes(
    nodes: PPNode[],
    addToOrToggleSelection = false,
    notify = false,
  ): void {
    if (nodes.length == 1) {
      nodes = nodes.concat(nodes[0].getExtraSelectedWhenSelected());
    }
    if (addToOrToggleSelection) {
      const differenceSelection = getDifferenceSelection(
        this.selectedNodes,
        nodes,
      );
      this.selectedNodes = differenceSelection;
    } else {
      this.selectedNodes = nodes;
    }
    // show selectionHeader if there are more than 1 nodes selected
    this.selectionHeader.visible = this.selectedNodes.length > 1;
    // show scaleHandle if there is only 1 node selected
    this.scaleHandle.visible =
      (this.selectedNodes.length === 1 ||
        this.selectedNodes[0]?.shouldShowResizeRectangleEvenWhenMultipleNodesAreSelected()) &&
      this.selectedNodes[0]?.allowResize();

    this.drawRectanglesFromSelection();
    if (notify) {
      InterfaceController.notifyListeners(
        ListenEvent.SelectionChanged,
        this.selectedNodes,
      );
    }
  }

  selectAllNodes(): void {
    this.selectNodes(Object.values(PPGraph.currentGraph.nodes), false, true);
  }

  deselectAllNodes(): void {
    this.selectNodes([], false, true);
  }

  deselectAllNodesAndResetSelection(): void {
    this.resetAllGraphics();
    this.deselectAllNodes();
  }

  getTooltipContent(props): React.ReactElement {
    const dataArray = this.selectedNodes.map((node) => {
      return node.id;
    });
    const data = JSON.stringify(dataArray, getCircularReplacer(), 2);
    return (
      <>
        <Box
          sx={{
            p: '8px',
            py: '9px',
            color: 'text.primary',
            fontWeight: 'medium',
            fontSize: 'small',
          }}
        >
          {this.selectedNodes.length} nodes selected
        </Box>
        <CodeEditor value={data} randomMainColor={props.randomMainColor} />
      </>
    );
  }

  getTooltipPosition(): PIXI.Point {
    const absPos = this.getBoundsFromNodes(this.selectedNodes);
    return new PIXI.Point(
      Math.max(0, absPos.x - TOOLTIP_WIDTH - TOOLTIP_DISTANCE),
      absPos.y,
    );
  }
}

class ScaleHandle extends PIXI.Graphics {
  selection: PPSelection;

  private _pointerDown: boolean;
  private _pointerDragging: boolean;
  private _pointerMoveTarget: PIXI.Container | null;
  listenID: string;

  constructor(selection: PPSelection) {
    super();

    this.eventMode = 'dynamic';

    this.selection = selection;
    this.listenID = '';

    this._pointerDown = false;
    this._pointerDragging = false;
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
    this.lineStyle(1 / this.selection.viewport.scale.x, SELECTION_COLOR_HEX);
    this.drawRect(
      0,
      0,
      SCALEHANDLE_SIZE / this.selection.viewport.scale.x,
      SCALEHANDLE_SIZE / this.selection.viewport.scale.y,
    );
    this.endFill();

    super.render(renderer);
  }

  protected onPointerOver(event: PIXI.FederatedPointerEvent): void {
    //event.stopPropagation();
    this.cursor = 'nwse-resize';
  }

  protected onPointerDown(event: PIXI.FederatedPointerEvent): void {
    console.log('pointer down moment');
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
      this.onPointerMove.bind(this),
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
    if (event.detail === ONCLICK_DOUBLECLICK) {
      event.stopPropagation();
      this.selection.onScaleReset();
    }
  }

  protected onDragStart(event: PIXI.FederatedPointerEvent): void {
    this._pointerDragging = true;
  }

  protected onDrag(event: PIXI.FederatedPointerEvent): void {
    const adjustedP = this.selection.toLocal(
      new PIXI.Point(event.clientX, event.clientY),
    );

    const pointerPosition = new PIXI.Point(
      adjustedP.x - PPNode.EXTRA_NODE_SELECTION_MARGIN,
      adjustedP.y - PPNode.EXTRA_NODE_SELECTION_MARGIN,
    );
    const shiftKeyPressed = event.shiftKey;
    this.selection.selectedNodes[0].onBeingScaled(
      Math.abs(pointerPosition.x - this.selection.selectedNodes[0].x),
      Math.abs(pointerPosition.y - this.selection.selectedNodes[0].y),
      shiftKeyPressed,
    );
  }

  protected onDragEnd(_: PIXI.FederatedPointerEvent): void {
    this._pointerDragging = false;
  }
}

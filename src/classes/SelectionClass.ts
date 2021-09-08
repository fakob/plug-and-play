import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import PPNode from './NodeClass';
import { SCALEHANDLE_SIZE, SELECTION_COLOR_HEX } from '../utils/constants';
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

    const commitGroup = (): void => {
      console.log('I am done scaling');
    };
    const onHandleDelta = (pointerPosition: PIXI.Point): void => {
      console.log(pointerPosition);
    };
    this.scaleHandle = new ScaleHandle(onHandleDelta, commitGroup);
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

  onPointerOver(event: PIXI.InteractionEvent): void {
    // const target = event.target;
    // console.log(target, target.name);
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
  onHandleDelta: (pointerPosition: PIXI.Point) => void;
  onHandleCommit: () => void;

  private _pointerDown: boolean;
  private _pointerDragging: boolean;
  private _pointerPosition: PIXI.Point;
  private _pointerMoveTarget: PIXI.Container | null;

  constructor(
    handler: (pointerPosition: PIXI.Point) => void,
    commit: () => void
  ) {
    super();

    this.onHandleDelta = handler;
    this.onHandleCommit = commit;

    this.interactive = true;

    this._pointerDown = false;
    this._pointerDragging = false;
    this._pointerPosition = new PIXI.Point();
    this._pointerMoveTarget = null;
    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('mousedown', this.onPointerDown, this);
    this.on('mouseup', this.onPointerUp, this);
    this.on('mouseupoutside', this.onPointerUp, this);
  }

  render(renderer: PIXI.Renderer): void {
    this.clear();
    this.beginFill(0xffffff);
    this.lineStyle(1, 0xff0000);
    this.drawRect(0, 0, SCALEHANDLE_SIZE, SCALEHANDLE_SIZE);
    this.endFill();

    super.render(renderer);
  }

  protected onPointerOver(event: PIXI.InteractionEvent): void {
    event.stopPropagation();
    const target = event.target;
    console.log(target, target.name);
    this.cursor = 'nwse-resize';
  }

  protected onPointerDown(e: PIXI.InteractionEvent): void {
    this._pointerDown = true;
    this._pointerDragging = false;

    e.stopPropagation();

    if (this._pointerMoveTarget) {
      this._pointerMoveTarget.off('pointermove', this.onPointerMove, this);
      this._pointerMoveTarget = null;
    }

    this._pointerMoveTarget = this;
    this._pointerMoveTarget.on('pointermove', this.onPointerMove, this);
  }

  protected onPointerMove(e: PIXI.InteractionEvent): void {
    if (!this._pointerDown) {
      return;
    }

    if (this._pointerDragging) {
      this.onDrag(e);
    } else {
      this.onDragStart(e);
    }

    e.stopPropagation();
  }

  protected onPointerUp(e: PIXI.InteractionEvent): void {
    if (this._pointerDragging) {
      this.onDragEnd(e);
    }

    this._pointerDown = false;

    if (this._pointerMoveTarget) {
      this._pointerMoveTarget.off('pointermove', this.onPointerMove, this);
      this._pointerMoveTarget = null;
    }
  }

  protected onDragStart(e: PIXI.InteractionEvent): void {
    this._pointerPosition.copyFrom(e.data.global);

    this._pointerDragging = true;
  }

  protected onDrag(e: PIXI.InteractionEvent): void {
    const currentPosition = e.data.global;

    // Callback handles the rest!
    if (this.onHandleDelta) {
      this.onHandleDelta(currentPosition);
    }

    this._pointerPosition.copyFrom(currentPosition);
  }

  protected onDragEnd(_: PIXI.InteractionEvent): void {
    this._pointerDragging = false;

    if (this.onHandleCommit) {
      this.onHandleCommit();
    }
  }
}

// type Handle =
//   | 'topLeft'
//   | 'topCenter'
//   | 'topRight'
//   | 'middleLeft'
//   | 'middleCenter'
//   | 'middleRight'
//   | 'bottomLeft'
//   | 'bottomCenter'
//   | 'bottomRight';

// interface ITransformerHandleStyle {
//   /** Fill color of the handle */
//   color: number;

//   /** Outline color of the handle */
//   outlineColor: number;

//   /** Outline thickness around the handle */
//   outlineThickness: number;

//   /** Radius (or size for non-circular handles) of the handle */
//   radius: number;

//   /** {@link TransformerHandle} provides three types of handle shapes - 'circle', 'square', 'tooth'. */
//   shape: string;
// }

// /**
//  * The default transformer handle style.
//  *
//  * @ignore
//  */
// const DEFAULT_HANDLE_STYLE: ITransformerHandleStyle = {
//   color: 0xffffff,
//   outlineColor: 0x000000,
//   outlineThickness: 1,
//   radius: 8,
//   shape: 'tooth',
// };

// class ScaleHandle extends PIXI.Graphics {
//   onHandleDelta: (pointerPosition: PIXI.Point) => void;
//   onHandleCommit: () => void;

//   protected _handle: Handle;
//   protected _style: ITransformerHandleStyle;
//   protected _dirty: boolean;

//   private _pointerDown: boolean;
//   private _pointerDragging: boolean;
//   private _pointerPosition: PIXI.Point;
//   private _pointerMoveTarget: PIXI.Container | null;

//   /**
//    * @param {Transformer} transformer
//    * @param {string} handle - the type of handle being drawn
//    * @param {object} styleOpts - styling options passed by the user
//    * @param {function} handler - handler for drag events, it receives the pointer position; used by {@code onDrag}.
//    * @param {function} commit - handler for drag-end events.
//    * @param {string}[cursor='move'] - a custom cursor to be applied on this handle
//    */
//   constructor(
//     // protected readonly transformer: Transformer,
//     handle: Handle,
//     styleOpts: Partial<ITransformerHandleStyle> = {},
//     handler: (pointerPosition: PIXI.Point) => void,
//     commit: () => void,
//     cursor?: string
//   ) {
//     super();

//     const style: ITransformerHandleStyle = Object.assign(
//       {},
//       DEFAULT_HANDLE_STYLE,
//       styleOpts
//     );

//     this._handle = handle;
//     this._style = style;
//     this.onHandleDelta = handler;
//     this.onHandleCommit = commit;

//     /**
//      * This flags whether this handle should be redrawn in the next frame due to style changes.
//      */
//     this._dirty = true;

//     // Pointer events
//     this.interactive = true;
//     this.cursor = cursor || 'move';
//     this._pointerDown = false;
//     this._pointerDragging = false;
//     this._pointerPosition = new PIXI.Point();
//     this._pointerMoveTarget = null;
//     this.on('mousedown', this.onPointerDown, this);
//     this.on('mouseup', this.onPointerUp, this);
//     this.on('mouseupoutside', this.onPointerUp, this);
//   }

//   get handle(): Handle {
//     return this._handle;
//   }
//   set handle(handle: Handle) {
//     this._handle = handle;
//     this._dirty = true;
//   }

//   /**
//    * The currently applied handle style.
//    */
//   get style(): Partial<ITransformerHandleStyle> {
//     return this._style;
//   }
//   set style(value: Partial<ITransformerHandleStyle>) {
//     this._style = Object.assign({}, DEFAULT_HANDLE_STYLE, value);
//     this._dirty = true;
//   }

//   render(renderer: PIXI.Renderer): void {
//     if (this._dirty) {
//       this.draw();

//       this._dirty = false;
//     }

//     super.render(renderer);
//   }

//   /**
//    * Redraws the handle's geometry. This is called on a `render` if {@code this._dirty} is true.
//    */
//   protected draw(): void {
//     const handle = this._handle;
//     const style = this._style;

//     const radius = style.radius;

//     this.clear()
//       .lineStyle(style.outlineThickness, style.outlineColor)
//       .beginFill(style.color);

//     if (style.shape === 'square') {
//       this.drawRect(-radius / 2, -radius / 2, radius, radius);
//     } else if (style.shape === 'tooth') {
//       switch (handle) {
//         case 'middleLeft':
//           this.drawPolygon([
//             -radius / 2,
//             -radius / 2,
//             -radius / 2,
//             radius / 2,
//             radius / 2,
//             radius / 2,
//             radius * 1.1,
//             0,
//             radius / 2,
//             -radius / 2,
//           ]);
//           break;
//         case 'topCenter':
//           this.drawPolygon([
//             -radius / 2,
//             -radius / 2,
//             radius / 2,
//             -radius / 2,
//             radius / 2,
//             radius / 2,
//             0,
//             radius * 1.1,
//             -radius / 2,
//             radius / 2,
//           ]);
//           break;
//         case 'middleRight':
//           this.drawPolygon([
//             -radius / 2,
//             radius / 2,
//             -radius * 1.1,
//             0,
//             -radius / 2,
//             -radius / 2,
//             radius / 2,
//             -radius / 2,
//             radius / 2,
//             radius / 2,
//           ]);
//           break;
//         case 'bottomCenter':
//           this.drawPolygon([
//             0,
//             -radius * 1.1,
//             radius / 2,
//             -radius / 2,
//             radius / 2,
//             radius / 2,
//             -radius / 2,
//             radius / 2,
//             -radius / 2,
//             -radius / 2,
//           ]);
//           break;
//         default:
//           this.drawRect(-radius / 2, -radius / 2, radius, radius);
//           break;
//       }
//     } else {
//       this.drawCircle(0, 0, radius);
//     }

//     this.endFill();
//   }

//   /**
//    * Handles the `pointerdown` event. You must call the super implementation.
//    *
//    * @param e
//    */
//   protected onPointerDown(e: PIXI.InteractionEvent): void {
//     this._pointerDown = true;
//     this._pointerDragging = false;

//     e.stopPropagation();

//     if (this._pointerMoveTarget) {
//       this._pointerMoveTarget.off('pointermove', this.onPointerMove, this);
//       this._pointerMoveTarget = null;
//     }

//     // this._pointerMoveTarget = this.transformer.stage || this;
//     this._pointerMoveTarget.on('pointermove', this.onPointerMove, this);
//   }

//   /**
//    * Handles the `pointermove` event. You must call the super implementation.
//    *
//    * @param e
//    */
//   protected onPointerMove(e: PIXI.InteractionEvent): void {
//     if (!this._pointerDown) {
//       return;
//     }

//     if (this._pointerDragging) {
//       this.onDrag(e);
//     } else {
//       this.onDragStart(e);
//     }

//     e.stopPropagation();
//   }

//   /**
//    * Handles the `pointerup` event. You must call the super implementation.
//    *
//    * @param e
//    */
//   protected onPointerUp(e: PIXI.InteractionEvent): void {
//     if (this._pointerDragging) {
//       this.onDragEnd(e);
//     }

//     this._pointerDown = false;

//     if (this._pointerMoveTarget) {
//       this._pointerMoveTarget.off('pointermove', this.onPointerMove, this);
//       this._pointerMoveTarget = null;
//     }
//   }

//   /**
//    * Called on the first `pointermove` when {@code this._pointerDown} is true. You must call the super implementation.
//    *
//    * @param e
//    */
//   protected onDragStart(e: PIXI.InteractionEvent): void {
//     this._pointerPosition.copyFrom(e.data.global);

//     this._pointerDragging = true;
//   }

//   /**
//    * Called on a `pointermove` when {@code this._pointerDown} & {@code this._pointerDragging}.
//    *
//    * @param e
//    */
//   protected onDrag(e: PIXI.InteractionEvent): void {
//     const currentPosition = e.data.global;

//     // Callback handles the rest!
//     if (this.onHandleDelta) {
//       this.onHandleDelta(currentPosition);
//     }

//     this._pointerPosition.copyFrom(currentPosition);
//   }

//   /**
//    * Called on a `pointerup` or `pointerupoutside` & {@code this._pointerDragging} was true.
//    *
//    * @param _
//    */
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   protected onDragEnd(_: PIXI.InteractionEvent): void {
//     this._pointerDragging = false;

//     if (this.onHandleCommit) {
//       this.onHandleCommit();
//     }
//   }
// }

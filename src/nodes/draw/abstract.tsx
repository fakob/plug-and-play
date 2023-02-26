import PPNode from '../../classes/NodeClass';
import PPGraph from '../../classes/GraphClass';
import Socket from '../../classes/SocketClass';
import {
  NODE_TYPE_COLOR,
  PIXI_PIVOT_OPTIONS,
  SOCKET_TYPE,
} from '../../utils/constants';
import { DeferredPixiType } from '../datatypes/deferredPixiType';
import { EnumType } from '../datatypes/enumType';
import * as PIXI from 'pixi.js';
import { NumberType } from '../datatypes/numberType';
import { BooleanType } from '../datatypes/booleanType';
import { ArrayType } from '../datatypes/arrayType';
import { TRgba } from '../../utils/interfaces';
import { DisplayObject } from 'pixi.js';
import { getCurrentCursorPosition } from '../../utils/utils';
import { ActionHandler } from '../../utils/actionHandler';
import InterfaceController, { ListenEvent } from '../../InterfaceController';

export const offseXName = 'Offset X';
export const offsetYName = 'Offset Y';
export const scaleXName = 'Scale X';
export const scaleYName = 'Scale Y';
export const inputRotationName = 'Angle';
export const inputPivotName = 'Pivot';
export const inputAbsolutePositions = 'Absolute Positions';
export const inputAlwaysDraw = 'Always Draw';
export const injectedDataName = 'Injected Data';
export const outputPixiName = 'Graphics';
const inputSkewXName = 'Skew X';
const inputSkewYName = 'Skew Y';

export abstract class DRAW_Base extends PPNode {
  deferredGraphics: PIXI.Container;
  listenID = '';
  isDragging = false;

  public getDescription(): string {
    return 'Draw Base';
  }
  public getName(): string {
    return 'Draw';
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.DRAW);
  }

  onNodeRemoved = (): void => {
    const canvas = PPGraph.currentGraph.backgroundCanvas;

    canvas.removeChild(this.deferredGraphics);
  };

  // you probably want to maintain this output in children
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        offseXName,
        new NumberType(true, -2000, 2000),
        400,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        offsetYName,
        new NumberType(true, -2000, 2000),
        0,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        scaleXName,
        new NumberType(false, 0.01, 10),
        1,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        scaleYName,
        new NumberType(false, 0.01, 10),
        1,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputRotationName,
        new NumberType(true, -180, 180),
        0,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputPivotName,
        new EnumType(PIXI_PIVOT_OPTIONS),
        PIXI_PIVOT_OPTIONS[0].text,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputAlwaysDraw,
        new BooleanType(),
        true,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputAbsolutePositions,
        new BooleanType(),
        false,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputSkewXName,
        new NumberType(false, Math.PI / 2, Math.PI / 2),
        0,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputSkewYName,
        new NumberType(false, -Math.PI / 2, Math.PI / 2),
        0,
        false
      ),
      new Socket(SOCKET_TYPE.IN, injectedDataName, new ArrayType(), [], true),
      new Socket(SOCKET_TYPE.OUT, outputPixiName, new DeferredPixiType()),
    ];
  }

  // if you are a child you likely want to use this instead of normal execute
  protected abstract drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number }
  ): void;

  protected getAndIncrementExecutions(executions: { string: number }): number {
    if (executions === undefined) {
      return 0;
    } else if (executions[this.id] === undefined) {
      executions[this.id] = 0;
    }
    return executions[this.id]++;
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const drawingFunction = (container, executions) =>
      this.drawOnContainer(inputObject, container, executions);
    outputObject[outputPixiName] = drawingFunction;
    this.handleDrawing(drawingFunction, inputObject[inputAbsolutePositions]);
  }

  protected setOffsets(offsets: PIXI.Point) {
    this.setInputData(offseXName, offsets.x);
    this.setInputData(offsetYName, offsets.y);
    this.executeOptimizedChain();
  }

  protected setOffsetsToCurrentCursor(
    originalCursorPos: PIXI.Point,
    originalOffsets: PIXI.Point
  ) {
    const currPos = getCurrentCursorPosition();
    this.setOffsetsToCurrentCursor;
    const diffX = currPos.x - originalCursorPos.x;
    const diffY = currPos.y - originalCursorPos.y;
    this.setOffsets(
      new PIXI.Point(originalOffsets.x + diffX, originalOffsets.y + diffY)
    );
  }

  protected pointerDown(
    originalCursorPos: PIXI.Point,
    originalOffsets: PIXI.Point
  ) {
    this.isDragging = true;
    PPGraph.currentGraph.selection.selectNodes([this], false, true);
    this.deferredGraphics.addEventListener('pointermove', () => {
      this.setOffsetsToCurrentCursor(originalCursorPos, originalOffsets);
      // re-trigger if still holding
      setTimeout(() => {
        this.removeListener('pointermove');
        if (this.isDragging) {
          this.pointerDown(originalCursorPos, originalOffsets);
        }
      }, 16);
    });

    InterfaceController.removeListener(this.listenID);
    this.listenID = InterfaceController.addListener(
      ListenEvent.GlobalPointerUp,
      () => this.pointerUp(originalCursorPos, originalOffsets)
    );
  }

  protected pointerUp(
    originalCursorPos: PIXI.Point,
    originalOffsets: PIXI.Point
  ) {
    const currPos = getCurrentCursorPosition();
    this.isDragging = false;
    this.deferredGraphics.removeListener('pointermove');
    InterfaceController.removeListener(this.listenID);

    // allow undoing
    ActionHandler.performAction(
      async () =>
        this.setOffsets(
          new PIXI.Point(
            currPos.x - originalCursorPos.x,
            currPos.y - originalCursorPos.y
          )
        ),
      async () => this.setOffsets(originalOffsets),
      false
    );
  }

  private handleDrawing(drawingFunction: any, absolutePosition: boolean): void {
    this.removeChild(this.deferredGraphics);
    if (this.shouldDraw()) {
      this.deferredGraphics = new PIXI.Container();
      drawingFunction(this.deferredGraphics, {});
      if (absolutePosition) {
        this.deferredGraphics.x -= this.x;
        this.deferredGraphics.y -= this.y;
      }
      this.addChild(this.deferredGraphics);

      if (this.allowMovingDirectly()) {
        this.deferredGraphics.interactive = true;

        this.deferredGraphics.addEventListener('pointerdown', () => {
          this.pointerDown(
            getCurrentCursorPosition(),
            new PIXI.Point(
              this.getInputData(offseXName),
              this.getInputData(offsetYName)
            )
          );
        });
      }
    }
  }

  protected positionAndScale(toModify: DisplayObject, inputObject: any): void {
    const pivot = inputObject[inputPivotName];
    const pivotPointFound = PIXI_PIVOT_OPTIONS.find(
      (option) => option.text === pivot
    );
    const pivotPoint = pivotPointFound
      ? pivotPointFound.value
      : PIXI_PIVOT_OPTIONS[0].value;

    toModify.setTransform(
      inputObject[offseXName],
      inputObject[offsetYName],
      inputObject[scaleXName],
      inputObject[scaleYName],
      (inputObject[inputRotationName] * Math.PI) / 180
    );
    toModify.pivot.x = pivotPoint.x * toModify.getBounds().width;
    toModify.pivot.y = pivotPoint.y * toModify.getBounds().height;

    toModify.skew.x = inputObject[inputSkewXName];
    toModify.skew.y = inputObject[inputSkewYName];
  }

  public outputPlugged(): void {
    this.executeOptimizedChain();
  }
  public outputUnplugged(): void {
    this.executeOptimizedChain();
  }

  protected shouldDraw(): boolean {
    return (
      this.getInputData(inputAlwaysDraw) ||
      !this.getOutputSocketByName(outputPixiName).hasLink()
    );
  }

  protected allowMovingDirectly(): boolean {
    return true;
  }

  public getIsPresentationalNode(): boolean {
    return true;
  }
}

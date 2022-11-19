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

export const offseXName = 'Offset X';
export const offsetYName = 'Offset Y';
export const scaleXName = 'Scale X';
export const scaleYName = 'Scale Y';
export const inputRotationName = 'Angle';
export const inputPivotName = 'Pivot';
export const inputAbsolutePositions = 'Absolute Positions';
export const injectedDataName = 'Injected Data';
export const outputPixiName = 'Graphics';

export abstract class DRAW_Base extends PPNode {
  deferredGraphics: PIXI.Container;

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
        PIXI_PIVOT_OPTIONS[0].value,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputAbsolutePositions,
        new BooleanType(),
        false,
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

  protected shouldDraw(): boolean {
    return !this.getOutputSocketByName(outputPixiName).hasLink();
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
    }
  }

  protected positionAndScale(toModify: DisplayObject, inputObject: any): void {
    const pivotPoint = inputObject[inputPivotName];

    toModify.setTransform(
      inputObject[offseXName],
      inputObject[offsetYName],
      inputObject[scaleXName],
      inputObject[scaleYName],
      (inputObject[inputRotationName] * Math.PI) / 180
    );
    toModify.pivot.x = pivotPoint.x * toModify.getBounds().width;
    toModify.pivot.y = pivotPoint.y * toModify.getBounds().height;
  }

  public outputPlugged(): void {
    this.executeOptimizedChain();
  }
  public outputUnplugged(): void {
    this.executeOptimizedChain();
  }
}

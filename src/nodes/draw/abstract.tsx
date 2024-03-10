import * as PIXI from 'pixi.js';
import PPNode from '../../classes/NodeClass';
import PPGraph from '../../classes/GraphClass';
import Socket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import {
  NODE_TYPE_COLOR,
  PIXI_PIVOT_OPTIONS,
  SOCKET_TYPE,
} from '../../utils/constants';
import { DeferredPixiType } from '../datatypes/deferredPixiType';
import { EnumType } from '../datatypes/enumType';
import { NumberType } from '../datatypes/numberType';
import { BooleanType } from '../datatypes/booleanType';
import { ArrayType } from '../datatypes/arrayType';
import { TRgba } from '../../utils/interfaces';
import { getCurrentCursorPosition } from '../../utils/utils';
import { removeAndDestroyChild } from '../../pixi/utils-pixi';
import { ActionHandler } from '../../utils/actionHandler';
import InterfaceController, { ListenEvent } from '../../InterfaceController';
import throttle from 'lodash/throttle';
import { NodeExecutionError } from '../../classes/ErrorClass';

export const offsetXName = 'Offset X';
export const offsetYName = 'Offset Y';
export const scaleXName = 'Scale X';
export const scaleYName = 'Scale Y';
export const inputRotationName = 'Angle';
export const inputPivotName = 'Pivot';
export const inputAbsolutePositions = 'Absolute Positions';
export const inputAlwaysDraw = 'Always Draw';
export const injectedDataName = 'Injected Data';
export const outputPixiName = 'Graphics';

export const outputMultiplierIndex = 'LastPressedIndex';
export const outputMultiplierInjected = 'LastPressedInjected';
export const outputMultiplierPointerDown = 'PointerDown';

export const objectsInteractive = 'Clickable objects';
const inputSkewXName = 'Skew X';
const inputSkewYName = 'Skew Y';

export abstract class DRAW_Base extends PPNode {
  deferredGraphics: PIXI.Container;
  listenIDUp = '';
  listenIDMove = '';
  isDragging = false;
  cachedContainers: Record<string, PIXI.Container> = {};

  public getName(): string {
    return 'Draw';
  }

  public getDescription(): string {
    return 'Draw Base';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.DRAW);
  }

  onNodeRemoved = (): void => {
    removeAndDestroyChild(this._ForegroundRef, this.deferredGraphics);
  };

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(true, true, false, 1000, this);
  }

  // you probably want to maintain this output in children
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        offsetXName,
        new NumberType(true, -2000, 2000),
        200,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        offsetYName,
        new NumberType(true, -2000, 2000),
        0,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        scaleXName,
        new NumberType(false, 0.01, 10),
        1,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        scaleYName,
        new NumberType(false, 0.01, 10),
        1,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputRotationName,
        new NumberType(true, -180, 180),
        0,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputPivotName,
        new EnumType(PIXI_PIVOT_OPTIONS),
        PIXI_PIVOT_OPTIONS[0].text,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputAlwaysDraw,
        new BooleanType(),
        true,
        true,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputAbsolutePositions,
        new BooleanType(),
        false,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputSkewXName,
        new NumberType(false, Math.PI / 2, Math.PI / 2),
        0,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputSkewYName,
        new NumberType(false, -Math.PI / 2, Math.PI / 2),
        0,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, injectedDataName, new ArrayType(), [], true),
      new Socket(SOCKET_TYPE.OUT, outputPixiName, new DeferredPixiType()),
    ].concat(super.getDefaultIO());
  }

  // if you are a child you likely want to use this instead of normal execute
  protected abstract drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number },
  ): void;

  private getContainer(
    inputObject: any,
    executions: { string: number },
    offset: PIXI.Point,
  ): PIXI.Container {
    const myContainer = new PIXI.Container();
    inputObject = {
      ...inputObject,
      ...inputObject[injectedDataName][
        this.getAndIncrementExecutions(executions)
      ],
    };
    this.drawOnContainer(inputObject, myContainer, executions);

    this.positionAndScale(myContainer, inputObject, offset);
    return myContainer;
  }

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
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const drawingFunction = (
      container,
      executions,
      position = new PIXI.Point(),
    ) => {
      const lastNode = !this.getOutputSocketByName(outputPixiName).hasLink();
      const drawnAsChildrenOfLastNode =
        !lastNode &&
        (executions === undefined || Object.keys(executions).length > 0);

      const newOffset = new PIXI.Point(
        drawnAsChildrenOfLastNode
          ? position.x
          : inputObject[offsetXName] + position.x,
        drawnAsChildrenOfLastNode
          ? position.y
          : inputObject[offsetYName] + position.y,
      );
      if (container) {
        container.addChild(
          this.getContainer(inputObject, executions, newOffset),
        );
      } else {
        console.error('container is undefined for some reason');
      }
    };
    outputObject[outputPixiName] = drawingFunction;
    this.handleDrawing(drawingFunction, inputObject[inputAbsolutePositions]);
    /*this.handleDrawingThrottled(
      drawingFunction,
      inputObject[inputAbsolutePositions],
    );*/
  }

  protected setOffsets(offsets: PIXI.Point) {
    this.setInputData(offsetXName, offsets.x);
    this.setInputData(offsetYName, offsets.y);
    this.executeOptimizedChain();
  }

  protected setOffsetsToCurrentCursor(
    originalCursorPos: PIXI.Point,
    originalOffsets: PIXI.Point,
  ) {
    const currPos = getCurrentCursorPosition();
    this.setOffsetsToCurrentCursor;
    const diffX = currPos.x - originalCursorPos.x;
    const diffY = currPos.y - originalCursorPos.y;
    this.setOffsets(
      new PIXI.Point(originalOffsets.x + diffX, originalOffsets.y + diffY),
    );
  }

  protected pointerDown(
    originalCursorPos: PIXI.Point,
    originalOffsets: PIXI.Point,
  ) {
    this.isDragging = true;
    PPGraph.currentGraph.selection.selectNodes([this], false, true);
    this.listenIDMove = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      () => {
        this.setOffsetsToCurrentCursor(originalCursorPos, originalOffsets);
        // re-trigger if still holding
        setTimeout(() => {
          InterfaceController.removeListener(this.listenIDMove);
          if (this.isDragging) {
            this.pointerDown(originalCursorPos, originalOffsets);
          }
        }, 16);
      },
    );

    InterfaceController.removeListener(this.listenIDUp);
    this.listenIDUp = InterfaceController.addListener(
      ListenEvent.GlobalPointerUpAndUpOutside,
      () => this.pointerUp(originalCursorPos, originalOffsets),
    );
  }

  protected pointerUp(
    originalCursorPos: PIXI.Point,
    originalOffsets: PIXI.Point,
  ) {
    const currPos = getCurrentCursorPosition();
    this.isDragging = false;
    InterfaceController.removeListener(this.listenIDMove);
    InterfaceController.removeListener(this.listenIDUp);

    const id = this.id;
    // allow undoing
    ActionHandler.performAction(
      async () =>
        (ActionHandler.getSafeNode(id) as DRAW_Base).setOffsets(
          new PIXI.Point(
            currPos.x - originalCursorPos.x,
            currPos.y - originalCursorPos.y,
          ),
        ),
      async () =>
        (ActionHandler.getSafeNode(id) as DRAW_Base).setOffsets(
          originalOffsets,
        ),
      'Move Graphics',
      false,
    );
  }

  public handleDrawingThrottled = throttle(this.handleDrawing, 16, {
    trailing: true,
    leading: false,
  });

  private handleDrawing(drawingFunction: any, absolutePosition: boolean): void {
    requestAnimationFrame(() => {
      removeAndDestroyChild(this._ForegroundRef, this.deferredGraphics);
      if (this.shouldDraw()) {
        this.deferredGraphics = new PIXI.Container();
        try {
          drawingFunction(
            this.deferredGraphics,
            {},
            new PIXI.Point(
              absolutePosition ? -this.x : 0,
              absolutePosition ? -this.y : 0,
            ),
          );
        } catch (error) {
          this.setStatus(new NodeExecutionError(error.message));
          return;
        }
        this._ForegroundRef.addChild(this.deferredGraphics);

        if (this.allowMovingDirectly()) {
          this.deferredGraphics.eventMode = 'dynamic';

          this.deferredGraphics.addEventListener('pointerdown', () => {
            this.pointerDown(
              getCurrentCursorPosition(),
              new PIXI.Point(
                this.getInputData(offsetXName),
                this.getInputData(offsetYName),
              ),
            );
          });
        }
      }
    });
  }

  protected positionAndScale(
    toModify: PIXI.DisplayObject,
    inputObject: any,
    offset: PIXI.Point,
  ): void {
    const pivot = inputObject[inputPivotName];
    const pivotPointFound = PIXI_PIVOT_OPTIONS.find(
      (option) => option.text === pivot,
    );
    const pivotPoint = pivotPointFound
      ? pivotPointFound.value
      : PIXI_PIVOT_OPTIONS[0].value;

    // get bounds with reset pivot
    toModify.pivot.x = 0;
    toModify.pivot.y = 0;
    const width = toModify.getBounds().width;
    const height = toModify.getBounds().height;

    toModify.setTransform(
      offset.x,
      offset.y,
      inputObject[scaleXName],
      inputObject[scaleYName],
      (inputObject[inputRotationName] * Math.PI) / 180,
      inputObject[inputSkewXName],
      inputObject[inputSkewYName],
      pivotPoint.x * width,
      pivotPoint.y * height,
    );
  }

  public async outputPlugged(): Promise<void> {
    await this.executeOptimizedChain();
  }
  public async outputUnplugged(): Promise<void> {
    await this.executeOptimizedChain();
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
}

export abstract class DRAW_Interactive_Base extends DRAW_Base {
  // you probably want to maintain this output in children
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, objectsInteractive, new BooleanType(), false),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.OUT,
        outputMultiplierIndex,
        new NumberType(true),
        -1,
        () => this.getInputData(objectsInteractive),
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.OUT,
        outputMultiplierInjected,
        new ArrayType(),
        [],
        () => this.getInputData(objectsInteractive),
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.OUT,
        outputMultiplierPointerDown,
        new BooleanType(),
        false,
        () => this.getInputData(objectsInteractive),
      ),
    ].concat(super.getDefaultIO());
  }
}

import * as PIXI from 'pixi.js';
import throttle from 'lodash/throttle';
import PPNode from '../../classes/NodeClass';
import PPGraph from '../../classes/GraphClass';
import Socket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import {
  NODE_TYPE_COLOR,
  PIXI_PIVOT_OPTIONS,
  SOCKET_TYPE,
} from '../../utils/constants';
import { ArrayType } from '../datatypes/arrayType';
import { BooleanType } from '../datatypes/booleanType';
import { ColorType } from '../datatypes/colorType';
import { DeferredPixiType } from '../datatypes/deferredPixiType';
import { EnumType } from '../datatypes/enumType';
import { NumberType } from '../datatypes/numberType';
import { TwoDVectorType } from '../datatypes/twoDVectorType';
import { TRgba } from '../../utils/interfaces';
import {
  getCurrentCursorPosition,
  parseValueAndAttachWarnings,
} from '../../utils/utils';
import { removeAndDestroyChild } from '../../pixi/utils-pixi';
import { ActionHandler } from '../../utils/actionHandler';
import InterfaceController, { ListenEvent } from '../../InterfaceController';
import { NodeExecutionError } from '../../classes/ErrorClass';

export const marginSocketName = 'Margin';
export const bgColorName = 'Background color';
export const offsetName = 'Offset';
export const scaleName = 'Scale';
export const inputRotationName = 'Angle';
export const inputPivotName = 'Pivot';
export const inputAlwaysDraw = 'Always Draw';
export const injectedDataName = 'Injected Data';
export const outputPixiName = 'Graphics';

export const outputMultiplierIndex = 'LastPressedIndex';
export const outputMultiplierInjected = 'LastPressedInjected';
export const outputMultiplierPointerDown = 'PointerDown';

export const objectsInteractive = 'Clickable objects';

const defaultBgColor = new TRgba(0, 0, 0, 0);

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

  public reactsToCombineDrawKeyBinding(): boolean {
    return true;
  }

  // you probably want to maintain this output in children
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, bgColorName, new ColorType(), defaultBgColor),
      new Socket(
        SOCKET_TYPE.IN,
        marginSocketName,
        new NumberType(true, 0, 100),
        0,
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
        inputRotationName,
        new NumberType(true, -180, 180),
        0,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        scaleName,
        new TwoDVectorType(),
        { x: 1, y: 1 },
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        offsetName,
        new TwoDVectorType(),
        { x: 200, y: 0 },
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputAlwaysDraw,
        new BooleanType(),
        false,
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
    myContainer.name = `${this.id}-container`;
    inputObject = {
      ...inputObject,
      ...inputObject[injectedDataName][
        this.getAndIncrementExecutions(executions)
      ],
    };
    this.drawOnContainer(inputObject, myContainer, executions);

    this.positionScaleAndBackground(myContainer, inputObject, offset);

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

      const offset = inputObject[offsetName];
      const newOffset = drawnAsChildrenOfLastNode
        ? new PIXI.Point(position.x, position.y)
        : new PIXI.Point(offset.x + position.x, offset.y + position.y);
      if (container) {
        container.addChild(
          this.getContainer(inputObject, executions, newOffset),
        );
      } else {
        console.error('container is undefined for some reason');
      }
    };
    outputObject[outputPixiName] = drawingFunction;
    this.handleDrawing(drawingFunction);
    /*this.handleDrawingThrottled(
      drawingFunction,
    );*/
  }

  protected setOffsets(offsets: PIXI.Point) {
    this.setInputData(offsetName, { x: offsets.x, y: offsets.y });
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

  private handleDrawing(drawingFunction: any): void {
    requestAnimationFrame(() => {
      removeAndDestroyChild(this._ForegroundRef, this.deferredGraphics);
      if (this.shouldDraw()) {
        this.deferredGraphics = new PIXI.Container();
        try {
          drawingFunction(this.deferredGraphics, {}, new PIXI.Point(0, 0));
        } catch (error) {
          this.setStatus(new NodeExecutionError(error.message));
          return;
        }
        this._ForegroundRef.addChild(this.deferredGraphics);

        if (this.allowMovingDirectly()) {
          this.deferredGraphics.eventMode = 'dynamic';

          const offset = this.getInputData(offsetName);
          this.deferredGraphics.addEventListener('pointerdown', () => {
            this.pointerDown(
              getCurrentCursorPosition(),
              new PIXI.Point(offset.x, offset.y),
            );
          });
        }
      }
    });
  }

  protected positionScaleAndBackground(
    toModify: PIXI.Container,
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

    const margin = {
      top: inputObject[marginSocketName],
      right: inputObject[marginSocketName],
      bottom: inputObject[marginSocketName],
      left: inputObject[marginSocketName],
    };

    // get bounds with reset pivot
    toModify.pivot.x = 0;
    toModify.pivot.y = 0;
    const myContainerBounds = toModify.getBounds();
    const width = myContainerBounds.width + margin.left + margin.right;
    const height = myContainerBounds.height + margin.top + margin.bottom;

    toModify.setTransform(
      offset.x,
      offset.y,
      inputObject[scaleName].x,
      inputObject[scaleName].y,
      (inputObject[inputRotationName] * Math.PI) / 180,
      0,
      0,
      pivotPoint.x * width - margin.left + myContainerBounds.x,
      pivotPoint.y * height - margin.top + myContainerBounds.y,
    );

    const bgColor = parseValueAndAttachWarnings(
      this,
      new ColorType(),
      inputObject[bgColorName],
    );
    const hasMarginOrBackground =
      inputObject[marginSocketName] > 0 || bgColor.alpha() > 0;
    if (hasMarginOrBackground) {
      const background = new PIXI.Graphics();
      background.beginFill(bgColor.hex(), bgColor.alpha(true));
      background.drawRect(
        -margin.left + myContainerBounds.x,
        -margin.top + myContainerBounds.y,
        myContainerBounds.width + margin.left + margin.right,
        myContainerBounds.height + margin.top + margin.bottom,
      );
      background.endFill();
      toModify.addChildAt(background, 0);
    }
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

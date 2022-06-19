/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import _ from 'lodash-contrib';

import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import {
  COLOR,
  COMPARISON_OPTIONS,
  CONDITION_OPTIONS,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../utils/constants';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { compare, getMethods, isVariable } from '../utils/utils';
import { NumberType } from './datatypes/numberType';
import { AnyType } from './datatypes/anyType';
import { TriggerType } from './datatypes/triggerType';
import { ColorType } from './datatypes/colorType';
import { StringType } from './datatypes/stringType';
import { EnumType } from './datatypes/enumType';
import { BooleanType } from './datatypes/booleanType';

export class Placeholder extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.MISSING);
  }

  getCanAddInput(): boolean {
    return true;
  }

  getCanAddOutput(): boolean {
    return true;
  }
}

export class Mouse extends PPNode {
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onViewportZoomedHandler: (event?: PIXI.InteractionEvent) => void;
  onViewportZoomed = (event: PIXI.InteractionEvent): void => {
    const scale = (event as any).viewport.scale.x;
    this.setOutputData('scale', scale);
  };
  onViewportMove = (event: PIXI.InteractionEvent): void => {
    const screen = event.data.global;
    const world = PPGraph.currentGraph.viewport.toWorld(screen.x, screen.y);
    const buttons = event.data.buttons;
    this.setOutputData('screen-x', screen.x);
    this.setOutputData('screen-y', screen.y);
    this.setOutputData('world-x', world.x);
    this.setOutputData('world-y', world.y);
    this.setOutputData('buttons', buttons);
  };

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  public getName(): string {
    return 'Mouse';
  }

  public getDescription(): string {
    return 'Get mouse coordinates';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'screen-x', new NumberType()),
      new PPSocket(SOCKET_TYPE.OUT, 'screen-y', new NumberType()),
      new PPSocket(SOCKET_TYPE.OUT, 'world-x', new NumberType()),
      new PPSocket(SOCKET_TYPE.OUT, 'world-y', new NumberType()),
      new PPSocket(SOCKET_TYPE.OUT, 'scale', new NumberType()),
      new PPSocket(SOCKET_TYPE.OUT, 'buttons', new NumberType()),
    ].concat(super.getDefaultIO());
  }

  onNodeAdded = (): void => {
    // add event listener
    this.onViewportMoveHandler = this.onViewportMove.bind(this);
    PPGraph.currentGraph.viewport.on(
      'pointermove',
      (this as any).onViewportMoveHandler
    );

    this.onViewportZoomedHandler = this.onViewportZoomed.bind(this);
    PPGraph.currentGraph.viewport.on(
      'zoomed',
      (this as any).onViewportZoomedHandler
    );
  };

  onNodeRemoved = (): void => {
    PPGraph.currentGraph.viewport.removeListener(
      'pointermove',
      (this as any).onViewportMoveHandler
    );
    PPGraph.currentGraph.viewport.removeListener(
      'zoomed',
      (this as any).onViewportZoomedHandler
    );
  };
}

export class Keyboard extends PPNode {
  onKeyDownHandler: (event?: KeyboardEvent) => void = () => {};
  onKeyUpHandler: (event?: KeyboardEvent) => void = () => {};
  _onKeyDown = (event: KeyboardEvent): void => {
    this.setOutputData('key', event.key);
    this.setOutputData('code', event.code);
    this.setOutputData('shiftKey', event.shiftKey);
    this.setOutputData('ctrlKey', event.ctrlKey);
    this.setOutputData('altKey', event.altKey);
    this.setOutputData('metaKey', event.metaKey);
    this.setOutputData('repeat', event.repeat);
    this.executeChildren();
  };
  _onKeyUp = (): void => {
    if (!this.getInputData('keep last')) {
      this.setOutputData('key', '');
      this.setOutputData('code', '');
      this.setOutputData('shiftKey', false);
      this.setOutputData('ctrlKey', false);
      this.setOutputData('altKey', false);
      this.setOutputData('metaKey', false);
      this.setOutputData('repeat', false);
      this.executeChildren();
    }
  };

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  public getName(): string {
    return 'Keyboard';
  }

  public getDescription(): string {
    return 'Get keyboard input';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'key', new StringType()),
      new PPSocket(SOCKET_TYPE.OUT, 'code', new StringType()),
      new PPSocket(SOCKET_TYPE.OUT, 'shiftKey', new BooleanType()),
      new PPSocket(SOCKET_TYPE.OUT, 'ctrlKey', new BooleanType()),
      new PPSocket(SOCKET_TYPE.OUT, 'altKey', new BooleanType()),
      new PPSocket(SOCKET_TYPE.OUT, 'metaKey', new BooleanType()),
      new PPSocket(SOCKET_TYPE.OUT, 'repeat', new BooleanType()),
      new PPSocket(
        SOCKET_TYPE.IN,
        'keep last',
        new BooleanType(),
        false,
        false
      ),
    ].concat(super.getDefaultIO());
  }

  onNodeAdded = (): void => {
    // add event listener
    this.onKeyDownHandler = this._onKeyDown.bind(this);
    window.addEventListener('keydown', (this as any).onKeyDownHandler);
    this.onKeyUpHandler = this._onKeyUp.bind(this);
    window.addEventListener('keyup', (this as any).onKeyUpHandler);
  };

  onNodeRemoved = (): void => {
    window.removeEventListener('keydown', this.onKeyDownHandler);
    window.removeEventListener('keyup', this.onKeyUpHandler);
  };
}

export class GridCoordinates extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.onExecute = async function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const count = input['count'];
      const column = Math.abs(input['column']);
      const distanceWidth = Math.abs(input['distanceWidth']);
      const distanceHeight = Math.abs(input['distanceHeight']);
      const xArray = [];
      const yArray = [];
      for (let indexCount = 0; indexCount < count; indexCount++) {
        xArray.push(x + distanceWidth * (indexCount % column));
        yArray.push(y + distanceHeight * Math.floor(indexCount / column));
      }
      output['x-array'] = xArray;
      output['y-array'] = yArray;
    };
  }

  public getName(): string {
    return 'Grid coordinates';
  }

  public getDescription(): string {
    return 'Create grid coordinates';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'x-array', new AnyType()),
      new PPSocket(SOCKET_TYPE.OUT, 'y-array', new AnyType()),
      new PPSocket(SOCKET_TYPE.IN, 'x', new NumberType(), 0, false),
      new PPSocket(SOCKET_TYPE.IN, 'y', new NumberType(), 0, false),
      new PPSocket(SOCKET_TYPE.IN, 'count', new NumberType(true), 9, false),
      new PPSocket(SOCKET_TYPE.IN, 'column', new NumberType(true), 3, false),
      new PPSocket(
        SOCKET_TYPE.IN,
        'distanceWidth',
        new NumberType(),
        110.0,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'distanceHeight',
        new NumberType(),
        110.0,
        false
      ),
    ].concat(super.getDefaultIO());
  }
}

export class ColorArray extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.onExecute = async function (input, output) {
      const count = input['count'];
      const colorA: TRgba = input['colorA'];
      const colorB: TRgba = input['colorB'];
      const colorArray = [];
      for (let indexCount = 0; indexCount < count; indexCount++) {
        const blendFactor = count <= 1 ? 0 : indexCount / (count - 1);
        colorArray.push(colorA.mix(colorB, blendFactor));
      }
      output['color-array'] = colorArray;
    };
  }

  public getName(): string {
    return 'Color array';
  }

  public getDescription(): string {
    return 'Create color array';
  }

  protected getDefaultIO(): PPSocket[] {
    const colorA: TRgba = TRgba.fromString(COLOR[5]);
    const colorB: TRgba = TRgba.fromString(COLOR[15]);
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'color-array', new AnyType()),
      new PPSocket(SOCKET_TYPE.IN, 'count', new NumberType(true), 9, false),
      new PPSocket(SOCKET_TYPE.IN, 'colorA', new ColorType(), colorA, false),
      new PPSocket(SOCKET_TYPE.IN, 'colorB', new ColorType(), colorB, false),
    ].concat(super.getDefaultIO());
  }
}

export class RangeArray extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.onExecute = async function (input, output) {
      const start = input['start'] || 0;
      const stop = input['stop'] || 100;
      const step = input['step'] || 2;
      output['output array'] = Array.from(
        { length: (stop - start) / step + 1 },
        (_, i) => start + i * step
      );
    };
  }

  public getName(): string {
    return 'Range array';
  }

  public getDescription(): string {
    return 'Create range array';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'output array', new AnyType()),
      new PPSocket(SOCKET_TYPE.IN, 'start', new NumberType()),
      new PPSocket(SOCKET_TYPE.IN, 'stop', new NumberType()),
      new PPSocket(SOCKET_TYPE.IN, 'step', new NumberType()),
    ].concat(super.getDefaultIO());
  }
}

export class RandomArray extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
  }

  public getName(): string {
    return 'Random array';
  }

  public getDescription(): string {
    return 'Create random array';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'output array', new AnyType()),
      new PPSocket(
        SOCKET_TYPE.IN,
        'trigger',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].value, 'trigger'),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'length',
        new NumberType(true, 1),
        20,
        undefined
      ),
      new PPSocket(SOCKET_TYPE.IN, 'min', new NumberType(), 0),
      new PPSocket(SOCKET_TYPE.IN, 'max', new NumberType(), 1),
    ].concat(super.getDefaultIO());
  }

  trigger(): void {
    const length = this.getInputData('length');
    const min = this.getInputData('min');
    const max = this.getInputData('max');
    const randomArray = Array.from({ length: length }, () => {
      return Math.floor(Math.random() * (max - min) + min);
    });
    this.setOutputData('output array', randomArray);
  }
}

export class DateAndTime extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.onExecute = async function (input, output) {
      const dateMethod = input['Date method'];
      output['date and time'] = new Date()[dateMethod]();
    };
  }

  public getName(): string {
    return 'Date and time';
  }

  public getDescription(): string {
    return 'Outputs current time in different formats';
  }

  protected getDefaultIO(): PPSocket[] {
    const dateMethodsArray = getMethods(new Date());
    const dateMethodsArrayOptions = dateMethodsArray
      .filter((methodName) => {
        // do not expose constructor and setters
        const shouldExposeMethod = !(
          methodName === 'constructor' || methodName.startsWith('set')
        );
        return shouldExposeMethod;
      })
      .sort()
      .map((methodName) => {
        return {
          text: methodName,
          value: methodName,
        };
      });

    return [
      new PPSocket(SOCKET_TYPE.OUT, 'date and time', new StringType()),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Date method',
        new EnumType(dateMethodsArrayOptions),
        'toUTCString',
        false
      ),
    ].concat(super.getDefaultIO());
  }
}

export class If_Else extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  public getName(): string {
    return 'If else condition';
  }

  public getDescription(): string {
    return 'Passes through input A or B based on a condition';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, 'Condition', new AnyType(), 0),
      new PPSocket(SOCKET_TYPE.IN, 'A', new AnyType(), 'A'),
      new PPSocket(SOCKET_TYPE.IN, 'B', new AnyType(), 'B'),
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new AnyType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const condition = _.truthy(inputObject['Condition']);
    if (condition) {
      outputObject['Output'] = inputObject['A'];
    } else {
      outputObject['Output'] = inputObject['B'];
    }
  }
}

export class Comparison extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
  }

  public getName(): string {
    return 'Compare';
  }

  public getDescription(): string {
    return 'Compares two values (greater, less, equal, logical)';
  }

  protected getDefaultIO(): PPSocket[] {
    const onOptionChange = (value) => {
      this.nodeName = value;
    };

    return [
      new PPSocket(SOCKET_TYPE.IN, 'A', new AnyType(), 0),
      new PPSocket(SOCKET_TYPE.IN, 'B', new AnyType(), 1),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Operator',
        new EnumType(COMPARISON_OPTIONS, onOptionChange),
        COMPARISON_OPTIONS[0].text,
        false
      ),
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new BooleanType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputA = inputObject['A'];
    const inputB = inputObject['B'];
    const operator = inputObject['Operator'];
    outputObject['Output'] = compare(inputA, operator, inputB);
  }
}

export class IsValid extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }
  public getName(): string {
    return 'IsValid';
  }

  public getDescription(): string {
    return 'Check if an input is valid (undefined, null)';
  }

  protected getDefaultIO(): PPSocket[] {
    const onOptionChange = (value) => {
      this.nodeName = value;
    };

    return [
      new PPSocket(SOCKET_TYPE.IN, 'A', new AnyType(), 0),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Condition',
        new EnumType(CONDITION_OPTIONS, onOptionChange),
        CONDITION_OPTIONS[0].text,
        false
      ),
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new BooleanType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputA = inputObject['A'];
    const condition = inputObject['Condition'];
    outputObject['Output'] = isVariable(inputA, condition);
  }
}

/* eslint-disable */

import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import UpdateBehaviourClass from '../classes/UpdateBehaviourClass';
import {
  COLOR,
  COMPARISON_OPTIONS,
  CONDITION_OPTIONS,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../utils/constants';
import { CustomArgs, TNodeSource, TRgba } from '../utils/interfaces';
import {
  compare,
  getCurrentButtons,
  getCurrentCursorPosition,
  getMethods,
  isVariable,
} from '../utils/utils';
import { NumberType } from './datatypes/numberType';
import { AnyType } from './datatypes/anyType';
import { ArrayType } from './datatypes/arrayType';
import { ColorType } from './datatypes/colorType';
import { StringType } from './datatypes/stringType';
import { EnumType } from './datatypes/enumType';
import { BooleanType } from './datatypes/booleanType';

export class Placeholder extends PPNode {
  public getName(): string {
    return 'Placeholder';
  }

  public getDescription(): string {
    return 'Adds a placeholder node';
  }

  public getTags(): string[] {
    return ['Playground'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.MISSING);
  }

  getCanAddInput(): boolean {
    return true;
  }
}

export class Mouse extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  public getName(): string {
    return 'Mouse';
  }

  public getDescription(): string {
    return 'Gets mouse coordinates';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
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

  public onExecute = async function () {
    this.setOutputData('scale', PPGraph.currentGraph.viewportScaleX);
    const worldPosition = getCurrentCursorPosition();
    const screenPosition = PPGraph.currentGraph.viewport.toScreen(
      worldPosition.x,
      worldPosition.y,
    );
    this.setOutputData('screen-x', Math.round(screenPosition.x));
    this.setOutputData('screen-y', Math.round(screenPosition.y));
    this.setOutputData('world-x', worldPosition.x);
    this.setOutputData('world-y', worldPosition.y);
    this.setOutputData('buttons', getCurrentButtons());
  };
}

export class Keyboard extends PPNode {
  onKeyDownHandler: (event?: KeyboardEvent) => void = () => {};
  onKeyUpHandler: (event?: KeyboardEvent) => void = () => {};
  onKeyDown = (event: KeyboardEvent): void => {
    this.setOutputData('key', event.key);
    this.setOutputData('code', event.code);
    this.setOutputData('shiftKey', event.shiftKey);
    this.setOutputData('ctrlKey', event.ctrlKey);
    this.setOutputData('altKey', event.altKey);
    this.setOutputData('metaKey', event.metaKey);
    this.setOutputData('repeat', event.repeat);
    this.executeChildren();
  };
  onKeyUp = (): void => {
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

  public getName(): string {
    return 'Keyboard';
  }

  public getDescription(): string {
    return 'Get keyboard input';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
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
        false,
      ),
    ].concat(super.getDefaultIO());
  }
  public async onNodeAdded(source: TNodeSource): Promise<void> {
    await super.onNodeAdded(source);
    // add event listener
    this.onKeyDownHandler = this.onKeyDown.bind(this);
    window.addEventListener('keydown', (this as any).onKeyDownHandler);
    this.onKeyUpHandler = this.onKeyUp.bind(this);
    window.addEventListener('keyup', (this as any).onKeyUpHandler);
  }

  onNodeRemoved = (): void => {
    window.removeEventListener('keydown', this.onKeyDownHandler);
    window.removeEventListener('keyup', this.onKeyUpHandler);
  };
}

export class GridCoordinates extends PPNode {
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

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'x-array', new ArrayType()),
      new PPSocket(SOCKET_TYPE.OUT, 'y-array', new ArrayType()),
      new PPSocket(SOCKET_TYPE.IN, 'x', new NumberType(), 0, false),
      new PPSocket(SOCKET_TYPE.IN, 'y', new NumberType(), 0, false),
      new PPSocket(SOCKET_TYPE.IN, 'count', new NumberType(true), 9, false),
      new PPSocket(SOCKET_TYPE.IN, 'column', new NumberType(true), 3, false),
      new PPSocket(
        SOCKET_TYPE.IN,
        'distanceWidth',
        new NumberType(),
        110.0,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'distanceHeight',
        new NumberType(),
        110.0,
        false,
      ),
    ].concat(super.getDefaultIO());
  }
}

export class ColorArray extends PPNode {
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

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    const colorA: TRgba = TRgba.fromString(COLOR[5]);
    const colorB: TRgba = TRgba.fromString(COLOR[15]);
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'color-array', new ArrayType()),
      new PPSocket(SOCKET_TYPE.IN, 'count', new NumberType(true), 9, false),
      new PPSocket(SOCKET_TYPE.IN, 'colorA', new ColorType(), colorA, false),
      new PPSocket(SOCKET_TYPE.IN, 'colorB', new ColorType(), colorB, false),
    ].concat(super.getDefaultIO());
  }
}

export class RangeArray extends PPNode {
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
        (_, i) => start + i * step,
      );
    };
  }

  public getName(): string {
    return 'Range array';
  }

  public getDescription(): string {
    return 'Creates an array of a number range';
  }

  public getTags(): string[] {
    return ['Array'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'output array', new ArrayType()),
      new PPSocket(SOCKET_TYPE.IN, 'start', new NumberType(true), 0),
      new PPSocket(SOCKET_TYPE.IN, 'stop', new NumberType(true), 100),
      new PPSocket(SOCKET_TYPE.IN, 'step', new NumberType(true, 1), 10),
    ].concat(super.getDefaultIO());
  }
}

export class RandomArray extends PPNode {
  public getName(): string {
    return 'Random array';
  }

  public getDescription(): string {
    return 'Creates an array with random numbers';
  }

  public getTags(): string[] {
    return ['Array'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 10000, this);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'output array', new ArrayType()),
      new PPSocket(SOCKET_TYPE.IN, 'length', new NumberType(true, 1), 20),
      new PPSocket(SOCKET_TYPE.IN, 'min', new NumberType(true), 0),
      new PPSocket(SOCKET_TYPE.IN, 'max', new NumberType(true), 100),
    ].concat(super.getDefaultIO());
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const length = inputObject['length'];
    const min = inputObject['min'];
    const max = inputObject['max'];
    const randomArray = Array.from({ length: length }, () => {
      return Math.floor(Math.random() * (max - min) + min);
    });
    outputObject['output array'] = randomArray;
  }
}

export class DateAndTime extends PPNode {
  public getName(): string {
    return 'Date and time';
  }

  public getDescription(): string {
    return 'Outputs time in different formats';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
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
        };
      });

    return [
      new PPSocket(SOCKET_TYPE.OUT, 'Date and time', new StringType()),
      new PPSocket(SOCKET_TYPE.IN, 'Date string', new StringType(), '', false),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Date method',
        new EnumType(dateMethodsArrayOptions),
        'toUTCString',
        false,
      ),
    ].concat(super.getDefaultIO());
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const dateString = inputObject['Date string'];
    const dateMethod = inputObject['Date method'];
    const dateObject = dateString === '' ? new Date() : new Date(dateString);
    outputObject['Date and time'] = dateObject[dateMethod]();
  }
}

export class If_Else extends PPNode {
  public getName(): string {
    return 'If else condition';
  }

  public getDescription(): string {
    return 'Passes through input A or B based on a condition';
  }

  public getTags(): string[] {
    return ['Logic'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, 'Condition', new BooleanType(), false),
      new PPSocket(SOCKET_TYPE.IN, 'A', new AnyType(), 'A'),
      new PPSocket(SOCKET_TYPE.IN, 'B', new AnyType(), 'B'),
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new AnyType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const condition = inputObject['Condition'];
    if (condition) {
      outputObject['Output'] = inputObject['A'];
    } else {
      outputObject['Output'] = inputObject['B'];
    }
  }
}

export class Comparison extends PPNode {
  public getName(): string {
    return 'Compare';
  }

  public getDescription(): string {
    return 'Compares two values (greater, less, equal, logical)';
  }

  public getTags(): string[] {
    return ['Logic'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
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
        COMPARISON_OPTIONS[0].value,
        false,
      ),
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new BooleanType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const inputA = inputObject['A'];
    const inputB = inputObject['B'];
    const operator = inputObject['Operator'];
    outputObject['Output'] = compare(inputA, operator, inputB);
  }
}

export class IsValid extends PPNode {
  public getName(): string {
    return 'IsValid';
  }

  public getDescription(): string {
    return 'Check if an input is valid (undefined, null)';
  }

  public getTags(): string[] {
    return ['Logic'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
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
        false,
      ),
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new BooleanType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const inputA = inputObject['A'];
    const condition = inputObject['Condition'];
    outputObject['Output'] = isVariable(inputA, condition);
  }
}

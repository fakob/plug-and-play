import PPNode from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import {
  COLOR_MAIN,
  NODE_CORNERRADIUS,
  NODE_MARGIN,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
} from '../utils/constants';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { NumberType } from './datatypes/numberType';
import { EnumType } from './datatypes/enumType';
import { CustomFunction } from './data/dataFunctions';
import { AbstractType } from './datatypes/abstractType';
import * as PIXI from 'pixi.js';
import { TextStyle } from 'pixi.js';
import { DynamicInputNode } from './abstract/DynamicInputNode';

const addendName = 'Addend';
const factorName = 'Factor';
const addedOutputName = 'Added';
const subtractedOutputName = 'Subtracted';
const dividedOutputName = 'Divided';
const multipliedOutputName = 'Multiplied';
const remainderOutputName = 'Remainder';
const squareRootOutputName = 'Root';
const singleNumberName = 'Number';
const number1Name = 'Number 1';
const number2Name = 'Number 2';

export class MathFunction extends PPNode {
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    const staticProperties = [
      'E',
      'LN10',
      'LN2',
      'LOG2E',
      'LOG10E',
      'PI',
      'SQRT1_2',
      'SQRT2',
    ];
    const staticMethodsWith0Parameters = ['random'];
    const staticMethodsWith2Parameters = [
      'atan2',
      'hypot',
      'max',
      'min',
      'imul',
      'pow',
    ];

    this.onExecute = async function (input) {
      const mathOption = input['Option'];
      if (staticProperties.includes(mathOption)) {
        // check for properties
        this.setOutputData('Output', Math[mathOption]);
      } else if (staticMethodsWith0Parameters.includes(mathOption)) {
        // check for staticMethodsWith0Parameters
        this.setOutputData('Output', Math[mathOption]());
      } else if (staticMethodsWith2Parameters.includes(mathOption)) {
        // check for staticMethodsWith2Parameters
        this.setOutputData(
          'Output',
          Math[mathOption](input['Input'], input['Input2']),
        );
      } else {
        this.setOutputData('Output', Math[mathOption](input['Input']));
      }
    };
  }

  public getName(): string {
    return 'Math function';
  }

  public getDescription(): string {
    return 'Perform mathematical operations or get constants';
  }

  public getTags(): string[] {
    return ['Math'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  protected getDefaultIO(): Socket[] {
    const onOptionChange = (value) => {
      this.setNodeName('Math.' + value);
    };
    const math = Object.getOwnPropertyNames(Math);
    const mathOptions = math.map((methodName) => {
      return {
        text: methodName,
      };
    });
    console.log(mathOptions);

    return [
      new Socket(
        SOCKET_TYPE.IN,
        'Input',
        new NumberType(false, -10, 10),
        0,
        true,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Input2',
        new NumberType(false, -10, 10),
        0,
        true,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Option',
        new EnumType(mathOptions, (value) => onOptionChange(value)),
        'abs',
        false,
      ),
      new Socket(SOCKET_TYPE.OUT, 'Output', new NumberType()),
    ];
  }
}
export class Add extends DynamicInputNode {
  public getName(): string {
    return 'Add (+)';
  }

  public getDescription(): string {
    return 'Adds numbers';
  }

  public hasExample(): boolean {
    return true;
  }
  public getNewInputSocketName() {
    return super.getNewInputSocketName('Addend');
  }

  public getAllNonDefaultInputSockets() {
    return this.getAllInputSockets().filter((socket) => socket.name !== 'Meta');
  }

  protected async onExecute(input, output): Promise<void> {
    output[addedOutputName] = this.getAllNonDefaultInputSockets().reduce(
      (prevValue, socket) => socket.data + prevValue,
      0,
    );
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, addendName, new NumberType(), 0),
      new Socket(SOCKET_TYPE.IN, addendName + ' 2', new NumberType(), 0),
      new Socket(SOCKET_TYPE.OUT, addedOutputName, new NumberType()),
    ].concat(super.getDefaultIO());
  }

  public getTags(): string[] {
    return ['Math', '+'].concat(super.getTags());
  }
}

export class Subtract extends PPNode {
  public getName(): string {
    return 'Subtract (-)';
  }

  public getDescription(): string {
    return 'Subtracts one number from another';
  }

  public hasExample(): boolean {
    return true;
  }

  protected async onExecute(input, output): Promise<void> {
    output[subtractedOutputName] = input[number1Name] - input[number2Name];
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, number1Name, new NumberType()),
      new Socket(SOCKET_TYPE.IN, number2Name, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, subtractedOutputName, new NumberType()),
    ].concat(super.getDefaultIO());
  }

  public getTags(): string[] {
    return ['Math', '-'].concat(super.getTags());
  }
}

export class Multiply extends DynamicInputNode {
  public getName(): string {
    return 'Multiply (*)';
  }

  public getDescription(): string {
    return 'Multiplies numbers';
  }
  public getNewInputSocketName() {
    return super.getNewInputSocketName('Factor');
  }

  public hasExample(): boolean {
    return true;
  }

  public getAllNonDefaultInputSockets() {
    return this.getAllInputSockets().filter((socket) => socket.name !== 'Meta');
  }

  protected async onExecute(input, output): Promise<void> {
    output[multipliedOutputName] = this.getAllNonDefaultInputSockets().reduce(
      (prevValue, socket) => socket.data * prevValue,
      1,
    );
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, factorName, new NumberType(), 1),
      new Socket(SOCKET_TYPE.IN, factorName + ' 2', new NumberType(), 1),
      new Socket(SOCKET_TYPE.OUT, multipliedOutputName, new NumberType()),
    ].concat(super.getDefaultIO());
  }

  public getTags(): string[] {
    return ['Math', '+'].concat(super.getTags());
  }
}

export class Divide extends PPNode {
  public getName(): string {
    return 'Divide (/)';
  }

  public getDescription(): string {
    return 'Divides one number by another';
  }

  public hasExample(): boolean {
    return true;
  }

  protected async onExecute(input, output): Promise<void> {
    output[dividedOutputName] = input[number1Name] / input[number2Name];
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, number1Name, new NumberType()),
      new Socket(SOCKET_TYPE.IN, number2Name, new NumberType(), 1),
      new Socket(SOCKET_TYPE.OUT, dividedOutputName, new NumberType()),
    ].concat(super.getDefaultIO());
  }

  public getTags(): string[] {
    return ['Math', '/'].concat(super.getTags());
  }
}

export class Remainder extends PPNode {
  public getName(): string {
    return 'Remainder (%)';
  }

  public getDescription(): string {
    return 'The remainder of one number divided by another';
  }

  public hasExample(): boolean {
    return true;
  }

  protected async onExecute(input, output): Promise<void> {
    output[remainderOutputName] = input[number1Name] % input[number2Name];
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, number1Name, new NumberType()),
      new Socket(SOCKET_TYPE.IN, number2Name, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, remainderOutputName, new NumberType()),
    ].concat(super.getDefaultIO());
  }

  public getTags(): string[] {
    return ['Math', '%'].concat(super.getTags());
  }
}

export class Sqrt extends PPNode {
  public getName(): string {
    return 'Square root';
  }

  public getDescription(): string {
    return 'The square root of a number';
  }

  public hasExample(): boolean {
    return true;
  }

  protected async onExecute(input, output): Promise<void> {
    output[squareRootOutputName] = Math.sqrt(input[singleNumberName]);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, singleNumberName, new NumberType(), 1),
      new Socket(SOCKET_TYPE.OUT, squareRootOutputName, new NumberType()),
    ].concat(super.getDefaultIO());
  }

  public getTags(): string[] {
    return ['Math', '√', 'sqrt'].concat(super.getTags());
  }
}

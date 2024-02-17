import PPNode from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../utils/constants';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { NumberType } from './datatypes/numberType';
import { EnumType } from './datatypes/enumType';
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

const inputOptionName = 'Option';
const parameterName1 = 'Input';
const parameterName2 = 'Input2';
const outputName = 'Output';

export class MathFunction extends PPNode {
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.onExecute = async function (input) {
      const mathOption = input[inputOptionName];
      const parameterCount = Math[mathOption].length;
      switch (parameterCount) {
        case 0:
          this.setOutputData(outputName, Math[mathOption]());
          break;
        case 1:
          this.setOutputData(
            outputName,
            Math[mathOption](input[parameterName1]),
          );
          break;
        case 2:
          this.setOutputData(
            outputName,
            Math[mathOption](input[parameterName1], input[parameterName2]),
          );
          break;
        default:
          this.setOutputData(outputName, Math[mathOption]);
          break;
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

    return [
      new Socket(
        SOCKET_TYPE.IN,
        parameterName1,
        new NumberType(false, -10, 10),
        0,
        true,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        parameterName2,
        new NumberType(false, -10, 10),
        0,
        true,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputOptionName,
        new EnumType(mathOptions, (value) => onOptionChange(value)),
        'abs',
        false,
      ),
      new Socket(SOCKET_TYPE.OUT, outputName, new NumberType()),
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

  protected async onExecute(input, output): Promise<void> {
    output[addedOutputName] = this.getAllInterestingInputSockets().reduce(
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

  protected async onExecute(input, output): Promise<void> {
    output[multipliedOutputName] = this.getAllInterestingInputSockets().reduce(
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

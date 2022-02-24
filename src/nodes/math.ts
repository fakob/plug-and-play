import PPGraph from '../classes/GraphClass';
import { PureNode } from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../utils/constants';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { NumberType } from './datatypes/numberType';
import { EnumType } from './datatypes/enumType';

export class MathFunction extends PureNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = 'Math function';
    this.description = 'Mathematical constants and functions';

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
    const staticMethodsWith2Parameters = ['atan2', 'imul', 'pow'];

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
          Math[mathOption](input['Input'], input['Input2'])
        );
      } else {
        this.setOutputData('Output', Math[mathOption](input['Input']));
      }
    };
  }

  protected getDefaultIO(): Socket[] {
    const onOptionChange = (value) => {
      this.nodeName = 'Math.' + value;
    };
    const math = Object.getOwnPropertyNames(Math);
    const mathOptions = math.map((methodName) => {
      return {
        text: methodName,
        value: methodName,
      };
    });

    return [
      new Socket(
        SOCKET_TYPE.IN,
        'Input',
        new NumberType(false, -10, 10),
        0,
        true
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Input2',
        new NumberType(false, -10, 10),
        0,
        true
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Option',
        new EnumType(mathOptions, onOptionChange),
        'abs',
        false
      ),
      new Socket(SOCKET_TYPE.OUT, 'Output', new NumberType()),
    ];
  }
}

class SimpleMathOperation extends PureNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = this.getName();
    this.description = this.getDescription();
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const a = inputObject['Input'];
    const b = inputObject['Input 2'];
    const result = this.getOperation(a, b);
    outputObject['Output'] = result;
  }

  protected getDefaultIO(): Socket[] {
    return [
      this.getInput1(),
      this.getInput2(),
      new Socket(SOCKET_TYPE.OUT, 'Output', new NumberType()),
    ];
  }

  protected getInput1(): Socket {
    return new Socket(
      SOCKET_TYPE.IN,
      'Input',
      new NumberType(false, -10, 10),
      0,
      true
    );
  }
  protected getInput2(): Socket {
    return new Socket(
      SOCKET_TYPE.IN,
      'Input 2',
      new NumberType(false, -10, 10),
      0,
      true
    );
  }
  protected getName(): string {
    return 'MathOperation';
  }
  protected getDescription(): string {
    return 'Does a math operation to two numbers or strings';
  }

  protected getOperation(a: any, b: any): any {
    return a;
  }
}

export class Add extends SimpleMathOperation {
  protected getName(): string {
    return 'Add';
  }
  protected getDescription(): string {
    return 'Adds 2 numbers or strings';
  }
  protected getOperation(a: any, b: any): any {
    return a + b;
  }
}

export class Subtract extends SimpleMathOperation {
  protected getName(): string {
    return 'Subtract';
  }
  protected getDescription(): string {
    return 'Subtracts 2 numbers';
  }
  protected getOperation(a: any, b: any): any {
    return a - b;
  }
}

export class Multiply extends SimpleMathOperation {
  protected getName(): string {
    return 'Multiply';
  }
  protected getDescription(): string {
    return 'Multiplies 2 numbers';
  }
  protected getOperation(a: any, b: any): any {
    return a * b;
  }
  protected getInput2(): Socket {
    return new Socket(
      SOCKET_TYPE.IN,
      'Input 2',
      new NumberType(false, 0, 10),
      1,
      true
    );
  }
}
export class Divide extends SimpleMathOperation {
  protected getName(): string {
    return 'Divide';
  }
  protected getDescription(): string {
    return 'Divides 2 numbers';
  }
  protected getOperation(a: any, b: any): any {
    return a / b;
  }
  protected getInput2(): Socket {
    return new Socket(
      SOCKET_TYPE.IN,
      'Input 2',
      new NumberType(false, 0.1, 10),
      1,
      true
    );
  }
}

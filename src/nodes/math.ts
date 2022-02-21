import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { NODE_TYPE_COLOR } from '../utils/constants';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { NumberType } from './datatypes/numberType';
import { EnumType } from './datatypes/enumType';

export class MathFunction extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    const math = Object.getOwnPropertyNames(Math);
    const mathOptions = math.map((methodName) => {
      return {
        text: methodName,
        value: methodName,
      };
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
    const staticMethodsWith2Parameters = ['atan2', 'imul', 'pow'];

    this.addInput('Input', new NumberType(false, -10, 10), 0, true);
    this.addInput('Input2', new NumberType(false, -10, 10), 0, false);
    this.addInput('Option', new EnumType(mathOptions), 'abs', false);
    this.addOutput('Output', new NumberType());

    this.name = 'Math function';
    this.description = 'Mathematical constants and functions';

    this.onExecute = async function (input) {
      const mathOption = input['Option'];
      this.nodeName = 'Math.' + mathOption;
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
}

export class Add extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.addInput('Input', new NumberType(false, -10, 10), 0, true);
    this.addInput('Input2', new NumberType(false, -10, 10), 0, true);
    this.addOutput('Output', new NumberType());

    this.name = 'Add';
    this.description = 'Adds 2 numbers or strings';

    this.onExecute = async function (input, output) {
      const a = input['Input'];
      const b = input['Input2'];
      const result = a + b;
      output['Output'] = result;
    };
  }
}

export class Subtract extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.addInput('Input', new NumberType(false, -10, 10), 0, true);
    this.addInput('Input2', new NumberType(false, -10, 10), 0, true);
    this.addOutput('Output', new NumberType());

    this.name = 'Subtract';
    this.description = 'Subtracts 2 numbers';

    this.onExecute = async function (input, output) {
      const a = input['Input'];
      const b = input['Input2'];
      const result = a - b;
      output['Output'] = result;
    };
  }
}

export class Multiply extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.addInput('Input', new NumberType(false, -10, 10), 0, true);
    this.addInput('Input2', new NumberType(false, 0, 10), 1, true);
    this.addOutput('Output', new NumberType());

    this.name = 'Multiply';
    this.description = 'Multiplys 2 numbers';

    this.onExecute = async function (input, output) {
      const a = input['Input'];
      const b = input['Input2'];
      const result = a * b;
      output['Output'] = result;
    };
  }
}

export class Divide extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.addInput('Input', new NumberType(false, -10, 10), 0, true);
    this.addInput('Input2', new NumberType(false, 0.1, 10), 1, true);
    this.addOutput('Output', new NumberType());

    this.name = 'Divide';
    this.description = 'Divides 2 numbers';

    this.onExecute = async function (input, output) {
      const a = input['Input'];
      const b = input['Input2'];
      const result = a / b;
      output['Output'] = result;
    };
  }
}

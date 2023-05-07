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

export class MathFunction extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  public getDescription(): string {
    return 'Mathematical constants and functions';
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.name = 'Math function';

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
      };
    });
    console.log(mathOptions);

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

abstract class SimpleMathOperation extends CustomFunction {
  public getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  public getName(): string {
    return 'MathOperation';
  }
  public getDescription(): string {
    return 'Performs a math operation to two numbers or strings';
  }
  public getParallelInputsOutputs(): boolean {
    return true;
  }

  protected getDefaultParameterValues(): Record<string, any> {
    return { Input1: 1, Input2: 1 };
  }
  protected getDefaultParameterTypes(): Record<string, any> {
    return { Input1: new NumberType(), Input2: new NumberType() };
  }
  protected getOutputParameterType(): AbstractType {
    return new NumberType();
  }
  protected getOutputParameterName(): string {
    return 'Result';
  }

  protected getDefaultFunction(): string {
    return (
      '(Input1, Input2) => {\n\treturn Input1 ' +
      this.getOperator() +
      ' Input2;\n}'
    );
  }

  public drawBackground(): void {
    const centerX = this.nodeWidth / 2;
    const centerY = this.nodeHeight / 2;
    this._BackgroundRef.removeChildren();
    this._BackgroundRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity()
    );
    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      this.nodeWidth,
      this.nodeHeight,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );

    //this._BackgroundRef.drawCircle(NODE_MARGIN, 0, this.nodeWidth / 2);

    const fontSize = 70;
    const text = new PIXI.Text(
      this.getOperatorSign(),
      new TextStyle({
        fontSize: fontSize,
        fill: this.getSocketByName('Input1')
          ? this.getSocketByName('Input1').dataType.getColor().hex()
          : COLOR_MAIN,
      })
    );
    text.x = centerX - fontSize / 4;
    text.y = centerY - fontSize / 2;
    this._BackgroundRef.addChild(text);
  }

  public socketTypeChanged(): void {
    super.socketTypeChanged();
    this.drawNodeShape();
  }

  public getNodeTextString(): string {
    return '';
  }

  protected getOperator(): string {
    return '';
  }
  protected getOperatorSign(): string {
    return this.getOperator();
  }
  public getTags(): string[] {
    return ['Math'].concat(super.getTags());
  }
}

export class Add extends SimpleMathOperation {
  public getName(): string {
    return 'Add';
  }
  public getDescription(): string {
    return 'Adds numbers or strings';
  }
  protected getOperator(): string {
    return '+';
  }
}

export class Subtract extends SimpleMathOperation {
  public getName(): string {
    return 'Subtract';
  }
  public getDescription(): string {
    return 'Subtracts two numbers';
  }

  protected getOperator(): string {
    return '-';
  }
}

export class Multiply extends SimpleMathOperation {
  public getName(): string {
    return 'Multiply';
  }
  public getDescription(): string {
    return 'Multiplies two numbers';
  }
  protected getOperator(): string {
    return '*';
  }
  protected getOperatorSign(): string {
    return '×';
  }
}
export class Divide extends SimpleMathOperation {
  public getName(): string {
    return 'Divide';
  }
  public getDescription(): string {
    return 'Divides two numbers';
  }
  protected getOperator(): string {
    return '/';
  }
  protected getOperatorSign(): string {
    return '÷';
  }
}

export class Sqrt extends SimpleMathOperation {
  protected getOperatorSign(): string {
    return '√';
  }

  public getName(): string {
    return 'Square root';
  }
  public getDescription(): string {
    return 'Square root of number';
  }

  protected getDefaultFunction(): string {
    return '(Input1) => {\n\treturn Math.sqrt(Input1);\n}';
  }
}

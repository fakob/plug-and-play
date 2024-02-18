import PPNode from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../utils/constants';
import { TRgba } from '../utils/interfaces';
import { DynamicInputNode } from './abstract/DynamicInputNode';
import { StringType } from './datatypes/stringType';
import { EnumType } from './datatypes/enumType';

const concatStringName = 'Concatenated';
const inputName = 'Input';
const inputOptionName = 'Option';
const parameterName1 = 'Parameter1';
const parameterName2 = 'Parameter2';
const outputName = 'Output';

export class StringFunction extends PPNode {
  protected async onExecute(
    input: any,
    output: Record<string, unknown>,
  ): Promise<void> {
    const inputString = input[inputName];
    const strOption = input[inputOptionName];
    const parameterCount = String.prototype[strOption].length;
    switch (parameterCount) {
      case 0:
        output[outputName] = inputString[strOption]();
        break;
      case 1:
        output[outputName] = inputString[strOption](input[parameterName1]);
        break;
      case 2:
        output[outputName] = inputString[strOption](
          input[parameterName1],
          input[parameterName2],
        );
        break;
      default:
        output[outputName] = inputString[strOption];
        break;
    }
  }

  public getName(): string {
    return 'String function';
  }

  public getDescription(): string {
    return 'Perform operations on strings';
  }

  public getTags(): string[] {
    return ['String'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  protected getDefaultIO(): Socket[] {
    const onOptionChange = (value) => {
      this.setNodeName('String.' + value);
    };
    const str = Object.getOwnPropertyNames(String.prototype);
    const strOptions = str
      .filter((name) => name !== 'constructor')
      .map((methodName) => {
        return {
          text: methodName,
        };
      });
    return [
      new Socket(
        SOCKET_TYPE.IN,
        inputOptionName,
        new EnumType(strOptions, (value) => onOptionChange(value)),
        'replace',
        false,
      ),
      new Socket(SOCKET_TYPE.IN, inputName, new StringType(), '', true),
      new Socket(SOCKET_TYPE.IN, parameterName1, new StringType(), '', true),
      new Socket(SOCKET_TYPE.IN, parameterName2, new StringType(), '', true),
      new Socket(SOCKET_TYPE.OUT, outputName, new StringType()),
    ];
  }
}

export class Concatenate extends DynamicInputNode {
  public getName(): string {
    return 'Concatenate strings';
  }

  public getDescription(): string {
    return 'Combines all input text into one';
  }

  public getTags(): string[] {
    return ['String'].concat(super.getTags());
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.OUT, concatStringName, new StringType(), []),
    ];
  }

  protected async onExecute(input, output): Promise<void> {
    output[concatStringName] = this.getAllNonDefaultInputSockets()
      .map((socket) => socket.data)
      .reduce((prev, current) => prev + current, '');
  }
}

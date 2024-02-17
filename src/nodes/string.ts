import PPNode from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../utils/constants';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { StringType } from './datatypes/stringType';
import { EnumType } from './datatypes/enumType';

export class StringFunction extends PPNode {
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.onExecute = async function (input) {
      const inputString = input['Input'];
      const strOption = input['Option'];
      const parameterCount = String.prototype[strOption].length;
      switch (parameterCount) {
        case 0:
          this.setOutputData('Output', inputString[strOption]());
          break;
        case 1:
          this.setOutputData(
            'Output',
            inputString[strOption](input['Parameter1']),
          );
          break;
        case 2:
          this.setOutputData(
            'Output',
            inputString[strOption](input['Parameter1'], input['Parameter2']),
          );
          break;

        default:
          this.setOutputData('Output', inputString[strOption]);
          break;
      }
    };
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
        console.log(methodName, String.prototype[methodName].length);
        return {
          text: methodName,
        };
      });
    return [
      new Socket(
        SOCKET_TYPE.IN,
        'Option',
        new EnumType(strOptions, (value) => onOptionChange(value)),
        'replace',
        false,
      ),
      new Socket(SOCKET_TYPE.IN, 'Input', new StringType(), '', true),
      new Socket(SOCKET_TYPE.IN, 'Parameter1', new StringType(), '', true),
      new Socket(SOCKET_TYPE.IN, 'Parameter2', new StringType(), '', true),
      new Socket(SOCKET_TYPE.OUT, 'Output', new StringType()),
    ];
  }
}

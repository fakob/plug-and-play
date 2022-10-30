import PPNode from '../../classes/NodeClass';
import PPSocket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { CodeType } from '../datatypes/codeType';
import { EnumType } from '../datatypes/enumType';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { NODE_TYPE_COLOR } from '../../utils/constants';
import { getMethods } from '../../utils/utils';

export class ArrayMethod extends PPNode {
  onOptionChange?: (value: string) => void;
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.onOptionChange = (value) => {
      this.nodeName = 'Array.' + value;
    };

    this.onExecute = async function (
      inputObject: any,
      outputObject: Record<string, unknown>
    ) {
      const array = inputObject['Array'];
      const arrayMethod = inputObject['Method'];
      const callback = inputObject['Callback'];
      const output = array[arrayMethod](eval(callback));
      outputObject['Output'] = output;
    };
  }

  public getName(): string {
    return 'Array method';
  }

  public getDescription(): string {
    return 'Perform common array operations';
  }

  protected getDefaultIO(): PPSocket[] {
    const arrayMethodsArray = getMethods(new Array(1));
    const arrayMethodsArrayOptions = arrayMethodsArray
      .sort()
      .map((methodName) => {
        return {
          text: methodName,
          value: methodName,
        };
      });

    return [
      new PPSocket(SOCKET_TYPE.IN, 'Array', new ArrayType()),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Method',
        new EnumType(arrayMethodsArrayOptions, this.onOptionChange),
        'map',
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Callback',
        new CodeType(),
        '(item, index) => `${index}: ${item}`',
        false
      ),
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new AnyType()),
    ].concat(super.getDefaultIO());
  }
}

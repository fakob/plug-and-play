import PPNode from '../../classes/NodeClass';
import PPGraph from '../../classes/GraphClass';
import PPSocket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { CodeType } from '../datatypes/codeType';
import { NumberType } from '../datatypes/numberType';
import { EnumType } from '../datatypes/enumType';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { NODE_TYPE_COLOR } from '../../utils/constants';
import { getMethods } from '../../utils/utils';
import { BooleanType } from '../datatypes/booleanType';

const elementName = 'Element';
const arrayName = 'Array';
const arrayLength = 'ArrayLength';
const indexName = 'Index';
const beginIndexName = 'Begin';
const endIndexName = 'End';
const shouldUseEnd = 'Slice End';

export class ArrayCreate extends PPNode {
  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, elementName, new AnyType()),
      new PPSocket(SOCKET_TYPE.OUT, arrayName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const elements = Object.keys(inputObject).map((key) => inputObject[key]);
    outputObject[arrayName] = elements;
  }

  getCanAddInput(): boolean {
    return true;
  }
}

export class ArrayGet extends PPNode {
  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, arrayName, new ArrayType()),
      new PPSocket(
        SOCKET_TYPE.IN,
        indexName,
        new NumberType(true, 0, 10),
        0,
        true
      ),
      new PPSocket(SOCKET_TYPE.OUT, elementName, new AnyType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[elementName] = inputObject[arrayName][inputObject[indexName]];
  }
}

export class ArrayLength extends PPNode {
  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, arrayName, new ArrayType()),
      new PPSocket(SOCKET_TYPE.OUT, arrayLength, new NumberType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[arrayLength] = inputObject[arrayName]?.length;
  }
}

export class ArrayPush extends PPNode {
  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, arrayName, new ArrayType()),
      new PPSocket(SOCKET_TYPE.IN, elementName, new AnyType()),
      new PPSocket(SOCKET_TYPE.OUT, arrayName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const newArray = [...inputObject[arrayName]];
    newArray.push(inputObject[elementName]);
    outputObject[arrayName] = newArray;
  }
}

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

import PureNode from '../../classes/NodeClass';
import Graph from '../../classes/GraphClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { CodeType } from '../datatypes/codeType';
import { NumberType } from '../datatypes/numberType';
import { EnumType } from '../datatypes/enumType';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { NODE_TYPE_COLOR } from '../../utils/constants';
import { getMethods } from '../../utils/utils';

const elementName = 'Element';
const arrayName = 'Array';
const arrayLength = 'ArrayLength';
const indexName = 'Index';

export class ArrayCreate extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, elementName, new AnyType()),
      new Socket(SOCKET_TYPE.OUT, arrayName, new ArrayType()),
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

export class ArrayGet extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType()),
      new Socket(
        SOCKET_TYPE.IN,
        indexName,
        new NumberType(true, 0, 10),
        0,
        true
      ),
      new Socket(SOCKET_TYPE.OUT, elementName, new AnyType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[elementName] =
      inputObject?.[arrayName]?.[inputObject[indexName]];
  }
}

export class ArrayLength extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType()),
      new Socket(SOCKET_TYPE.OUT, arrayLength, new NumberType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[arrayLength] = inputObject[arrayName]?.length;
  }
}

export class ArrayPush extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType()),
      new Socket(SOCKET_TYPE.IN, elementName, new AnyType()),
      new Socket(SOCKET_TYPE.OUT, arrayName, new ArrayType()),
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

export class ArrayMethod extends PureNode {
  constructor(name: string, graph: Graph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    const arrayMethodsArray = getMethods(new Array(1));
    const arrayMethodsArrayOptions = arrayMethodsArray
      .sort()
      .map((methodName) => {
        return {
          text: methodName,
          value: methodName,
        };
      });

    this.addInput('Array', new ArrayType());
    this.addInput(
      'Method',
      new EnumType(arrayMethodsArrayOptions),
      'map',
      false
    );
    this.addInput(
      'Callback',
      new CodeType(),
      '(item, index) => `${index}: ${item}`',
      false
    );
    this.addOutput('Output', new AnyType());

    this.name = 'Array method';
    this.description = 'Apply a method to the array';

    this.onExecute = async function (
      inputObject: any,
      outputObject: Record<string, unknown>
    ) {
      const array = inputObject['Array'];
      const arrayMethod = inputObject['Method'];
      this.nodeName = `Array.${arrayMethod}`;
      const callback = inputObject['Callback'];
      const output = array[arrayMethod](eval(callback));
      outputObject['Output'] = output;
    };
  }
}

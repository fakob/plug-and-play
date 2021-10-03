import PPNode, { UpdateBehaviour } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { CodeType } from '../datatypes/codeType';

const filterCodeName = 'Filter';
const arrayName = 'Array';
const arrayOutName = 'FilteredArray';

const anyCodeName = 'Code';
const inDataName = 'InData';
const outDataName = 'OutData';

const constantInName = 'In';
const constantOutName = 'Out';

export class Code extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inDataName, new AnyType(), 'bruh'),
      new Socket(
        SOCKET_TYPE.IN,
        anyCodeName,
        new CodeType(),
        '// in here you are provided with two objects; "inputObject" and "outputObject", they each have named parameters based on the input and output sockets, so by default there will be an inputObject["' +
          inDataName +
          '"] and an outputObject["' +
          outDataName +
          '"]\n\noutputObject["' +
          outDataName +
          '"] = inputObject["' +
          inDataName +
          '"]'
      ),
      new Socket(SOCKET_TYPE.OUT, outDataName, new ArrayType()),
    ];
  }
  public getCanAddInput(): boolean {
    return true;
  }
  public getCanAddOutput(): boolean {
    return true;
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    eval(inputObject[anyCodeName]);
  }
}

export class Filter extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(SOCKET_TYPE.IN, filterCodeName, new CodeType(), '(a) => true'),
      new Socket(SOCKET_TYPE.OUT, arrayOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const filterCode = inputObject[filterCodeName];
    const inputArray = inputObject[arrayName];
    outputObject[arrayOutName] = inputArray.filter(eval(filterCode));
  }
}

export class Map extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(SOCKET_TYPE.IN, filterCodeName, new CodeType(), '(a) => a'),
      new Socket(SOCKET_TYPE.OUT, arrayOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const filterCode = inputObject[filterCodeName];
    const inputArray = inputObject[arrayName];
    outputObject[arrayOutName] = inputArray.map(eval(filterCode));
  }
}

export class Constant extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, constantInName, new AnyType(), 0),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new AnyType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[constantOutName] = inputObject[constantInName];
  }
}

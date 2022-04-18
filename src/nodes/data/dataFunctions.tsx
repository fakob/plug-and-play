import NodeClass from '../../classes/NodeClass';
import PureNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { CodeType } from '../datatypes/codeType';
import { JSONType } from '../datatypes/jsonType';
import { NumberType } from '../datatypes/numberType';

const filterCodeName = 'Filter';
const arrayName = 'Array';
const typeName = 'Type';
const outElementName = 'Element';
const arrayOutName = 'FilteredArray';
const forStartIndexName = 'StartIndex';
const forEndIndexName = 'EndIndex';
const incrementName = 'Increment';
const forOutIndexName = 'Index';

const mapCodeName = 'Function';
const mapOutName = 'OutArray';

const anyCodeName = 'Code';
const inDataName = 'InData';
const outDataName = 'OutData';

const constantInName = 'In';
const constantOutName = 'Out';

const input1Name = 'Input 1';
const input2Name = 'Input 2';

const inputMultiplierName = 'Multiplier';

function asyncWrapCode(code: string): string {
  return '(async () => {' + code + '})()';
}
export class Code extends PureNode {
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
    await eval(asyncWrapCode(inputObject[anyCodeName]));
  }
}

export class Filter extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(
        SOCKET_TYPE.IN,
        filterCodeName,
        new CodeType(),
        '(a) => {return true;}'
      ),
      new Socket(SOCKET_TYPE.OUT, arrayOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const filterCode = inputObject[filterCodeName];
    const inputArray = inputObject[arrayName];
    outputObject[arrayOutName] = inputArray.filter(
      eval(asyncWrapCode(filterCode))
    );
  }
}

export class Map extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(
        SOCKET_TYPE.IN,
        mapCodeName,
        new CodeType(),
        '(a) => {return a;}'
      ),
      new Socket(SOCKET_TYPE.OUT, mapOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const mapCode = inputObject[mapCodeName];
    const inputArray = inputObject[arrayName];
    outputObject[mapOutName] = inputArray?.map(eval(asyncWrapCode(mapCode)));
  }

  public getCanAddInput(): boolean {
    return true;
  }
}

function merge(array1, array2) {
  const validEntry1: boolean =
    (Array.isArray(array1) && array1.length > 0) ||
    Object.keys(array1).length > 0;
  const validEntry2: boolean =
    (Array.isArray(array2) && array2.length > 0) ||
    Object.keys(array2).length > 0;
  if (!validEntry1) {
    return array2;
  } else if (!validEntry2) {
    return array1;
  } else {
    const newArray = [];
    for (let i = 0; i < array1.length && i < array2.length; i++) {
      newArray.push(merge(array1[i], array2[i]));
    }
    for (let i = array1.length; i < array2.length; i++) {
      newArray.push(array2[i]);
    }
    for (let i = array2.length; i < array1.length; i++) {
      newArray.push(array1[i]);
    }
    return newArray;
  }
}

// mostly useful for draw nodes
export class MergeDataArrays extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, input1Name, new ArrayType(), []),
      new Socket(SOCKET_TYPE.IN, input2Name, new ArrayType(), []),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[constantOutName] = merge(
      inputObject[input1Name],
      inputObject[input2Name]
    );
  }
}

export class MergeJSONs extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, input1Name, new JSONType(), {}),
      new Socket(SOCKET_TYPE.IN, input2Name, new JSONType(), {}),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[constantOutName] = {
      ...inputObject[input1Name],
      ...inputObject[input2Name],
    };
  }
}

export class MergeJSONArrays extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, input1Name, new ArrayType(), []),
      new Socket(SOCKET_TYPE.IN, input2Name, new ArrayType(), []),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[constantOutName] = inputObject[input1Name].map(
      (item, index) => {
        return { ...item, ...inputObject[input2Name][index] };
      }
    );
  }
}

export class PadArray extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, input1Name, new ArrayType(), ['hello']),
      new Socket(SOCKET_TYPE.IN, inputMultiplierName, new NumberType(true), 2),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const newArray = inputObject[input1Name].map((item, index) =>
      Array(inputObject[inputMultiplierName]).fill(
        item,
        0,
        inputObject[inputMultiplierName]
      )
    );
    const copiedArray = newArray.map((entry) =>
      JSON.parse(JSON.stringify(entry))
    );
    outputObject[constantOutName] = copiedArray.flat();
  }
}

export class FlattenArray extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, input1Name, new ArrayType(), ['hello']),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[constantOutName] = inputObject[input1Name].flat();
  }
}

export class ConcatenateArrays extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, input1Name, new ArrayType(), ['hello']),
      new Socket(SOCKET_TYPE.IN, input2Name, new ArrayType(), ['hello again']),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[constantOutName] = inputObject[input1Name].concat(
      inputObject[input2Name]
    );
  }
}

export class Constant extends PureNode {
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
    outputObject[constantOutName] = inputObject?.[constantInName];
  }
}

export class Uniques extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(SOCKET_TYPE.OUT, arrayOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputArray = inputObject?.[arrayName];
    outputObject[arrayOutName] = [...new Set(inputArray)];
  }
}

export class ParseArray extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), []),
      new Socket(SOCKET_TYPE.IN, typeName, new NumberType(), []),
      new Socket(SOCKET_TYPE.OUT, arrayOutName, new ArrayType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputArray = inputObject[arrayName];
    outputObject[arrayOutName] = inputArray.map((element) =>
      this.getSocketByName(typeName).dataType.parse(element)
    );
  }
}

// the purpose of for loops in our context is for actions that have sideeffects outside of plug and playground, if you are not looking for external side effects you are likely not looking for a loop
export class ForLoop extends NodeClass {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, forStartIndexName, new NumberType(true), 0),
      new Socket(SOCKET_TYPE.IN, forEndIndexName, new NumberType(true), 1),
      new Socket(SOCKET_TYPE.IN, incrementName, new NumberType(true, 1), 1),
      new Socket(SOCKET_TYPE.OUT, forOutIndexName, new NumberType(true), 0),
    ];
  }

  currentIndex = 0;

  protected getMinIndex(inputObject: unknown): number {
    return inputObject[forStartIndexName];
  }

  protected getMaxIndex(inputObject: unknown): number {
    return inputObject[forEndIndexName];
  }

  protected getIncrement(inputObject: unknown): number {
    return inputObject[incrementName];
  }

  // we actually override the base execute function here as we are modifying the flow
  public async execute(): Promise<boolean> {
    const inputObject = this.remapInput(this.inputSocketArray);
    for (
      this.currentIndex = this.getMinIndex(inputObject);
      this.currentIndex < this.getMaxIndex(inputObject);
      this.currentIndex += this.getIncrement(inputObject)
    ) {
      await this.rawExecute();

      /*for (const outputSocket of this.outputSocketArray) {
        await outputSocket.notifyChange(new Set());
      }*/
    }
    // comment here is just gonna show the last output but eh
    this.drawComment();
    return true;
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[forOutIndexName] = this.currentIndex;
  }
}

export class ConsolePrint extends NodeClass {
  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, constantInName, new ArrayType(), 0)];
  }

  protected async onExecute(inputObject: any): Promise<void> {
    console.log(inputObject?.[constantInName]);
  }
}

export class ForEachLoop extends ForLoop {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, new ArrayType(), 0),
      new Socket(SOCKET_TYPE.OUT, outElementName, new AnyType(), 0),
    ];
  }
  protected getMinIndex(inputObject: unknown): number {
    return 0;
  }

  protected getMaxIndex(inputObject: unknown): number {
    return inputObject[arrayName].length;
  }

  protected getIncrement(inputObject: unknown): number {
    return 1;
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[outElementName] =
      inputObject?.[arrayName]?.[this.currentIndex];
  }
}

// TODO implement
// Not quite sure how we want this one to look... CodeType? or based on input?
//export class WhileLoop extends NodeClass {}

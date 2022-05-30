/* eslint-disable @typescript-eslint/no-this-alias */
import NodeClass from '../../classes/NodeClass';
import PPNode from '../../classes/NodeClass';
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

function asyncWrapCode(code: string, execute = true): string {
  return '(' + code + ')' + (execute ? '()' : '');
}
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
    const node = this;
    await eval('async () => {' + inputObject[anyCodeName] + '}')();
  }
}

// make filter and map ourselves to be able to deal with async (need sequental ordering)
export class Filter extends PPNode {
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
    const outputs = [];
    const node = this;
    for (let i = 0; i < inputArray.length; i++) {
      const passed = await eval(
        asyncWrapCode(filterCode, false) + '(inputArray[i],i)'
      );
      if (passed) {
        outputs.push(inputArray[i]);
      }
    }

    outputObject[arrayOutName] = outputs;
  }
}

export class Map extends PPNode {
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
    const outputs = [];

    const node = this;
    for (let i = 0; i < inputArray.length; i++) {
      outputs.push(
        await eval(asyncWrapCode(mapCode, false) + '(inputArray[i],i)')
      );
    }
    outputObject[mapOutName] = outputs;
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
export class MergeDataArrays extends PPNode {
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

export class MergeJSONs extends PPNode {
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

export class MergeJSONArrays extends PPNode {
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

export class PadArray extends PPNode {
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

export class FlattenArray extends PPNode {
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

export class ConcatenateArrays extends PPNode {
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
    outputObject[constantOutName] = inputObject?.[constantInName];
  }
}

export class Uniques extends PPNode {
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

export class ParseArray extends PPNode {
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
  public async execute(): Promise<void> {
    const inputObject = this.remapInput(this.inputSocketArray);
    for (
      this.currentIndex = this.getMinIndex(inputObject);
      this.currentIndex < this.getMaxIndex(inputObject);
      this.currentIndex += this.getIncrement(inputObject)
    ) {
      await this.rawExecute();
    }
    // comment here is just gonna show the last output but eh
    this.drawComment();
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

export class CustomFunction extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        anyCodeName,
        new CodeType(),
        '// define your function here, node will adapt to inputs automatically\n(a) => {\nreturn a;\n}'
      ),
      new Socket(SOCKET_TYPE.OUT, outDataName, new AnyType()),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    // before every execute, re-evaluate inputs
    this.adaptInputs(inputObject[anyCodeName]);
    await eval('async () => {' + inputObject[anyCodeName] + '}')();
  }

  adaptInputs(code: string): void {
    const regex = /(\(.*\))/;
    const res = code.match(regex)[0];
    const cleaned = res.replace('(', '').replace(')', '').replace(' ', '');
    console.log('res:  ' + res);
    console.log('cleaned:  ' + cleaned);

    // remove all non existing arguments and add all missing (based on the definition we just got)
    const currentInputSockets = this.getAllSockets().filter(
      (socket) => socket.socketType === SOCKET_TYPE.IN
    );
    const codeArguments = cleaned.split(',');
    console.log('arguments: ' + codeArguments);
    const socketsToBeRemoved = currentInputSockets.filter(
      (socket) =>
        !codeArguments.some((argument) => socket.name === argument) &&
        socket.name !== anyCodeName
    );
    const argumentsToBeAdded = codeArguments.filter(
      (argument) =>
        !currentInputSockets.some((socket) => socket.name === argument)
    );
    socketsToBeRemoved.forEach((socket) => {
      console.log('removed socket');
      socket.destroy();
    });
    argumentsToBeAdded.forEach((argument) => {
      console.log('added input');
      this.addInput(argument, new AnyType());
    });
    if (socketsToBeRemoved.length > 0 || argumentsToBeAdded.length > 0) {
      this.metaInfoChanged();
    }
  }
}

// TODO implement
// Not quite sure how we want this one to look... CodeType? or based on input? THIS ONE IS DANGEROUS AS IT CAN HANG THE ENTIRE APPLICATION, needs max loop limit. Is this even needed?
//export class WhileLoop extends NodeClass {}

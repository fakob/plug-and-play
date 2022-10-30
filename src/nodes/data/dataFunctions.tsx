/* eslint-disable @typescript-eslint/no-this-alias */
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { AbstractType } from '../datatypes/abstractType';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { CodeType } from '../datatypes/codeType';
import { JSONType } from '../datatypes/jsonType';
import { NumberType } from '../datatypes/numberType';

const arrayName = 'Array';
const typeName = 'Type';
const outElementName = 'Element';
const arrayOutName = 'FilteredArray';
const forStartIndexName = 'StartIndex';
const forEndIndexName = 'EndIndex';
const incrementName = 'Increment';
const forOutIndexName = 'Index';

const anyCodeName = 'Code';
const outDataName = 'OutData';

const constantInName = 'In';
const constantOutName = 'Out';

const input1Name = 'Input 1';
const input2Name = 'Input 2';

// TODO switch to this instead of eval
//const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

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
  public outputsAutomaticallyAdaptType(): boolean {
    return true;
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
export class ForLoop extends PPNode {
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

export class ConsolePrint extends PPNode {
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

function getArgumentsFromFunction(inputFunction: string): string[] {
  const argumentsRegex = /(\(.*\))/;
  const res = inputFunction.match(argumentsRegex)[0];
  const cleaned = res.replace('(', '').replace(')', '').replace(' ', '');
  const codeArguments = cleaned.split(',');
  return codeArguments.filter((argument) => argument !== '');
}

function getFunctionFromFunction(inputFunction: string): string {
  const functionRegex = /({(.|\s)*})/;
  const res = inputFunction.match(functionRegex)[0];
  return res;
}

// customfunction does any number of inputs but only one output for simplicity
export class CustomFunction extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        anyCodeName,
        new CodeType(),
        this.getDefaultFunction(),
        false
      ),
      new Socket(
        SOCKET_TYPE.OUT,
        this.getOutputParameterName(),
        this.getOutputParameterType()
      ),
    ];
  }

  protected getDefaultParameterValues(): Record<string, any> {
    return {};
  }
  protected getDefaultParameterTypes(): Record<string, any> {
    return {};
  }
  protected getOutputParameterType(): AbstractType {
    return new AnyType();
  }
  protected getOutputParameterName(): string {
    return outDataName;
  }

  protected getDefaultFunction(): string {
    return '//define your function here, node will adapt to inputs automatically\n(a) => {\n\treturn a;\n}';
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.DEFAULT);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
    // added this to make sure all sockets are in place before anything happens (caused visual issues on load before)
    this.adaptInputs(this.getInputData(anyCodeName));
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    // before every execute, re-evaluate inputs
    this.adaptInputs(inputObject[anyCodeName]);
    const functionToCall = getFunctionFromFunction(inputObject[anyCodeName]);
    // eslint-disable-next-line prefer-const
    const defineAllVariables = Object.keys(inputObject)
      .map(
        (argument) =>
          'const ' + argument + ' = inputObject["' + argument + '"];'
      )
      .join(';');
    const functionToExecute = functionToCall.replace(
      '{',
      '{' + defineAllVariables
    );

    // we fix the macros for the user so that they are more pleasant to type
    const foundMacroCalls = [...functionToExecute.matchAll(/macro\(.*?\)/g)];

    //console.log('found macro calls: ' + foundMacroCalls.toString());
    const reduced = foundMacroCalls.reduce((formatted, macroCall) => {
      const macroContents = macroCall
        .toString()
        .replace('macro(', '')
        .replace(')', '');
      const parameters = macroContents.trim().split(',');
      let formattedParamsString = '{"Name": ' + parameters[0];
      for (let i = 1; i < parameters.length; i++) {
        formattedParamsString =
          formattedParamsString +
          ',"Parameter ' +
          i.toString() +
          '":' +
          parameters[i];
      }
      formattedParamsString = formattedParamsString + '}';
      const finalMacroDefinition =
        'this.invokeMacro(' + formattedParamsString + ')';

      return formatted.replace(macroCall.toString(), finalMacroDefinition);
    }, functionToExecute);

    // this might seem unused but it actually isn't, its used inside the eval potentially
    const node = this;

    const res = await eval('async () => ' + reduced)();
    outputObject[this.getOutputParameterName()] = res;
  }

  adaptInputs(code: string): void {
    const codeArguments = getArgumentsFromFunction(code);
    // remove all non existing arguments and add all missing (based on the definition we just got)
    const currentInputSockets = this.getDataSockets().filter(
      (socket) => socket.socketType === SOCKET_TYPE.IN
    );
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
      socket.destroy();
    });
    argumentsToBeAdded.forEach((argument) => {
      this.addInput(
        argument,
        this.getDefaultParameterTypes()[argument] || new AnyType(),
        this.getDefaultParameterValues()[argument] || 0
      );
    });
    if (socketsToBeRemoved.length > 0 || argumentsToBeAdded.length > 0) {
      this.metaInfoChanged();
    }
  }
  public outputsAutomaticallyAdaptType(): boolean {
    return true;
  }
}

class ArrayFunction extends CustomFunction {
  protected getDefaultParameterValues(): Record<string, any> {
    return { ArrayIn: [] };
  }
  protected getDefaultParameterTypes(): Record<string, any> {
    return { ArrayIn: new ArrayType() };
  }
  protected getOutputParameterName(): string {
    return 'ArrayOut';
  }
  protected getOutputParameterType(): AbstractType {
    return new ArrayType();
  }
}

export class Map extends ArrayFunction {
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.map(a=>a);\n}';
  }
}

export class Filter extends ArrayFunction {
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.filter(a=>true);\n}';
  }
}

export class Uniques extends ArrayFunction {
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn [...new Set(inputArray)];\n}';
  }
}

export class Flatten extends ArrayFunction {
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.flat();\n}';
  }
}

export class ArraySlice extends ArrayFunction {
  public getName(): string {
    return 'Slice array';
  }
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.slice(0,10);\n}';
  }
}

export class ArrayCreate extends ArrayFunction {
  public getName(): string {
    return 'Create array';
  }
  protected getDefaultFunction(): string {
    return '(Element) => {\n\treturn [Element];\n}';
  }
}

export class ArrayGet extends ArrayFunction {
  public getName(): string {
    return 'Get from array';
  }
  protected getDefaultFunction(): string {
    return '(ArrayIn, Index) => {\n\treturn ArrayIn[Index];\n}';
  }
  protected getOutputParameterName(): string {
    return 'Element';
  }
}

export class ArrayLength extends ArrayFunction {
  public getName(): string {
    return 'Get length of array';
  }
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.length();\n}';
  }
  protected getOutputParameterName(): string {
    return 'Length';
  }
}

export class ArrayPush extends ArrayFunction {
  public getName(): string {
    return 'Add element to array';
  }
  protected getDefaultFunction(): string {
    return '(ArrayIn, Element) => {\n\tArrayIn.push(Element);\nreturn ArrayIn;\n}';
  }
}

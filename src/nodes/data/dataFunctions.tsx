/* eslint-disable @typescript-eslint/no-this-alias */
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { updateDataIfDefault } from '../../utils/utils';
import { AbstractType } from '../datatypes/abstractType';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { StringType } from '../datatypes/stringType';
import { CodeType } from '../datatypes/codeType';
import { JSONType } from '../datatypes/jsonType';
import { NumberType } from '../datatypes/numberType';
import * as PIXI from 'pixi.js';

const arrayName = 'Array';
const typeName = 'Type';
const arrayOutName = 'FilteredArray';

export const anyCodeName = 'Code';
const outDataName = 'OutData';

const constantInName = 'In';
const constantOutName = 'Out';

const input1Name = 'Input 1';
const input2Name = 'Input 2';

// TODO switch to this instead of eval
//const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export class MergeJSONs extends PPNode {
  public getName(): string {
    return 'Merge JSONs';
  }

  public getDescription(): string {
    return 'Merges 2 JSON objects';
  }

  public getTags(): string[] {
    return ['JSON'].concat(super.getTags());
  }

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
  public getName(): string {
    return 'Concatenate arrays';
  }

  public getDescription(): string {
    return 'Merges 2 arrays';
  }

  public getTags(): string[] {
    return ['Array'].concat(super.getTags());
  }

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

const constantDefaultData = 0;

export class Constant extends PPNode {
  initialData: any;

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.initialData = customArgs?.initialData;
  }

  public getName(): string {
    return 'Constant';
  }

  public getDescription(): string {
    return 'Provides a constant input';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        constantInName,
        new AnyType(),
        constantDefaultData
      ),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new AnyType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[constantOutName] = inputObject?.[constantInName];
  }

  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return true;
  }

  public outputPlugged(): void {
    const dataToUpdate =
      this.getSocketByName(constantOutName).links[0].getTarget().defaultData;
    updateDataIfDefault(
      this,
      constantInName,
      constantDefaultData,
      dataToUpdate
    );
    super.outputPlugged();
  }
}

export class ParseArray extends PPNode {
  public getName(): string {
    return 'Parse array';
  }

  public getDescription(): string {
    return 'Transforms all elements of an array to a different data type. Use it to, for example, to parse a number string "12" to a number';
  }

  public getTags(): string[] {
    return ['Array'].concat(super.getTags());
  }

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

export class ConsolePrint extends PPNode {
  public getName(): string {
    return 'Console print';
  }

  public getDescription(): string {
    return 'Logs the input in the console';
  }

  public getTags(): string[] {
    return ['Debug'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
  }

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, constantInName, new ArrayType(), 0)];
  }

  protected async onExecute(inputObject: any): Promise<void> {
    console.log(inputObject?.[constantInName]);
  }
}

function getArgumentsFromFunction(inputFunction: string): string[] {
  const argumentsRegex = /(\(.*\))/;
  const res = inputFunction.match(argumentsRegex)[0];
  const cleaned = res.replace('(', '').replace(')', '');
  const codeArguments = cleaned.split(',');
  return codeArguments
    .filter((argument) => argument !== '')
    .map((argument) => argument.trim());
}

function getFunctionFromFunction(inputFunction: string): string {
  const functionRegex = /({(.|\s)*})/;
  const res = inputFunction.match(functionRegex)[0];
  return res;
}

// customfunction does any number of inputs but only one output for simplicity
export class CustomFunction extends PPNode {
  modifiedBanner: PIXI.Graphics;

  public getName(): string {
    return 'Custom function';
  }

  public getDescription(): string {
    return 'Write your own custom function. Add input sockets, by adding parameters in the parentheses, separated by commas.';
  }

  public getTags(): string[] {
    return ['Custom'].concat(super.getTags());
  }

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

  public isCallingMacro(macroName: string): boolean {
    return this.getInputData(anyCodeName)
      .replaceAll("'", '"')
      .includes('acro("' + macroName);
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
    this.modifiedBanner = this.addChild(new PIXI.Graphics());
    // added this to make sure all sockets are in place before anything happens (caused visual issues on load before)
    this.adaptInputs(this.getInputData(anyCodeName));
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    // before every execute, re-evaluate inputs
    const changeFound = this.adaptInputs(inputObject[anyCodeName]);
    if (changeFound) {
      // there might be new inputs, so re-run rawexecute
      return await this.rawExecute();
    }
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

    // this might seem unused but it actually isn't, its used inside the eval in many cases but we can't see what's inside it from here
    const node = this;

    this.statuses = [];
    if (this.getDefaultFunction() !== inputObject['Code']) {
      this.statuses.push({
        color: this.getColor().multiply(0.8),
        statusText: 'Modified',
      });
    }

    const res = eval('async () => ' + reduced);
    outputObject[this.getOutputParameterName()] = await res();
  }

  // returns true if there was a change
  private adaptInputs(code: string): boolean {
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
      this.removeSocket(socket);
    });
    argumentsToBeAdded.forEach((argument) => {
      this.addInput(
        argument,
        this.getDefaultParameterTypes()[argument] || new AnyType(),
        this.getDefaultParameterValues()[argument] || 0,
        true,
        {},
        false
      );
    });
    if (socketsToBeRemoved.length > 0 || argumentsToBeAdded.length > 0) {
      this.metaInfoChanged();
      return true;
    }
    return false;
  }
  // adapt all nodes apart from the code one
  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return socket.name !== anyCodeName;
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
  public getTags(): string[] {
    return ['Array'].concat(super.getTags());
  }
}

export class Map extends ArrayFunction {
  public getName(): string {
    return 'Map array';
  }

  public getDescription(): string {
    return 'Transform and or filter each element of an array';
  }
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\
	const toReturn = [];\n\
	for (let i = 0; i < ArrayIn.length; i++){\n\
		toReturn.push(await 1);\n\
	}\n\
	return toReturn;\n\
}';
  }
}

export class Filter extends ArrayFunction {
  public getName(): string {
    return 'Filter array';
  }

  public getDescription(): string {
    return 'Filters an array, using your own filter condition';
  }

  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.filter(a=>true);\n}';
  }
}

export class Uniques extends ArrayFunction {
  public getName(): string {
    return 'Unique array';
  }

  public getDescription(): string {
    return 'Returns an array with unique values, removing all duplicates';
  }
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn [...new Set(ArrayIn)];\n}';
  }
}

export class Counts extends ArrayFunction {
  public getName(): string {
    return 'Count occurrences in array';
  }

  public getDescription(): string {
    return 'Counts occurrences of elements in an array, by providing an array and an array with the unique values';
  }

  protected getDefaultFunction(): string {
    return `(ArrayIn, Uniques) => {
      return Uniques.map(unique => [unique,ArrayIn.filter(entry => entry == unique).length])
    }`;
  }
}

export class Flatten extends ArrayFunction {
  public getName(): string {
    return 'Flatten array';
  }

  public getDescription(): string {
    return 'Flattens an array. All sub-array elements will be concatenated into it recursively';
  }

  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.flat();\n}';
  }
}

export class ArraySlice extends ArrayFunction {
  public getName(): string {
    return 'Slice array';
  }

  public getDescription(): string {
    return 'Returns a section of an array using start and end indices';
  }
  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.slice(0,10);\n}';
  }
}

export class ArrayCreate extends ArrayFunction {
  public getName(): string {
    return 'Create array';
  }

  public getDescription(): string {
    return 'Creates an array from a single value';
  }

  protected getDefaultFunction(): string {
    return '(Element) => {\n\treturn [Element];\n}';
  }
}

export class ArrayGet extends ArrayFunction {
  public getName(): string {
    return 'Get from array';
  }

  public getDescription(): string {
    return 'Returns an element based on its index position';
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
    return 'Length of array';
  }

  public getDescription(): string {
    return 'Returns the length of an array';
  }

  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn ArrayIn.length;\n}';
  }

  protected getOutputParameterName(): string {
    return 'Length';
  }
}

export class ArrayPush extends ArrayFunction {
  public getName(): string {
    return 'Add element to array';
  }
  public getDescription(): string {
    return 'Adds an element at the end of the array';
  }
  protected getDefaultFunction(): string {
    return '(ArrayIn, Element) => {\n\tArrayIn.push(Element);\nreturn ArrayIn;\n}';
  }
}

export class Max extends ArrayFunction {
  public getName(): string {
    return 'Max element in array';
  }

  public getDescription(): string {
    return 'Returns the largest number of the array';
  }

  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn Math.max(...ArrayIn);\n}';
  }
}

export class Min extends ArrayFunction {
  public getName(): string {
    return 'Min element in array';
  }

  public getDescription(): string {
    return 'Returns the smallest number of the array';
  }

  protected getDefaultFunction(): string {
    return '(ArrayIn) => {\n\treturn Math.min(...ArrayIn);\n}';
  }
}

export class ArrayToObject extends ArrayFunction {
  public getName(): string {
    return 'Convert array to object';
  }

  public getDescription(): string {
    return 'Converts an array into an object using a specified property as key';
  }

  protected getDefaultParameterValues(): Record<string, any> {
    return { ArrayIn: [], KeyPropertyName: 'key' };
  }
  protected getDefaultParameterTypes(): Record<string, any> {
    return { ArrayIn: new ArrayType(), KeyPropertyName: new StringType() };
  }

  protected getDefaultFunction(): string {
    return '(ArrayIn, KeyPropertyName) => {\n  return ArrayIn.reduce((obj, item) => {\n    const { [KeyPropertyName]: key, ...rest } = item;\n    obj[key] = rest;\n    return obj;\n  }, {});\n}\n';
  }

  protected getOutputParameterName(): string {
    return 'Object';
  }
}

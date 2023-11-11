/* eslint-disable prettier/prettier */
import { JSONPath } from 'jsonpath-plus';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import FloatingJsonPathPicker from '../../components/FloatingJsonPathPicker';
import { parseJSON, replacePartOfObject } from '../../utils/utils';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import { dataToType } from '../datatypes/typehelper';
import { CustomFunction } from './dataFunctions';
import { BooleanType } from '../datatypes/booleanType';
import { DynamicInputNode } from '../abstract/DynamicInputNode';
import FormatJSONType, { FormatJSONInterface } from '../datatypes/formatJSONType';
import { ArrayType } from '../datatypes/arrayType';

const JSONName = 'JSON';
const lockOutputsName = "Lock Outputs";
const JSONParamName = 'Path';
const JSONInsert = 'New value';
const outValueName = 'Value';

const JSON_SEPARATOR = "->";

export class JSONGet extends PPNode {
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
  }

  public getName(): string {
    return 'Get a JSON value';
  }

  public getDescription(): string {
    return 'Returns a single value of a JSON at the defined path';
  }

  public getTags(): string[] {
    return ['JSON'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()),
      new Socket(
        SOCKET_TYPE.IN,
        JSONParamName,
        new StringType(),
        undefined,
        undefined,
        {
          inspectorInjection: {
            reactComponent: FloatingJsonPathPicker,
            props: {
              jsonSocketName: JSONName,
              jsonPathSocketName: JSONParamName,
            },
          },
        }
      ),
      new Socket(SOCKET_TYPE.OUT, outValueName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const parsedJSON = parseJSON(inputObject[JSONName]);
    if (parsedJSON) {
      outputObject[outValueName] = JSONPath({
        path: inputObject[JSONParamName],
        json: parsedJSON,
        wrap: false,
      });
    }
  }
}

export class JSONSet extends PPNode {
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
  }

  public getName(): string {
    return 'Set JSON value';
  }

  public getDescription(): string {
    return 'Sets a value on a JSON at the defined path';
  }

  public getTags(): string[] {
    return ['JSON'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()),
      new Socket(
        SOCKET_TYPE.IN,
        JSONParamName,
        new StringType(),
        undefined,
        undefined,
        {
          inspectorInjection: {
            reactComponent: FloatingJsonPathPicker,
            props: {
              jsonSocketName: JSONName,
              jsonPathSocketName: JSONParamName,
            },
          },
        }
      ),
      new Socket(SOCKET_TYPE.IN, JSONInsert, new AnyType(), 'newValueOrObject'),
      new Socket(SOCKET_TYPE.OUT, outValueName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const parsedJSON = parseJSON(inputObject[JSONName]);
    if (parsedJSON) {
      outputObject[outValueName] = replacePartOfObject(
        parsedJSON,
        inputObject[JSONParamName],
        inputObject[JSONInsert]
      );
    }
  }
}

class JSONCustomFunction extends CustomFunction {
  public getTags(): string[] {
    return ['JSON'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }
  protected getDefaultParameterValues(): Record<string, any> {
    return { JSONName: {} };
  }
  protected getOutputParameterName(): string {
    return outValueName;
  }
}

export class JSONKeys extends JSONCustomFunction {
  public getName(): string {
    return 'Get all JSON keys';
  }

  public getDescription(): string {
    return 'Gets all keys from a JSON (or object)';
  }

  protected getDefaultFunction(): string {
    return '(a) => {\n\treturn Object.keys(a);\n}';
  }
}

export class JSONValues extends JSONCustomFunction {
  public getName(): string {
    return 'Get all JSON values';
  }

  public getDescription(): string {
    return 'Gets all values from a JSON (or object)';
  }

  protected getDefaultFunction(): string {
    return '(a) => {\n\treturn Object.values(a);\n}';
  }
}

const BREAK_MAX_SOCKETS = 100;

export class Break extends PPNode {
  public getName(): string {
    return 'Break JSON';
  }

  public getDescription(): string {
    return 'Breaks out all properties of a JSON object or an array';
  }

  public getTags(): string[] {
    return ['JSON'].concat(super.getTags());
  }

  public hasExample(): boolean {
    return true;
  }

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, JSONName, new JSONType(true)), new Socket(SOCKET_TYPE.IN, lockOutputsName, new BooleanType(), false, false)];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    // before every execute, re-evaluate inputs
    const currentJSON = inputObject[JSONName];
    if (!inputObject[lockOutputsName]) {
      this.adaptOutputs(currentJSON);
    }
    // cant use keys of input object here becasue i might have nested properties
    this.outputSocketArray.forEach(
      (socket) => {
        const key = socket.name;
        const allSegments = key.split(JSON_SEPARATOR);
        const value = allSegments.reduce((prev, segment) => prev[segment], currentJSON);
        outputObject[key] = value;
      }
    );
  }

  MAX_DEPTH = 5;

  private adaptOutputs(json: any): void {
    // remove all non existing arguments and add all missing (based on the definition we just got)
    // if current JSON is empty, then dont adapt (maybe data just hasnt arrived yet)
    if (json === undefined || Object.keys(json).length === 0 || typeof json !== "object") {
      return;
    }

    const socketsToBeRemoved = this.outputSocketArray.filter(
      (socket) => !(socket.name in json)
    );
    const argumentsToBeAdded = Object.keys(json).filter(
      (key) => !this.outputSocketArray.some((socket) => socket.name === key)
    );
    socketsToBeRemoved.forEach((socket) => {
      this.removeSocket(socket);
    });
    argumentsToBeAdded.forEach((argument) => {
      // block creation of new sockets after a while to not freeze the whole editor
      if (this.outputSocketArray.length < BREAK_MAX_SOCKETS) {
        // if we only have one child, keep unpacking until thers is none or several
        let currentPath = argument;
        let currentVal = json[argument];
        while (currentVal !== undefined && currentVal !== null && typeof currentVal == "object" && Object.keys(currentVal).length == 1) {
          const currentKeys = Object.keys(currentVal);
          const currentKey = currentKeys[0];
          currentVal = currentVal[currentKey];
          currentPath += JSON_SEPARATOR + currentKey;
          //currentKeys = Object.keys(currentVal);
        }

        this.addOutput(currentPath, dataToType(currentVal), true, {}, false);
      }
    });
    if (socketsToBeRemoved.length > 0 || argumentsToBeAdded.length > 0) {
      this.metaInfoChanged();
    }
  }
}

const socketFieldPrefix = "Format ";

const FORMAT_MAX_SOCKETS = 100;

export class Format extends PPNode {
  public getName(): string {
    return 'Format Object Properties';
  }

  public getDescription(): string {
    return 'Customize and transform a JSON object';
  }

  public getTags(): string[] {
    return ['JSON'].concat(super.getTags());
  }

  protected getStandardInputName(){
    return JSONName;
  }


  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, this.getStandardInputName(), new JSONType(true)), new Socket(SOCKET_TYPE.OUT, this.getStandardInputName(), new JSONType(true))];
  }

  protected createUseSocketName(fieldName: string){
    return socketFieldPrefix + fieldName;
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    // before every execute, re-evaluate inputs
    const json = inputObject[JSONName];
    const outJSON = {};

    this.adaptOutputs(json);

    Object.keys(json).forEach(key => {
      const socketName = this.createUseSocketName(key);
      const formatType : FormatJSONInterface = inputObject[socketName];
      if (formatType?.Enabled){
        let transformedName = formatType.Alias;
        if (transformedName.length < 1){
          transformedName = key;
        }
        outJSON[transformedName] = json[key];
      }
    });
    outputObject[JSONName] = outJSON;
  }

  protected adaptOutputs(json: any): void {
    // remove all non existing arguments and add all missing (based on the definition we just got)


    const socketsToBeRemoved = this.inputSocketArray.filter(
      (socket) => {
        const replacedName = socket.name.replaceAll(socketFieldPrefix, "");
        return !(replacedName in json) && socket.name !== this.getStandardInputName()
      }
    );
    const argumentsToBeAdded = Object.keys(json).filter(
      (key) => !this.inputSocketArray.some((socket) => socket.name === this.createUseSocketName(key))
    );
    socketsToBeRemoved.forEach((socket) => {
      this.removeSocket(socket);
    });

    argumentsToBeAdded.forEach((argument) => {
      if (this.inputSocketArray.length < FORMAT_MAX_SOCKETS) {
        this.addInput(this.createUseSocketName(argument), new FormatJSONType(), {Enabled: false, Alias:""});
      }
    });
    if (socketsToBeRemoved.length > 0 || argumentsToBeAdded.length > 0) {
      this.metaInfoChanged();
    }
  }
}


const inputArrayName ="ObjectArray";
export class FormatMap extends Format {
    public getName(): string {
    return 'Format Object Properties (Map)';
  }

  public getDescription(): string {
    return 'Customize and transform an array of JSON objects';
  }

  public getTags(): string[] {
    return ['JSON', "Array"].concat(super.getTags());
  }

  protected getStandardInputName(): string {
   return inputArrayName;
  }

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, inputArrayName, new ArrayType()), new Socket(SOCKET_TYPE.OUT, inputArrayName, new ArrayType())];
  }


  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputArray = inputObject[inputArrayName];

    if (Array.isArray(inputArray) && inputArray.length > 0){
      const json = inputArray[0];

      this.adaptOutputs(json);
      const outputArray = [];
      for (let i = 0; i < inputArray.length; i++){
        outputArray.push({});
      }

      Object.keys(json).forEach((key) => {
        const formatInfo : FormatJSONInterface= inputObject[this.createUseSocketName(key)];
        if (formatInfo?.Enabled){
          const alias = formatInfo.Alias.length < 1 ? key : formatInfo.Alias;
          for (let i = 0; i < inputArray.length; i++){
            outputArray[i][alias] = inputArray[i][key];
          }
        }
      });
      outputObject[inputArrayName] = outputArray;
    }
  }
}


export class Make extends DynamicInputNode {
  public getName(): string {
    return 'Make JSON';
  }

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.OUT, JSONName, new JSONType())].concat(super.getDefaultIO());
  }

  public getDescription(): string {
    return 'Create new JSON from inputs';
  }

  public getTags(): string[] {
    return ['JSON'].concat(super.getTags());
  }

  protected async onExecute(input, output): Promise<void> {
    const outObject = {};
    this.getAllNonDefaultSockets().forEach(socket => {
      outObject[socket.name] = socket.data;
    })
    output[JSONName] = outObject;
  }
}

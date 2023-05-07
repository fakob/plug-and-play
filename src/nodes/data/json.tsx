/* eslint-disable prettier/prettier */
import { JSONPath } from 'jsonpath-plus';
import PPGraph from '../../classes/GraphClass';
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

const JSONName = 'JSON';
const lockOutputsName = "Lock Outputs";
const JSONParamName = 'Path';
const JSONInsert = 'New value';
const outValueName = 'Value';

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

const BREAK_MAX_SOCKETS = 50;
// actually works for arrays as well
export class Break extends PPNode {
  public getName(): string {
    return 'Break';
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
    return [new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()), new Socket(SOCKET_TYPE.IN, lockOutputsName, new BooleanType(),false,false)];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    // before every execute, re-evaluate inputs
    const currentJSON = inputObject[JSONName];
    if (!inputObject[lockOutputsName]){
      this.adaptOutputs(currentJSON);
    }
    // eslint-disable-next-line prefer-const
    Object.keys(currentJSON).forEach(
      (key) => (outputObject[key] = currentJSON[key])
    );
  }

  private adaptOutputs(json: any): void {
    // remove all non existing arguments and add all missing (based on the definition we just got)
    const currentOutputSockets = this.getDataSockets().filter(
      (socket) => socket.socketType === SOCKET_TYPE.OUT
    );
    const socketsToBeRemoved = currentOutputSockets.filter(
      (socket) => json[socket.name] == undefined
    );
    const argumentsToBeAdded = Object.keys(json).filter(
      (key) => !currentOutputSockets.some((socket) => socket.name === key)
    );
    socketsToBeRemoved.forEach((socket) => {
      this.removeSocket(socket);
    });
    argumentsToBeAdded.forEach((argument) => {
      // block creation of new sockets after a while to not freeze the whole editor
      if (this.outputSocketArray.length < BREAK_MAX_SOCKETS) {
        this.addOutput(argument, dataToType(json[argument]), true, {}, false);
      }
    });
    if (socketsToBeRemoved.length > 0 || argumentsToBeAdded.length > 0) {
      this.metaInfoChanged();
    }
  }
}

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

const JSONName = 'JSON';
const JSONParamName = 'Path';
const JSONInsert = 'New value';
const outValueName = 'Value';

export class JSONGet extends PPNode {
  getColor(): TRgba{
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  public getDescription(): string {
    return 'Get the value of a JSON at the defined path';
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name,  {
      ...customArgs,
    });

    this.name = 'Get JSON value';
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
  getColor(): TRgba{
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }
  constructor(name: string, customArgs: CustomArgs) {

    super(name,  {
      ...customArgs,
    });

    this.name = 'Set JSON value';
  }

  public getDescription(): string {
    return 'Set a value on a JSON at the defined path';
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

export class JSONKeys extends PPNode {
  getColor(): TRgba{
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.name = 'Get all JSON properties';
  }

  public getDescription(): string {
    return "Returns an array of the given object's property names";
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()),
      new Socket(SOCKET_TYPE.OUT, outValueName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const parsedJSON = parseJSON(inputObject[JSONName]);
    if (parsedJSON) {
      outputObject[outValueName] = Object.keys(parsedJSON);
    }
  }
}

export class JSONValues extends PPNode {

  getColor(): TRgba{
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }


  public getDescription(): string {
    return 'Returns an array of the given objects values';
  }

  constructor(name: string,  customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.name = 'Get all JSON values';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()),
      new Socket(SOCKET_TYPE.OUT, outValueName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const parsedJSON = parseJSON(inputObject[JSONName]);
    if (parsedJSON) {
      outputObject[outValueName] = Object.values(parsedJSON);
    }
  }
}


// actually works for arrays as well
export class Break extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        JSONName,
        new JSONType(),
      )
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    // before every execute, re-evaluate inputs
    const currentJSON = inputObject[JSONName];
    this.adaptOutputs(currentJSON);
    // eslint-disable-next-line prefer-const
    Object.keys(currentJSON).forEach(key => outputObject[key] = currentJSON[key]);

  }

  private adaptOutputs(json: any): void {
    // remove all non existing arguments and add all missing (based on the definition we just got)
    const currentOutputSockets = this.getDataSockets().filter(
      (socket) => socket.socketType === SOCKET_TYPE.OUT
    );
    const socketsToBeRemoved = currentOutputSockets.filter(
      (socket) =>
        json[socket.name] == undefined
    );
    const argumentsToBeAdded = Object.keys(json).filter(
      (key) =>
        !currentOutputSockets.some((socket) => socket.name === key)
    );
    socketsToBeRemoved.forEach((socket) => {
      socket.destroy();
    });
    argumentsToBeAdded.forEach((argument) => {
      this.addOutput(
        argument,
        new AnyType()
      );
    });
    if (socketsToBeRemoved.length > 0 || argumentsToBeAdded.length > 0) {
      this.metaInfoChanged();
    }
  }
}


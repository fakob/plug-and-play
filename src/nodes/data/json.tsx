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
  constructor(name: string, customArgs: CustomArgs) {
    super(name,  {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = 'Get JSON value';
    this.description = 'Get the value of a JSON at the defined path';
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
    super(name,  {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = 'Set JSON value';
    this.description = 'Set a value on a JSON at the defined path';
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
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = 'Get all JSON properties';
    this.description = "Returns an array of the given object's property names";
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
  constructor(name: string,  customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = 'Get all JSON values';
    this.description = 'Returns an array of the given objects values';
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

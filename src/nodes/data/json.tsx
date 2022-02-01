/* eslint-disable prettier/prettier */
import { JSONPath } from 'jsonpath-plus';
import FloatingJsonPathPicker from '../../components/FloatingJsonPathPicker';
import PureNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';

const JSONName = 'JSON';
const JSONParamName = 'Name 1';
const outValueName = 'Value';

export class JSONGet extends PureNode {
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
    let current = inputObject[JSONName];
    if (current) {
      this.inputSocketArray.forEach((input) => {
        // pretty hacky
        if (input.name.includes('Name')) {
          current = JSONPath({ path: input.data, json: current, wrap: false });
        }
      });
      outputObject[outValueName] = current;
    }
  }

  // keeping it as I want to add/fix this later
  // public getCanAddInput(): boolean {
  //   return true;
  // }

  // public addDefaultInput(): void {
  //   const newName = this.constructSocketName('Name', this.inputSocketArray);
  //   this.addInput(newName, new StringType(), undefined, undefined, {
  //     inspectorInjection: {
  //       reactComponent: FloatingJsonPathPicker,
  //       props: {
  //         jsonSocketName: JSONName,
  //         jsonPathSocketName: newName,
  //         forceRefresh: Math.random(),
  //       },
  //     },
  //   });
  // }
}

export class JSONKeys extends PureNode {
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
    outputObject[outValueName] = Object.keys(inputObject[JSONName] ?? {});
  }
}

export class JSONValues extends PureNode {
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
    outputObject[outValueName] = Object.values(inputObject[JSONName] ?? {});
  }
}

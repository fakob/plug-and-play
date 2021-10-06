/* eslint-disable prettier/prettier */
import  PureNode from '../../classes/NodeClass';
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
      new Socket(SOCKET_TYPE.IN, JSONParamName, new StringType()),
      new Socket(SOCKET_TYPE.OUT, outValueName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    let current = inputObject[JSONName];
    this.inputSocketArray.forEach((input) => {
      // pretty hacky
      if (input.name.includes('Name')) {
        current = current[input.data];
      }
    });
    outputObject[outValueName] = current;
  }

  public getCanAddInput(): boolean {
    return true;
  }

  public addDefaultInput(): void {
    this.addInput(
      this.constructSocketName('Name', this.inputSocketArray),
      new StringType()
    );
  }
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
    outputObject[outValueName] = Object.keys(inputObject[JSONName]);
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
    outputObject[outValueName] = Object.values(inputObject[JSONName]);
  }
}

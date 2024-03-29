import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import { HTTPNode, urlInputName } from './http';

const targetName = 'Target';
const nameName = 'Name';
const methodName = 'Method';
const paramsName = 'Params';
const valueName = 'Value';
const outputContentName = 'Content';

const gatewayAddressDefault = 'http://localhost:16208/gateway/2.0.0/publish';

export class PixotopeGatewayGet extends HTTPNode {
  public getName(): string {
    return 'Pixotope Get';
  }

  public getDescription(): string {
    return 'Pixotope Gateway: Get a value from a service';
  }

  public getTags(): string[] {
    return ['Pixotope'].concat(super.getTags());
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        gatewayAddressDefault,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Store'),
      new Socket(SOCKET_TYPE.IN, nameName, new StringType(), 'State'),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), {}),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const target = inputObject[targetName];
    const name = inputObject[nameName];
    const address = inputObject[urlInputName];
    const body = {
      Topic: {
        Type: 'Get',
        Target: target,
        Name: name,
        RespondTo: 'PlugAndPlay',
      },
      Message: {},
    };
    const response = await this.request(
      {},
      JSON.stringify(body),
      address,
      'Post',
    );
    outputObject[outputContentName] = response[0]?.Message?.Value;
  }
}

export class PixotopeGatewaySet extends HTTPNode {
  public getName(): string {
    return 'Pixotope Set';
  }

  public getDescription(): string {
    return 'Pixotope Gateway: Set a value on a service';
  }

  public getTags(): string[] {
    return ['Pixotope'].concat(super.getTags());
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, false, 1000, this);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        gatewayAddressDefault,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Store'),
      new Socket(
        SOCKET_TYPE.IN,
        nameName,
        new StringType(),
        'State.ThirdParty.PlugAndPlaygroundSettable',
      ),
      new Socket(SOCKET_TYPE.IN, valueName, new AnyType(), 'ExampleValue'),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const target = inputObject[targetName];
    const name = inputObject[nameName];
    const value = inputObject[valueName];
    const address = inputObject[urlInputName];
    await this.request(
      {},
      JSON.stringify({
        Topic: { Type: 'Set', Target: target, Name: name },
        Message: { Value: value },
      }),
      address,
      'Post',
    );
  }
}

export class PixotopeGatewayCall extends HTTPNode {
  public getName(): string {
    return 'Pixotope Call';
  }

  public getDescription(): string {
    return 'Pixotope Gateway: Send a ZMQ call';
  }

  public getTags(): string[] {
    return ['Pixotope'].concat(super.getTags());
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        gatewayAddressDefault,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Store'),
      new Socket(SOCKET_TYPE.IN, methodName, new StringType(), 'GetAllStates'),
      new Socket(SOCKET_TYPE.IN, paramsName, new JSONType(), {
        Fingerprint: 'Playground',
        Name: 'PlaygroundCamera',
      }),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), {}),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    this.status.custom = [];
    const target = inputObject[targetName];
    const method = inputObject[methodName];
    const params = inputObject[paramsName];
    const address = inputObject[urlInputName];

    const res = await this.request(
      {},
      JSON.stringify({
        Topic: { Type: 'Call', Target: target, Method: method },
        Message: { Params: params },
      }),
      address,
      'Post',
    );

    outputObject[outputContentName] = res[0]?.Message?.Result;
  }
}

import PPNode, { UpdateBehaviour } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';

const targetName = 'Target';
const nameName = 'Name';
const methodName = 'Method';
const paramsName = 'Params';
const valueName = 'Value';
const outputContentName = 'Content';

export class PixotopeGatewayGet extends PPNode {
  // default to poll on interval X seconds
  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, true, 3000);
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Store'),
      new Socket(SOCKET_TYPE.IN, nameName, new StringType(), 'State'),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), ''),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const target = inputObject[targetName];
    const name = inputObject[nameName];
    const res = await fetch('http://localhost:16208/gateway/2.0.0/publish', {
      method: 'POST',
      body: JSON.stringify({
        Topic: {
          Type: 'Get',
          Target: target,
          Name: name,
          RespondTo: 'PlugAndPlay',
        },
        Message: {},
      }),
    });

    outputObject[outputContentName] = (await res.json()).Message.Value;
  }
}

export class PixotopeGatewaySet extends PPNode {
  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, false, 1000);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Store'),
      new Socket(
        SOCKET_TYPE.IN,
        nameName,
        new StringType(),
        'State.ThirdParty.PlugAndPlaygroundSettable'
      ),
      new Socket(SOCKET_TYPE.IN, valueName, new StringType(), 'TempValue'),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const target = inputObject[targetName];
    const name = inputObject[nameName];
    const value = inputObject[valueName];

    fetch('http://localhost:16208/gateway/2.0.0/publish', {
      method: 'POST',
      body: JSON.stringify({
        Topic: { Type: 'Set', Target: target, Name: name },
        Message: { Value: value },
      }),
    });
  }
}

export class PixotopeGatewayCall extends PPNode {
  // default to poll on interval X seconds
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Store'),
      new Socket(
        SOCKET_TYPE.IN,
        methodName,
        new StringType(),
        'AddDefaultCamera'
      ),
      new Socket(SOCKET_TYPE.IN, paramsName, new JSONType(), {
        Fingerprint: 'Playground',
        Name: 'PlaygroundCamera',
      }),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), ''),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const target = inputObject[targetName];
    const method = inputObject[methodName];
    const params = inputObject[paramsName];

    const res = await fetch('http://localhost:16208/gateway/2.0.0/publish', {
      method: 'POST',
      body: JSON.stringify({
        Topic: { Type: 'Call', Target: target, Method: method },
        Message: { Params: params },
      }),
    });
    outputObject[outputContentName] = (await res.json()).Message.Result;
  }
}

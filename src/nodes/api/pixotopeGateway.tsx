import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { ImageType } from '../datatypes/imageType';
import { JSONType } from '../datatypes/jsonType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';

const targetName = 'Target';
const nameName = 'Name';
const methodName = 'Method';
const paramsName = 'Params';
const valueName = 'Value';
const outputContentName = 'Content';
const nodeName = 'Node';
const scaleName = 'Scale';
const addressName = 'Address';

const gatewayAddressDefault = 'http://localhost:16208/gateway/2.0.0/publish';

export class PixotopeGatewayGet extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        addressName,
        new StringType(),
        gatewayAddressDefault,
        false
      ),
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
    const address = inputObject[addressName];
    const res = await fetch(address, {
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
    const JSONRes = await res.json();
    outputObject[outputContentName] = JSONRes[0]?.Message?.Value;
  }
}

export class PixotopeGatewaySet extends PPNode {
  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        addressName,
        new StringType(),
        gatewayAddressDefault,
        false
      ),
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
    const address = inputObject[addressName];
    fetch(address, {
      method: 'POST',
      body: JSON.stringify({
        Topic: { Type: 'Set', Target: target, Name: name },
        Message: { Value: value },
      }),
    });
  }
}

export class PixotopeGatewayCall extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        addressName,
        new StringType(),
        gatewayAddressDefault,
        false
      ),
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Store'),
      new Socket(SOCKET_TYPE.IN, methodName, new StringType(), 'VideoIO'),
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
    const address = inputObject[addressName];
    const res = await fetch(address, {
      method: 'POST',
      body: JSON.stringify({
        Topic: { Type: 'Call', Target: target, Method: method },
        Message: { Params: params },
      }),
    });
    outputObject[outputContentName] = (await res.json())[0]?.Message?.Result;
  }
}

export class PixotopeGatewayCallSaveImage extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        addressName,
        new StringType(),
        gatewayAddressDefault,
        false
      ),
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Pipeline'),
      new Socket(SOCKET_TYPE.IN, nodeName, new StringType(), 'XXX'),
      new Socket(
        SOCKET_TYPE.IN,
        scaleName,
        new NumberType(false, 0.1, 1.0, 0.01),
        0.1
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new ImageType(), ''),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const address = inputObject[addressName];
    const res = await fetch(address, {
      method: 'POST',
      body: JSON.stringify({
        Topic: {
          Type: 'Call',
          Target: inputObject[targetName],
          Method: 'SaveImage',
        },
        Message: {
          Params: {
            Nodes: [inputObject[nodeName]],
            Scale: inputObject[scaleName],
          },
        },
      }),
    });
    outputObject[outputContentName] = (
      await res.json()
    )[0]?.Message?.Result?.Image;
  }
}

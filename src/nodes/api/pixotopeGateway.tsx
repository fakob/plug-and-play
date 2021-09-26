import PPNode, { UpdateBehaviour } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';

const targetName = 'Target';
const nameName = 'Name';
const methodName = 'Method';
const paramsName = 'Params';
const outputContentName = 'Content';

export class PixotopeGatewayGet extends PPNode {
  // default to poll on interval X seconds
  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, true, 1000);
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
    const assembledString =
      'http://localhost:16208/gateway/2.0.0/publish?Target=' +
      target +
      '&Type=Get&Name=' +
      name;
    const res = await fetch(assembledString);
    outputObject[outputContentName] = await res.json();
  }
}

/*export class PixotopeGatewaySet extends PPNode {
  // default to poll on interval X seconds
  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, true, 1000);
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, targetName, new StringType(), 'Store'),
      new Socket(SOCKET_TYPE.IN, nameName, new StringType(), 'State'),
      new Socket(SOCKET_TYPE.IN, )
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), ''),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const target = inputObject[targetName];
    const name = inputObject[nameName];
    const assembledString =
      'http://localhost:16208/gateway/2.0.0/publish?Target=' +
      target +
      '&Type=Get&Name=' +
      name;
    const res = await fetch(assembledString);
    outputObject[outputContentName] = await res.json();
  }
}*/

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
    const paramsString = Object.keys(params).reduce(
      (prev, curr) => prev + '&Param' + curr + '=' + params[curr],
      ''
    );

    const assembledString =
      'http://localhost:16208/gateway/2.0.0/publish?Type=Call&Target=' +
      target +
      '&Method=' +
      method +
      paramsString;

    const res = await fetch(assembledString);
    console.log('assembled: ' + assembledString);
    outputObject[outputContentName] = await res.json();
  }
}

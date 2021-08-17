import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { DATATYPE, SOCKET_TYPE } from '../../utils/constants';

const elementName = 'Element';
const arrayName = 'Array';
const indexName = 'Index';

export class ArrayCreate extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, elementName, DATATYPE.ANY),
      new Socket(SOCKET_TYPE.OUT, arrayName, DATATYPE.ARRAY),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const elements = Object.keys(inputObject).map((key) => inputObject[key]);
    outputObject[arrayName] = elements;
  }

  getCanAddInput(): boolean {
    return true;
  }
}

export class ArrayGet extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, arrayName, DATATYPE.ARRAY),
      new Socket(SOCKET_TYPE.IN, indexName, DATATYPE.NUMBER, 0, true, {
        round: true,
        minValue: 1000,
      }),
      new Socket(SOCKET_TYPE.OUT, elementName, DATATYPE.ANY),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[elementName] = inputObject[arrayName][inputObject[indexName]];
  }
}

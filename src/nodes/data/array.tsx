/* eslint-disable prettier/prettier */
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { DATATYPE, SOCKET_TYPE } from '../../utils/constants';

const inElementName = 'Element';
const outArrayName = 'Array';

export class CreateArray extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inElementName, DATATYPE.ANY),
      new Socket(SOCKET_TYPE.OUT, outArrayName, DATATYPE.STRING),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const elements = Object.keys(inputObject).map((key) => inputObject[key]);
    outputObject[outArrayName] = elements;
  }

  getCanAddInput(): boolean {
    return true;
  }
}

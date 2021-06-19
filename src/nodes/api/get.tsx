import PPGraph from '../../classes/GraphClass';
import PPNode, { UpdateBehaviour } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { DATATYPE, NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';

const urlInputName = 'URL';
const outputContentName = 'Content';

export class Get extends PPNode {
  // default to poll on interval X seconds
  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, true, 10000);
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        DATATYPE.STRING,
        'https://jsonplaceholder.typicode.com/posts'
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, DATATYPE.STRING, ''),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const res = await fetch(inputObject[urlInputName]);
    outputObject[outputContentName] = await res.json();
  }
}

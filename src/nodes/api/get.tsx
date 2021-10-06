import PPGraph from '../../classes/GraphClass';
import PureNode, { UpdateBehaviour } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';

const urlInputName = 'URL';
const outputContentName = 'Content';

export class Get extends PureNode {
  // default to poll on interval X seconds
  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, true, 10000);
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        'https://jsonplaceholder.typicode.com/posts'
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), ''),
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

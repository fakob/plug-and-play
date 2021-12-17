import PureNode, { UpdateBehaviour } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { ArrayType } from '../datatypes/arrayType';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';

const urlInputName = 'URL';
const bodyInputName = 'Body';
const headersInputName = 'Headers';
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
      new Socket(SOCKET_TYPE.IN, headersInputName, new JSONType(), {
        'Content-Type': 'application/json',
      }),

      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), ''),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const res = await fetch(inputObject[urlInputName], {
      method: 'Get',
      headers: JSON.parse(inputObject[headersInputName]),
    });
    outputObject[outputContentName] = await res.json();
  }
}

export class Post extends PureNode {
  // default to only manual
  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, false, 10000);
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        'https://jsonplaceholder.typicode.com/posts'
      ),
      new Socket(SOCKET_TYPE.IN, headersInputName, new JSONType(), {
        'Content-Type': 'application/json',
      }),
      new Socket(SOCKET_TYPE.IN, bodyInputName, new JSONType(), {}),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), ''),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const response = await fetch(inputObject[urlInputName], {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: JSON.parse(inputObject[headersInputName]),
      body: inputObject[bodyInputName], // body data type must match "Content-Type" header
    });
    outputObject[outputContentName] = await response.json();
  }
}

import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { BooleanType } from '../datatypes/booleanType';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';

const urlInputName = 'URL';
const bodyInputName = 'Body';
const headersInputName = 'Headers';
const outputContentName = 'Content';
const sendThroughCompanionName = 'Send Through Companion';
const sendThroughCompanionAddress = 'Companion Location';

export class Get extends PPNode {
  // default to poll on interval X seconds
  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, true, 10000);
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
      new Socket(
        SOCKET_TYPE.IN,
        sendThroughCompanionName,
        new BooleanType(),
        false
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        sendThroughCompanionAddress,
        new StringType(),
        'http://localhost:6655',
        () => this.getInputData(sendThroughCompanionName)
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), ''),
    ];
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    // TODO implement actual companion support
    const usingCompanion: boolean = inputObject[sendThroughCompanionName];
    let res: Promise<Response> = undefined;
    if (usingCompanion) {
      const allHeaders = JSON.parse(
        JSON.stringify(inputObject[headersInputName])
      );
      allHeaders.finalURL = inputObject[urlInputName];
      res = fetch(inputObject[sendThroughCompanionAddress], {
        method: 'Get',
        headers: { forwardedHeaders: JSON.stringify(allHeaders) },
      });
    } else {
      res = fetch(inputObject[urlInputName], {
        method: 'Get',
        headers: inputObject[headersInputName],
      });
    }
    outputObject[outputContentName] = await (await res).json();
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class Post extends PPNode {
  // default to only manual
  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 10000);
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
      new Socket(
        SOCKET_TYPE.IN,
        sendThroughCompanionName,
        new BooleanType(),
        false
      ),
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
      headers: inputObject[headersInputName],
      body: inputObject[bodyInputName], // body data type must match "Content-Type" header
    });
    outputObject[outputContentName] = await response.json();
  }
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
  }
}

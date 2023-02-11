import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { BooleanType } from '../datatypes/booleanType';
import { EnumStructure, EnumType } from '../datatypes/enumType';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';

const urlInputName = 'URL';
const bodyInputName = 'Body';
const headersInputName = 'Headers';
const outputContentName = 'Content';
const sendThroughCompanionName = 'Send Through Companion';
const sendThroughCompanionAddress = 'Companion Location';
const methodName = 'Method';

const HTTPMethodOptions: EnumStructure = [
  'Get',
  'Post',
  'Put',
  'Patch',
  'Delete',
].map((val) => {
  return { text: val, value: val };
});

export class HTTPNode extends PPNode {
  public getName(): string {
    return 'HTTP';
  }
  public getDescription(): string {
    return 'HTTP request (Get,Post,Put,Patch,Delete)';
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
        methodName,
        new EnumType(HTTPMethodOptions),
        HTTPMethodOptions[0].text
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        bodyInputName,
        new JSONType(),
        {},
        () => this.getInputData(methodName) !== 'Get'
      ),
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

  errorColor = TRgba.fromString('#B71C1C');
  successColor = TRgba.fromString('#4BB543');

  private pushStatusCode(statusCode: number): void {
    this.statuses.push({
      color: statusCode > 400 ? this.errorColor : this.successColor,
      statusText: 'Status: ' + statusCode,
    });
    this.drawStatuses();
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const usingCompanion: boolean = inputObject[sendThroughCompanionName];
    let awaitedRes: Response = undefined;
    this.statuses = [];
    if (usingCompanion) {
      this.statuses.push({
        color: TRgba.white().multiply(0.5),
        statusText: 'Companion',
      });
      try {
        const companionSpecific = {
          finalHeaders: inputObject[headersInputName],
          finalBody: inputObject[bodyInputName],
          finalURL: inputObject[urlInputName],
          finalMethod: inputObject[methodName],
        };
        if (inputObject[methodName] == 'Get') {
          delete companionSpecific.finalBody;
        }
        const res = fetch(inputObject[sendThroughCompanionAddress], {
          method: 'Post',
          headers: inputObject[headersInputName],
          body: JSON.stringify(companionSpecific),
        });
        awaitedRes = await res;
      } catch (error) {
        this.pushStatusCode(404);
        throw 'Unable to reach companion, is it running at designated address?';
      }
    } else {
      // no body if Get
      const body =
        inputObject[methodName] !== 'Get'
          ? inputObject[bodyInputName]
          : undefined;
      const res = fetch(inputObject[urlInputName], {
        method: inputObject[methodName],
        headers: inputObject[headersInputName],
        body: body,
      });
      awaitedRes = await res;
    }
    this.pushStatusCode(awaitedRes.status);

    outputObject[outputContentName] = await awaitedRes.json();
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

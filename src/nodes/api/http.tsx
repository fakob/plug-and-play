import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  errorColor,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  successColor,
} from '../../utils/constants';
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

const companionDefaultAddress = 'http://localhost:6655';

export class HTTPNode extends PPNode {
  public getName(): string {
    return 'HTTP';
  }
  public getDescription(): string {
    return 'HTTP request (Get,Post,Put,Patch,Delete)';
  }
  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return true;
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
        companionDefaultAddress,
        () => this.getInputData(sendThroughCompanionName)
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), ''),
    ];
  }

  protected pushStatusCode(statusCode: number): void {
    this.statuses.push({
      color: statusCode > 400 ? errorColor : successColor,
      statusText: 'Status: ' + statusCode,
    });
    this.drawStatuses();
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const usingCompanion: boolean = inputObject[sendThroughCompanionName];
    this.statuses = [];
    let returnResponse = {};
    if (usingCompanion) {
      this.statuses.push({
        color: TRgba.white().multiply(0.5),
        statusText: 'Companion',
      });
      try {
        const companionSpecific = {
          finalHeaders: inputObject[headersInputName],
          finalBody: JSON.stringify(inputObject[bodyInputName]),
          finalURL: inputObject[urlInputName],
          finalMethod: inputObject[methodName],
        };
        console.log('URL: ' + inputObject[urlInputName]);
        console.log('Method: ' + inputObject[methodName]);
        const res = fetch(inputObject[sendThroughCompanionAddress], {
          method: 'Post',
          headers: inputObject[headersInputName],
          body: JSON.stringify(companionSpecific),
        });
        const companionRes = await (await res).json();
        try {
          returnResponse = JSON.parse(companionRes.response);
        } catch (error) {
          returnResponse = companionRes.response;
        }
        this.pushStatusCode(companionRes.status);
        //console.log('awaitedres: ' + (await (await res).text()));
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
      const awaitedRes = await res;
      returnResponse = await awaitedRes.json();
      this.pushStatusCode(awaitedRes.status);
    }

    outputObject[outputContentName] = returnResponse;
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class ChatGPTNode extends HTTPNode {
  public getName(): string {
    return 'ChatGPT - Companion';
  }
  public getDescription(): string {
    return 'ChatGPT communication through P&P Companion';
  }
  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return true;
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'Input', new JSONType(), {
        prompt: 'Give me a quick rundown of the battle of Hastings',
        max_tokens: 10,
        n: 1,
        temperature: 0.8,
        top_p: 1,
      }),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        sendThroughCompanionAddress,
        new StringType(),
        companionDefaultAddress,
        () => this.getInputData(sendThroughCompanionName)
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new StringType(), ''),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    this.statuses = [];
    let returnResponse = {};
    this.statuses.push({
      color: TRgba.white().multiply(0.5),
      statusText: 'Companion',
    });
    try {
      const companionSpecific = {
        finalHeaders: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ${OPENAI_KEY}',
        },
        finalBody: JSON.stringify(inputObject['Input']),
        finalURL:
          'https://api.openai.com/v1/engines/text-davinci-002/completions',
        finalMethod: 'Post',
      };
      const res = fetch(inputObject[sendThroughCompanionAddress], {
        method: 'Post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companionSpecific),
      });
      console.log(res.toString());
      const companionRes = await (await res).json();
      try {
        this.pushStatusCode(companionRes.status);
        returnResponse = JSON.parse(companionRes.response);
      } catch (error) {
        returnResponse = companionRes.response;
      }
    } catch (error) {
      console.log(error.stack);
      throw 'Unable to reach companion, is it running at designated address?';
    }

    outputObject[outputContentName] = returnResponse;
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

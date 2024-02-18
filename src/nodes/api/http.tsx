import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  NodeExecutionWarning,
  PNPCustomStatus,
} from '../../classes/ErrorClass';
import { wrapDownloadLink } from '../../utils/utils';
import {
  ERROR_COLOR,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  SUCCESS_COLOR,
} from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { BooleanType } from '../datatypes/booleanType';
import { EnumStructure, EnumType } from '../datatypes/enumType';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';

export const urlInputName = 'URL';
const bodyInputName = 'Body';
const headersInputName = 'Headers';
export const outputContentName = 'Content';
export const sendThroughCompanionName = 'Send Through Companion';
export const sendThroughCompanionAddress = 'Companion Location';
export const companionDefaultAddress = 'http://localhost:6655';
const methodName = 'Method';

export const HTTPMethodOptions: EnumStructure = [
  'Get',
  'Post',
  'Put',
  'Patch',
  'Delete',
].map((val) => {
  return { text: val, value: val };
});

export interface CompanionResponse {
  status: number;
  response: string;
}

export class HTTPNode extends PPNode {
  public getName(): string {
    return 'HTTP';
  }

  public getDescription(): string {
    return 'Make an HTTP request to get data from or send data to a server or API';
  }

  public getAdditionalDescription(): string {
    return `<p>${wrapDownloadLink(
      'https://github.com/magnificus/pnp-companion-2/releases/',
      'Download Plug and Play Companion',
    )}</p>`;
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return !socket.isInput();
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        'https://jsonplaceholder.typicode.com/posts',
      ),
      new Socket(
        SOCKET_TYPE.IN,
        headersInputName,
        new JSONType(),
        HTTPNode.defaultHeaders,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        methodName,
        new EnumType(HTTPMethodOptions),
        HTTPMethodOptions[0].text,
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        bodyInputName,
        new JSONType(),
        {},
        () => this.getInputData(methodName) !== 'Get',
      ),
      new Socket(
        SOCKET_TYPE.IN,
        sendThroughCompanionName,
        new BooleanType(),
        false,
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        sendThroughCompanionAddress,
        new StringType(),
        companionDefaultAddress,
        () => this.getInputData(sendThroughCompanionName),
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), {}),
    ];
  }

  protected pushExclusiveStatus(status: PNPCustomStatus) {
    this.status.custom = this.status.custom.filter(
      (existingStatus) => status.id !== existingStatus.id,
    );
    this.status.custom.push(status);
    this.drawStatuses();
  }

  protected pushStatusCode(statusCode: number): void {
    this.pushExclusiveStatus(
      new PNPCustomStatus(
        'Status: ' + statusCode,
        statusCode >= 400 ? ERROR_COLOR : SUCCESS_COLOR,
        'statuscode',
      ),
    );
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const usingCompanion: boolean = inputObject[sendThroughCompanionName];
    outputObject[outputContentName] = await this.request(
      inputObject[headersInputName],
      inputObject[bodyInputName],
      inputObject[urlInputName],
      inputObject[methodName],
      usingCompanion,
      inputObject[sendThroughCompanionAddress],
    );
  }

  protected async request(
    headers: HeadersInit,
    body: BodyInit,
    url: string,
    method: 'Get' | 'Post',
    usingCompanion = false,
    companionAddress = '',
  ): Promise<object> {
    this.status.custom = [];
    let returnResponse = {};
    try {
      if (usingCompanion) {
        this.status.custom.push(
          new PNPCustomStatus('Companion', TRgba.white().multiply(0.5)),
        );
        const companionRes = await HTTPNode.sendThroughCompanion(
          companionAddress,
          headers,
          body,
          url,
          method,
        );

        this.pushStatusCode(companionRes.status);
        returnResponse = companionRes.response;
        return JSON.parse(companionRes.response);
      } else {
        // no body if Get
        const bodyToUse: BodyInit = method !== 'Get' ? body : undefined;
        const res = fetch(url, {
          method: method,
          headers: headers,
          body: bodyToUse,
        });
        const awaitedRes = await res;
        this.pushStatusCode(awaitedRes.status);
        returnResponse = await awaitedRes.json();
        return returnResponse;
      }
    } catch (error) {
      console.trace(error);
      // something went terribly wrong with the request
      this.pushStatusCode(400);
      this.setStatus(
        new NodeExecutionWarning(`${error}
This might be due to the endpoints CORS policy, which prevents other websites from accessing this URL.
Select the HTTP node and in the Info tab on the right download and run the Plug and Play Companion app.
Then in the HTTP node enable "Send Through Companion"`),
      );
      return {};
    }
  }

  static async sendThroughCompanion(
    companionAddress,
    headers,
    body,
    URL,
    method: 'Get' | 'Post',
  ): Promise<CompanionResponse> {
    try {
      const companionSpecific = {
        finalHeaders: headers,
        finalBody: method == 'Post' ? JSON.stringify(body) : '{}',
        finalURL: URL,
        finalMethod: method,
      };
      const res = fetch(companionAddress, {
        method: 'Post',
        headers: headers,
        body: JSON.stringify(companionSpecific),
      });
      const awaitedRes = await res;
      if (!(await res).ok) {
        return { status: awaitedRes.status, response: awaitedRes.statusText };
      }
      const companionRes: CompanionResponse = await awaitedRes.json();
      return companionRes;
    } catch (error) {
      return { status: 404, response: error };
    }
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  static getDefaultBearerHeaders(key) {
    return { ...this.getBearerAuthentication(key), ...this.defaultHeaders };
  }
  static getBearerAuthentication(key) {
    return { Authorization: 'Bearer ' + key };
  }

  static defaultHeaders = { 'Content-Type': 'application/json' };
}

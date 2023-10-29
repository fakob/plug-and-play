import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
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
    return true;
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

  protected pushStatusCode(statusCode: number): void {
    this.statuses.push({
      color: statusCode > 400 ? ERROR_COLOR : SUCCESS_COLOR,
      statusText: 'Status: ' + statusCode,
    });
    this.drawStatuses();
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const usingCompanion: boolean = inputObject[sendThroughCompanionName];
    this.statuses = [];
    let returnResponse = {};
    if (usingCompanion) {
      this.statuses.push({
        color: TRgba.white().multiply(0.5),
        statusText: 'Companion',
      });
      //console.log('awaitedres: ' + (await (await res).text()));
      const companionRes = await HTTPNode.sendThroughCompanion(
        inputObject[sendThroughCompanionAddress],
        inputObject[headersInputName],
        inputObject[bodyInputName],
        inputObject[urlInputName],
        inputObject[methodName],
      );

      returnResponse = companionRes.response;
      this.pushStatusCode(companionRes.status);
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

  static async sendThroughCompanion(
    companionAddress,
    headers,
    body,
    URL,
    method,
  ): Promise<CompanionResponse> {
    try {
      const companionSpecific = {
        finalHeaders: headers,
        finalBody: JSON.stringify(body),
        finalURL: URL,
        finalMethod: method,
      };
      const res = fetch(companionAddress, {
        method: 'Post',
        headers: headers,
        body: JSON.stringify(companionSpecific),
      });
      const companionRes: CompanionResponse = await (await res).json();
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

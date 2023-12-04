import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import {
  HTTPNode,
  companionDefaultAddress,
  outputContentName,
  sendThroughCompanionAddress,
  urlInputName,
} from './http';

const twitterAuthKey = 'Twitter API Key';

export class Twitter extends HTTPNode {
  public getName(): string {
    return 'Twitter - Get - Companion';
  }

  public getDescription(): string {
    return 'Twitter GET to query data, using companion';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        'https://api.twitter.com/2/tweets/search/recent?query=from:twitterdev',
      ),
      new Socket(
        SOCKET_TYPE.IN,
        twitterAuthKey,
        new StringType(),
        '${TWITTER_TOKEN}',
      ),
      new Socket(
        SOCKET_TYPE.IN,
        sendThroughCompanionAddress,
        new StringType(),
        companionDefaultAddress,
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), {}),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    this.status.custom = [];

    outputObject[outputContentName] = await HTTPNode.sendThroughCompanion(
      inputObject[sendThroughCompanionAddress],
      HTTPNode.getDefaultBearerHeaders(inputObject[twitterAuthKey]),
      {},
      inputObject[urlInputName],
      'Get',
    );
  }
}

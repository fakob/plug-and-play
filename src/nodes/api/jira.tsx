import Socket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { SOCKET_TYPE, NODE_TYPE_COLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { JSONType } from '../datatypes/jsonType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';
import {
  HTTPNode,
  companionDefaultAddress,
  outputContentName,
  sendThroughCompanionAddress,
  urlInputName,
} from './http';

const jiraAuthKey = 'JIRA API Key';
const jiraEmail = 'JIRA Email';

const jql = 'JQL';
const startAt = 'Start At';

abstract class Jira_Base extends HTTPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        'https://your-jira-domain.atlassian.net/rest/api/2',
      ),
      new Socket(SOCKET_TYPE.IN, jiraAuthKey, new StringType(), 'JIRA_TOKEN'),
      new Socket(SOCKET_TYPE.IN, jiraEmail, new StringType(), 'JIRA_MAIL'),
      new Socket(SOCKET_TYPE.IN, startAt, new NumberType(), 0),
      new Socket(
        SOCKET_TYPE.IN,
        sendThroughCompanionAddress,
        new StringType(),
        companionDefaultAddress,
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), {}),
    ];
  }

  protected static getAuthorizationHeader(inputObject: any) {
    return `Basic $BASE64_ENCODE\{${inputObject[jiraEmail]}:${inputObject[jiraAuthKey]}\}`;
  }

  public getDescription(): string {
    return 'JIRA communication through the Plug and Play Companion, uses environmental variable for API key';
  }
}

abstract class Jira_Get extends Jira_Base {
  protected abstract getAddress(inputObject: any): string;

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    this.statuses = [];

    outputObject[outputContentName] = await HTTPNode.sendThroughCompanion(
      inputObject[sendThroughCompanionAddress],
      {
        ...{ Authorization: Jira_Base.getAuthorizationHeader(inputObject) },
        ...Jira_Get.defaultHeaders,
      },
      {},
      inputObject[urlInputName] +
        this.getAddress(inputObject) +
        '&maxResults=100&startAt=' +
        inputObject[startAt],
      'Get',
    );
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class Jira_GetProjects extends Jira_Get {
  protected getAddress(): string {
    return '/project';
  }
  public getName(): string {
    return 'JIRA - Get Projects - Companion';
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000, this);
  }
}

export class Jira_GetIssues extends Jira_Get {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        jql,
        new StringType(),
        'created >= startOfDay(-1d)',
      ),
    ].concat(super.getDefaultIO());
  }

  protected getAddress(inputObject: any): string {
    return '/search?jql=' + inputObject[jql];
  }
  public getName(): string {
    return 'JIRA - Get Issues - Companion';
  }

  public getDescription(): string {
    return 'Enter your own JQL query to filter issues';
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000, this);
  }
}

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
  defaultHeaders,
  outputContentName,
  sendThroughCompanionAddress,
  urlInputName,
} from './http';

const jiraEnvironmentalVariableAuthKey = 'JIRA API Key';
const jiraEmail = 'JIRA Email';

abstract class Jira_Base extends HTTPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        'https://your-jira-domain.atlassian.net/rest/api/2',
      ),
      new Socket(
        SOCKET_TYPE.IN,
        jiraEnvironmentalVariableAuthKey,
        new StringType(),
        'JIRA_TOKEN',
      ),
      new Socket(SOCKET_TYPE.IN, jiraEmail, new StringType(), 'JIRA_MAIL'),
      new Socket(
        SOCKET_TYPE.IN,
        sendThroughCompanionAddress,
        new StringType(),
        companionDefaultAddress,
      ),
      new Socket(SOCKET_TYPE.OUT, outputContentName, new JSONType(), {}),
    ];
  }

  public getDescription(): string {
    return 'JIRA communication through the Plug and Play Companion, uses environmental variable for API key';
  }
}

abstract class Jira_Get extends Jira_Base {
  protected abstract getAddress(): string;

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    this.statuses = [];

    const AUTHORIZATION_HEADER_VALUE = `Basic $BASE64_ENCODE\{${inputObject[jiraEmail]}:$\{${inputObject[jiraEnvironmentalVariableAuthKey]}\}\}`;

    outputObject[outputContentName] = await HTTPNode.sendThroughCompanion(
      inputObject[sendThroughCompanionAddress],
      {
        ...{ Authorization: AUTHORIZATION_HEADER_VALUE },
        ...defaultHeaders,
      },
      {},
      inputObject[urlInputName] + this.getAddress(),
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

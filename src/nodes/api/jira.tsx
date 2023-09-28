import Socket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { SOCKET_TYPE, NODE_TYPE_COLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import {
  HTTPNode,
  companionDefaultAddress,
  outputContentName,
  sendThroughCompanionAddress,
  urlInputName,
} from './http';

const jiraEnvironmentalVariableAuthKey = 'JIRA API Key';
const jiraEmail = 'JIRA Email';

export class Jira_GetIssue extends HTTPNode {
  public getName(): string {
    return 'JIRA - Companion';
  }

  public getDescription(): string {
    return 'JIRA communication through the Plug and Play Companion, uses environmental variable for API key';
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000);
  }

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
      new Socket(SOCKET_TYPE.IN, jiraEmail, new StringType(), 'YOUREMAIL'),
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
    this.statuses = [];
    let returnResponse = {};
    const AUTHORIZATION_HEADER_VALUE = `Basic ${Buffer.from(
      inputObject[jiraEmail] +
        ':' +
        inputObject[jiraEnvironmentalVariableAuthKey],
    ).toString('base64')}`;

    const options = {
      hostname: JIRA_API_BASE_URL,
      port: 443,
      path: `/rest/api/2/issue/${issueIdOrKey}`,
      method: 'GET',
      headers: {
        Authorization: AUTHORIZATION_HEADER_VALUE,
        'Content-Type': 'application/json',
      },
    };

    this.statuses.push({
      color: TRgba.white().multiply(0.5),
      statusText: 'Companion',
    });
    try {
      const finalOptions = JSON.parse(
        JSON.stringify(inputObject[chatGPTOptionsName]),
      );
      finalOptions.prompt = inputObject[chatGPTPromptName];
      const companionSpecific = {
        finalHeaders: {
          'Content-Type': 'application/json',
          Authorization:
            'Bearer ${' +
            inputObject[chatGPTEnvironmentalVariableAuthKey] +
            '}',
        },
        finalBody: JSON.stringify(finalOptions),
        finalURL: inputObject[urlInputName],
        finalMethod: 'Post',
      };
      const res = fetch(inputObject[sendThroughCompanionAddress], {
        method: 'Post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companionSpecific),
      });
      const companionRes = await (await res).json();
      try {
        this.pushStatusCode(companionRes.status);
        //console.log('res: ' + companionRes.response);
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
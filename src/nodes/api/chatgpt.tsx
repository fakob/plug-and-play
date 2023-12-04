import Socket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { PNPCustomStatus } from '../../classes/ErrorClass';
import { SOCKET_TYPE, NODE_TYPE_COLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { wrapDownloadLink } from '../../utils/utils';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import {
  HTTPNode,
  companionDefaultAddress,
  outputContentName,
  sendThroughCompanionAddress,
  urlInputName,
} from './http';

const chatGPTPromptName = 'Prompt';
const chatGPTOptionsName = 'Options';
const chatGPTEnvironmentalVariableAuthKey = 'API Key Name';

export class ChatGPTNode extends HTTPNode {
  public getName(): string {
    return 'ChatGPT - Companion';
  }

  public getDescription(): string {
    return 'ChatGPT communication through the Plug and Play Companion, uses environmental variable for API key';
  }

  public getAdditionalDescription(): string {
    return `<p>${wrapDownloadLink(
      'https://github.com/magnificus/pnp-companion-2/releases/',
      'Download Plug and Play Companion',
    )}</p>`;
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000, this);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        urlInputName,
        new StringType(),
        'https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions',
      ),
      new Socket(
        SOCKET_TYPE.IN,
        chatGPTPromptName,
        new StringType(),
        'Give me a quick rundown of the battle of Hastings',
      ),
      new Socket(SOCKET_TYPE.IN, chatGPTOptionsName, new JSONType(), {
        max_tokens: 100,
        n: 1,
        temperature: 0.8,
        top_p: 1,
      }),
      new Socket(
        SOCKET_TYPE.IN,
        chatGPTEnvironmentalVariableAuthKey,
        new StringType(),
        'OPENAI_KEY',
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
    let returnResponse = {};
    this.status.custom.push(
      new PNPCustomStatus('Companion', TRgba.white().multiply(0.5)),
    );
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

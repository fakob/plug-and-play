import PPSocket from '../../classes/SocketClass';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import PPNode from '../../classes/NodeClass';
import { JSONType } from '../datatypes/jsonType';
import { CodeType } from '../datatypes/codeType';
import PPGraph from '../../classes/GraphClass';

const outputSocketName = 'Output';
const inputSocketName = 'Input';

const IMPORT_NAME = 'xml2js';

export class XMLReader extends PPNode {
  public getName(): string {
    return 'XML reader';
  }

  public getDescription(): string {
    return 'Reads XML files and returns a JSON';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.OUT,
        outputSocketName,
        new JSONType(),
        undefined,
        true,
      ),
      new PPSocket(SOCKET_TYPE.IN, inputSocketName, new CodeType(), '', true),
    ];
  }

  public onNodeAdded = async (source?: TNodeSource): Promise<void> => {
    this.executeOptimizedChain();

    super.onNodeAdded(source);
  };

  protected async onExecute(input, output): Promise<void> {
    const result = await PPGraph.currentGraph.dynamicImports[
      IMPORT_NAME
    ].parseStringPromise(this.getInputData(inputSocketName));
    const json = JSON.stringify(result);
    output[outputSocketName] = json;
  }

  public getDynamicImports(): string[] {
    return [IMPORT_NAME];
  }
}

import PPSocket from '../../classes/SocketClass';
import { CustomArgs, TNodeSource, TRgba } from '../../utils/interfaces';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import PPNode from '../../classes/NodeClass';
import { JSONType } from '../datatypes/jsonType';
import { CodeType } from '../datatypes/codeType';
import PPGraph from '../../classes/GraphClass';

const outputSocketName = 'output';
const inputSocketName = 'input';

const IMPORT_NAME = 'xml2js';

export class XMLReader extends PPNode {
  initialData: any;
  xml2jsModule;
  xml;

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.initialData = customArgs?.initialData;
  }

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
    this.xml2jsModule = PPGraph.currentGraph.dynamicImports[IMPORT_NAME];

    if (this.initialData) {
      this.setInputData(inputSocketName, this.initialData);
    }
    this.executeOptimizedChain();

    super.onNodeAdded(source);
  };

  protected async onExecute(input, output): Promise<void> {
    const result = await this.xml2jsModule.parseStringPromise(
      this.getInputData(inputSocketName),
    );
    const json = JSON.stringify(result);
    output[outputSocketName] = json;
  }

  public getDynamicImports(): string[] {
    return [IMPORT_NAME];
  }
}

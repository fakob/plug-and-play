import PPGraph from '../../classes/GraphClass';
import { PureNode } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';

export class MacroIn extends PureNode {
  public getName(): string {
    return 'Macro In';
  }
  public getDescription(): string {
    return 'Macro in arguments';
  }
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.MACRO),
    });
  }

  public getCanAddOutput(): boolean {
    return true;
  }

  protected getDefaultIO(): Socket[] {
    return [];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {}
}

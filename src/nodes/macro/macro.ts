import PPGraph from '../../classes/GraphClass';
import PPNode, { PureNode } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { StringType } from '../datatypes/stringType';

export class MacroNode extends PPNode {
  public addDefaultInput(): void {
    this.addInput(
      this.constructSocketName('Parameter', this.inputSocketArray),
      new AnyType()
    );
  }

  public addDefaultOutput(): void {
    this.addOutput(
      this.constructSocketName('Parameter', this.outputSocketArray),
      new AnyType()
    );
  }
}

export class DefineMacroIn extends MacroNode {
  public getName(): string {
    return 'Define Macro In';
  }
  public getDescription(): string {
    return 'Define arguments and node connections';
  }
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.MACRO),
    });
    this.graph.macrosIn[this.id] = this;
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

  _onRemoved(): void {
    super._onRemoved();
    delete this.graph.macrosIn[this.id];
  }
}

export class DefineMacroOut extends MacroNode {
  public getName(): string {
    return 'Define Macro Out';
  }
  public getDescription(): string {
    return 'Define macro output';
  }
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.MACRO),
    });
    this.graph.macrosOut[this.id] = this;
  }

  public getCanAddInput(): boolean {
    return true;
  }

  protected getDefaultIO(): Socket[] {
    return [];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {}

  _onRemoved(): void {
    super._onRemoved();
    delete this.graph.macrosOut[this.id];
  }
}

export class InvokeMacro extends MacroNode {
  public getName(): string {
    return 'Invoke Macro';
  }
  public getDescription(): string {
    return 'Invokes a macro that is defined in the graph';
  }
  public getCanAddInput(): boolean {
    return true;
  }
  public getCanAddOutput(): boolean {
    return true;
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'Macro Name', new StringType(), 'MacroName'),
    ];
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const macroStartNode = Object.values(this.graph.macrosIn).find(
      (node) => node.name === inputObject['Macro Name']
    );
    if (!macroStartNode) {
      throw (
        'No macro name with the name "' +
        inputObject['Macro Name'] +
        '" was found'
      );
    }

    Object.keys(inputObject).forEach((key) => {
      macroStartNode.setOutputData(key, inputObject[key]);
    });

    await macroStartNode.executeOptimizedChain();
    const macroEndNode = Object.values(this.graph.macrosOut).find(
      (node) => node.name === inputObject['Macro Name']
    );
    macroEndNode
      .getAllSockets()
      .filter((socket) => socket.socketType === SOCKET_TYPE.IN)
      .forEach((socket) => (outputObject[socket.name] = socket.data));
  }
}

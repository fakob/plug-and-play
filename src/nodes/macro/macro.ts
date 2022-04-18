import PPGraph from '../../classes/GraphClass';
import PPNode, { PureNode } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { EnumType } from '../datatypes/enumType';
import { StringType } from '../datatypes/stringType';
import { EnumStructure } from '../datatypes/enumType';

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
  _onRemoved(): void {
    super._onRemoved();
    delete this.graph.macrosOut[this.id];
  }
}

export class InvokeMacro extends MacroNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.MACRO),
    });
  }

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

  private getMacroEnumOptions(): EnumStructure {
    return Object.values(this.graph.macrosIn).map((macroNode) => {
      return { text: macroNode.name, value: macroNode.name };
    });
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        'Name',
        new EnumType(this.getMacroEnumOptions())
      ),
    ];
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const newOutputs = await this.invokeMacro(inputObject);
    Object.keys(newOutputs).forEach((key) => {
      outputObject[key] = newOutputs[key];
    });
  }
}

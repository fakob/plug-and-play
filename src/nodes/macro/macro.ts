import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  NODE_CORNERRADIUS,
  NODE_MARGIN,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
} from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { drawDottedLine } from '../../pixi/utils-pixi';
import { anyCodeName, CustomFunction } from '../data/dataFunctions';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { DynamicEnumType } from '../datatypes/dynamicEnumType';
import * as PIXI from 'pixi.js';
import FlowLogic from '../../classes/FlowLogic';
import { CodeType } from '../datatypes/codeType';

export const macroOutputName = 'Output';

const macroInputBlockSize = 120;
const macroOutputBlockSize = 60;

const macroColor = TRgba.fromString(NODE_TYPE_COLOR.MACRO);

export class Macro extends PPNode {
  isExecutingFromOutside = false;
  textRef: PIXI.Text = undefined;

  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
    PPGraph.currentGraph.macros[this.id] = this;
  }

  public getName(): string {
    return 'Macro';
  }

  public getDescription(): string {
    return 'Wrap a group of nodes into a macro and use this Macro as often as you want';
  }

  public getTags(): string[] {
    return ['Macro'].concat(super.getTags());
  }

  public getMinNodeWidth(): number {
    return macroInputBlockSize * 3;
  }

  public getDefaultNodeWidth(): number {
    return 1000;
  }

  public getDefaultNodeHeight(): number {
    return 300;
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(true, false, 1000);
  }

  onRemoved(): void {
    super.onRemoved();
    delete PPGraph.currentGraph.macros[this.id];
  }

  getColor(): TRgba {
    return macroColor;
  }

  private getMacroText(): string {
    let toReturn = this.nodeName + ': (';
    const linkedOutputs = this.outputSocketArray.filter((socket) =>
      socket.hasLink()
    );
    toReturn += linkedOutputs
      .map((socket) => this.getSocketDisplayName(socket) + ": " + socket.dataType.getName())
      .join(',');
    toReturn += ') => ' + this.inputSocketArray[0].dataType.getName();
    return toReturn;
  }

  public drawBackground(): void {
    this._BackgroundRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity()
    );
    this._BackgroundRef.removeChild(this.textRef);
    this.textRef = new PIXI.Text(this.getMacroText());
    this.textRef.y = -50;
    this.textRef.x = 50;
    this.textRef.style.fill = new TRgba(128, 128, 128).hexNumber();
    this.textRef.style.fontSize = 36;
    this._BackgroundRef.addChild(this.textRef);

    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      macroInputBlockSize,
      this.nodeHeight,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );

    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN + this.nodeWidth - macroOutputBlockSize,
      0,
      macroOutputBlockSize,
      this.nodeHeight,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );

    this._BackgroundRef.lineStyle(3, this.getColor().multiply(0.8).hexNumber());
    drawDottedLine(
      this._BackgroundRef,
      macroInputBlockSize + 5,
      5,
      this.nodeWidth - macroOutputBlockSize + 10,
      5,
      5
    );
    drawDottedLine(
      this._BackgroundRef,
      macroInputBlockSize + 5,
      this.nodeHeight,
      this.nodeWidth - macroOutputBlockSize + 10,
      this.nodeHeight,
      5
    );

    this._BackgroundRef.endFill();
  }

  public getInputSocketXPos(): number {
    return this.nodeWidth - macroOutputBlockSize;
  }
  public getOutputSocketXPos(): number {
    return macroInputBlockSize;
  }
  public outputPlugged(): void {
    super.outputPlugged();
    const last = this.outputSocketArray[this.outputSocketArray.length - 1];
    // if furthest down parameter is plugged in, add a new one
    if (last.hasLink()) {
      this.addDefaultOutput();
    }
    this.updateAllCallers();
    this.drawNodeShape();
  }

  public outputUnplugged(): void {
    super.outputUnplugged();
    this.updateAllCallers();
    this.drawNodeShape();
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.OUT, 'Parameter 1', new AnyType()),
      new Socket(SOCKET_TYPE.IN, macroOutputName, new AnyType()),
    ];
  }

  public addDefaultOutput(): void {
    this.addOutput(
      this.constructSocketName('Parameter', this.outputSocketArray),
      new AnyType()
    );
  }

  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return true;
  }

  getCallMacroCode() {
    const allParams = ["MacroName"].concat(this.outputSocketArray.slice(0, -1).map(socket => this.getSocketDisplayName(socket)));
    let paramLine = allParams.join(",").replaceAll(" ", "_");
    console.log("paramLine: " + paramLine);
    const totalMacroCall = 'async (' +
      paramLine +
      ') => {\n\
  \treturn await macro(' +
      paramLine +
      ');\n\
  }'
    return totalMacroCall;
  }

  public async executeMacro(args: any[]): Promise<any> {
    this.isExecutingFromOutside = true;
    args.forEach((arg, i) => {
      this.setOutputData('Parameter ' + (i + 1), arg);
    });
    await this.executeChildren();
    this.isExecutingFromOutside = false;
    return this.getInputData(macroOutputName);
  }

  public socketTypeChanged(): void {
    super.socketTypeChanged();
    this.drawNodeShape();
  }

  public nameChanged(newName: string): void {
    this.drawNodeShape();
  }

  public getShrinkOnSocketRemove(): boolean {
    return false;
  }

  public selectableViaBounds(): boolean {
    return false;
  }

  public onSpecificallySelected(): void {
    PPGraph.currentGraph.selection.selectNodes(
      FlowLogic.getAllUpDownstreamNodes(this, true, true, true)
    );
  }

  public shouldShowResizeRectangleEvenWhenMultipleNodesAreSelected(): boolean {
    return true;
  }

  public propagateExecutionPast(): boolean {
    return false;
  }

  public getSocketDisplayName(socket: Socket): string {
    return socket.isOutput() && socket.hasLink() ? socket.links[0].target.name : socket.name;
  }

  protected async updateAllCallers() {
    const nodesCallingMe = Object.values(PPGraph.currentGraph.nodes).filter(
      (node) => node.isCallingMacro(this.name)
    );
    await Promise.all(
      nodesCallingMe.map(async (node) => await node.calledMacroUpdated())
    );
  }

  protected async onExecute(
    _inputObject: any,
    _outputObject: Record<string, unknown>
  ): Promise<void> {
    // potentially demanding but important QOL, go through all nodes and see which refer to me, they need to be re-executed
    if (!this.isExecutingFromOutside) {
      await this.updateAllCallers();
    }
  }
}

function buildDefaultMacroFunction(macroName: string) {
  const targetMacro = Object.values(PPGraph.currentGraph.macros).find(
    (macro) => macro.nodeName == macroName
  );
  return targetMacro ? targetMacro.getCallMacroCode() : '';
}
export class ExecuteMacro extends CustomFunction {
  static getOptions = () =>
    Object.values(PPGraph.currentGraph.nodes)
      .filter((node) => node instanceof Macro)
      .map((node) => {
        return { text: node.nodeName };
      });

  public getName(): string {
    return 'Execute Macro';
  }

  public getDescription(): string {
    return 'Executes a macro that is defined in the graph';
  }

  public getTags(): string[] {
    return ['Macro'].concat(super.getTags());
  }

  getColor(): TRgba {
    return macroColor;
  }

  protected getDefaultParameterTypes(): Record<string, any> {
    return {
      MacroName: new DynamicEnumType(ExecuteMacro.getOptions, () =>
        this.generateUseNewCode()
      ),
    };
  }
  protected getDefaultParameterValues(): Record<string, any> {
    return { MacroName: 'ExampleMacro' };
  }

  protected getDefaultFunction(): string {
    return 'async (MacroName, Parameter) => {\n\
\treturn await macro(MacroName,Parameter);\
\n}';
  }

  public generateUseNewCode = async () => {
    this.setInputData(
      anyCodeName,
      buildDefaultMacroFunction(this.getInputData('MacroName'))
    );
    await this.executeOptimizedChain();
    this.resizeAndDraw(0, 0);
  };

  // adapt all nodes apart from the code one
  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return (
      super.socketShouldAutomaticallyAdapt(socket) &&
      socket.name !== 'MacroName'
    );
  }

  protected initializeType(socketName: string, datatype: any) {
    switch (socketName) {
      case 'MacroName':
        datatype.getOptions = ExecuteMacro.getOptions;
        datatype.onChange = this.generateUseNewCode;
    }
  }

  public isCallingMacro(macroName: string): boolean {
    return (
      super.isCallingMacro(macroName) ||
      this.getInputData('MacroName') == macroName
    );
  }

  protected potentiallyModifyOutgoingCode(inCode: string) {
    // baking in the macro name selected in the node into the output code (makes it easier if using it for map or something)
    return inCode
      .replace('MacroName,', '')
      .replace('MacroName', "'" + this.getInputData('MacroName') + "'");
  }

  public async calledMacroUpdated(): Promise<void> {
    await this.generateUseNewCode();
    await super.calledMacroUpdated();
  }
}

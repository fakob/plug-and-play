import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  NODE_CORNERRADIUS,
  NODE_MARGIN,
  SOCKET_TYPE,
} from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { drawDottedLine } from '../../utils/utils';
import { anyCodeName, CustomFunction } from '../data/dataFunctions';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { DynamicEnumType } from '../datatypes/dynamicEnumType';
import * as PIXI from 'pixi.js';

export const macroOutputName = 'Output';

const macroInputBlockSize = 120;
const macroOutputBlockSize = 60;

const macroColor = new TRgba(178, 178, 178);

export class Macro extends PPNode {
  textRef: PIXI.Text = undefined;
  public getMinNodeWidth(): number {
    return macroInputBlockSize * 3;
  }

  public getDefaultNodeWidth(): number {
    return 1000;
  }

  public getDefaultNodeHeight(): number {
    return 300;
  }

  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
    PPGraph.currentGraph.macros[this.id] = this;
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000);
  }

  _onRemoved(): void {
    super._onRemoved();
    delete PPGraph.currentGraph.macros[this.id];
  }

  getColor(): TRgba {
    return macroColor;
  }

  private getMacroText(): string {
    let toReturn = this.nodeName + ': (';
    this.outputSocketArray.forEach((outputSocket) => {
      if (outputSocket.links.length) {
        toReturn += outputSocket.dataType.getName() + ',';
      }
    });
    toReturn = toReturn.slice(0, -1) + ')';
    toReturn += ' => ' + this.inputSocketArray[0].dataType.getName();
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
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.OUT, 'Parameter 1', new AnyType()),
      new Socket(SOCKET_TYPE.IN, 'Output', new AnyType()),
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

  public async executeMacro(inputObject: any): Promise<any> {
    Object.keys(inputObject).forEach((key) =>
      this.setOutputData(key, inputObject[key])
    );
    await this.executeChildren();
    return this.getInputData('Output');
  }

  public socketTypeChanged(): void {
    super.socketTypeChanged();
    this.drawNodeShape();
  }

  public nameChanged(newName: string): void {
    this.drawNodeShape();
  }
}
export class ExecuteMacro extends CustomFunction {
  static getOptions = () =>
    Object.values(PPGraph.currentGraph.nodes)
      .filter((node) => node instanceof Macro)
      .map((node) => {
        return { text: node.nodeName, value: node.nodeName };
      });

  getColor(): TRgba {
    return macroColor;
  }
  public getName(): string {
    return 'Execute Macro';
  }
  public getDescription(): string {
    return 'Executes a macro that is defined in the graph';
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
  buildDefaultFunction = () => {
    const targetMacro = Object.values(PPGraph.currentGraph.macros).find(
      (macro) => macro.nodeName == this.getInputData('MacroName')
    );
    const paramLength = targetMacro ? targetMacro.outputSocketArray.length : 0;
    let paramLine = '';
    for (let i = 1; i < paramLength + 1; i++) {
      paramLine += ', Parameter_' + i.toString();
    }
    return (
      'async (MacroName' +
      paramLine +
      ') => {\n\
      \treturn await macro(MacroName' +
      paramLine +
      ');\n\
      }'
    );
  };

  public generateUseNewCode = async () => {
    this.setInputData(anyCodeName, this.buildDefaultFunction());
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
}

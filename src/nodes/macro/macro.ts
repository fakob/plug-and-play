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
import * as PIXI from 'pixi.js';
import { drawDottedLine } from '../../utils/utils';
import { CustomFunction } from '../data/dataFunctions';
import { StringType } from '../datatypes/stringType';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';

export const macroOutputName = 'Output';

const macroBlockSize = 150;

export class Macro extends PPNode {
  public getMinNodeWidth(): number {
    return macroBlockSize * 3;
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
    return TRgba.fromString(NODE_TYPE_COLOR.MACRO);
  }

  public drawBackground(): void {
    this._BackgroundRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity()
    );
    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      macroBlockSize,
      this.nodeHeight,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );

    this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN + this.nodeWidth - macroBlockSize,
      0,
      macroBlockSize,
      this.nodeHeight,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );

    this._BackgroundRef.lineStyle(3, this.getColor().multiply(0.8).hexNumber());
    drawDottedLine(
      this._BackgroundRef,
      macroBlockSize + 5,
      5,
      this.nodeWidth - macroBlockSize + 10,
      5,
      5
    );
    drawDottedLine(
      this._BackgroundRef,
      macroBlockSize + 5,
      this.nodeHeight,
      this.nodeWidth - macroBlockSize + 10,
      this.nodeHeight,
      5
    );

    this._BackgroundRef.endFill();
  }

  public getInputSocketXPos(): number {
    return this.nodeWidth - macroBlockSize;
  }
  public getOutputSocketXPos(): number {
    return macroBlockSize;
  }

  public getCanAddOutput(): boolean {
    return true;
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
}
export class InvokeMacro extends CustomFunction {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.MACRO);
  }
  public getName(): string {
    return 'Invoke Macro';
  }
  public getDescription(): string {
    return 'Invokes a macro that is defined in the graph';
  }

  protected getDefaultParameterTypes(): Record<string, any> {
    return { MacroName: new StringType() };
  }
  protected getDefaultParameterValues(): Record<string, any> {
    return { MacroName: 'ExampleMacro' };
  }

  protected getDefaultFunction(): string {
    return 'async (MacroName, Parameter) => {\n\
    \treturn await macro(MacroName,Parameter);\
    \n}';
  }
}

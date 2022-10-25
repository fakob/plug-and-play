import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { MacroType } from '../datatypes/macroType';
import * as PIXI from 'pixi.js';
import { drawDottedLine } from '../../utils/utils';

export const macroOutputName = 'Output';
class MacroNode extends PPNode {
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

//export class DefineMacro extends PPNode {
//}

export class DefineMacroIn extends MacroNode {
  graphicsLink: PIXI.Graphics = undefined;
  connectionSphere: PIXI.Graphics = undefined;
  public getName(): string {
    return 'Define Macro In';
  }
  public getDescription(): string {
    return 'Define arguments and node connections';
  }
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.MACRO);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
    PPGraph.currentGraph.macrosIn[this.id] = this;
  }

  public getCanAddOutput(): boolean {
    return true;
  }

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.OUT, 'Parameter 1', new AnyType())];
  }

  _onRemoved(): void {
    super._onRemoved();
    delete PPGraph.currentGraph.macrosIn[this.id];
  }

  public drawNodeShape(): void {
    this.removeChild(this.graphicsLink);

    this.graphicsLink = new PIXI.Graphics();
    const selectedColor: TRgba = TRgba.black();
    const correspondingOutput = PPGraph.currentGraph.findMacroOutput(this.name);
    this.graphicsLink.lineStyle(1, selectedColor.hexNumber());

    if (correspondingOutput) {
      drawDottedLine(
        this.graphicsLink,
        this.width,
        this.height / 2,
        correspondingOutput.x - this.x,
        correspondingOutput.y - this.y + correspondingOutput.height / 2,
        5
      );
    }
    this.addChild(this.graphicsLink);
    super.drawNodeShape();
  }

  // TODO reimplement
  /*public _onPointerMove(): void {
    super._onPointerMove();
    if (this.isDraggingNode) {
      this.drawNodeShape();
    }
  }*/
}

export class DefineMacroOut extends MacroNode {
  public getName(): string {
    return 'Define Macro Out';
  }
  public getDescription(): string {
    return 'Define macro output';
  }
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.MACRO);
  }
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
    PPGraph.currentGraph.macrosOut[this.id] = this;
  }

  private tellMacroInToRedraw(): void {
    const correspondingInput = PPGraph.currentGraph.findMacroInput(this.name);
    if (correspondingInput) {
      correspondingInput.drawNodeShape();
    }
  }

  public drawNodeShape(): void {
    this.tellMacroInToRedraw();
    super.drawNodeShape();
  }
  // TODO reimplement
  /*
  public _onPointerMove(): void {
    super._onPointerMove();
    if (this.isDraggingNode) {
      this.tellMacroInToRedraw();
    }
  }*/

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, macroOutputName, new AnyType())];
  }
  _onRemoved(): void {
    super._onRemoved();
    delete PPGraph.currentGraph.macrosOut[this.id];
  }
}

export class InvokeMacro extends MacroNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.MACRO);
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

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, 'Name', new MacroType())];
  }

  public metaInfoChanged(): void {
    // we want to refresh the input/output sockets when the user selects a different macro
    this.inputSocketArray
      .filter((socket) => socket.name !== 'Name')
      .forEach((socket) => socket.destroy());
    this.outputSocketArray.forEach((socket) => socket.destroy());
    const macroInputNode = PPGraph.currentGraph.findMacroInput(
      this.getInputSocketByName('Name').data
    );
    if (macroInputNode) {
      macroInputNode.outputSocketArray.forEach((socket) => {
        this.addSocket(
          new Socket(SOCKET_TYPE.IN, socket.name, socket.dataType)
        );
      });
    }
    const macroOutputNode = PPGraph.currentGraph.findMacroOutput(
      this.getInputSocketByName('Name').data
    );
    if (macroOutputNode) {
      macroOutputNode.inputSocketArray.forEach((socket) => {
        this.addSocket(
          new Socket(SOCKET_TYPE.OUT, socket.name, socket.dataType)
        );
      });
    }
    super.metaInfoChanged();
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[macroOutputName] = await this.invokeMacro(inputObject);
  }
}

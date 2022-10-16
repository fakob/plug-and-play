import PPNode from '../../classes/NodeClass';
import * as PIXI from 'pixi.js';
import { TRgba } from '../../utils/interfaces';
import Socket from '../../classes/SocketClass';
import { ArrayType } from '../datatypes/arrayType';
import { SOCKET_TYPE } from '../../utils/constants';
import PPGraph from '../../classes/GraphClass';

const recordButtonColor = new TRgba(255, 50, 50);
const recordIconSize = 40;
const clickName = 'Locations';
export class RecordLocations extends PPNode {
  isRecording = false;
  recordButton: PIXI.Graphics = undefined; // kinda ugly with undefined but whatever

  public getDefaultNodeWidth(): number {
    return 150;
  }

  public getDefaultNodeHeight(): number {
    return 150;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, clickName, new ArrayType(), [], false),
      new Socket(SOCKET_TYPE.OUT, clickName, new ArrayType(), [], true),
    ];
  }

  public nodeKeyEvent(e: KeyboardEvent): void {
    super.nodeKeyEvent(e);
    if (this.isRecording) {
      const mousePosition =
        PPGraph.currentGraph.app.renderer.plugins.interaction.mouse.global;
      this.setInputData(
        clickName,
        this.getInputData(clickName).concat([mousePosition])
      );
      this.setOutputData(clickName, this.getInputData(clickName));
    }
  }

  public drawNodeShape(): void {
    super.drawNodeShape();

    if (this.recordButton == undefined) {
      this.recordButton = new PIXI.Graphics();
      this.recordButton.on('pointerdown', (event: PIXI.InteractionEvent) => {
        event.stopPropagation();
        this.isRecording = !this.isRecording;
        this.drawNodeShape();
      });

      this.addChild(this.recordButton);
      this.recordButton.interactive = true;
    }
    this.recordButton.clear();
    this.recordButton.beginFill(
      recordButtonColor.hexNumber(),
      this.getOpacity()
    );

    this.recordButton.lineStyle(3, recordButtonColor.multiply(0.7).hexNumber());
    if (!this.isRecording) {
      this.recordButton.drawCircle(
        this.nodeWidth / 2,
        (this.nodeHeight / 3) * 2,
        recordIconSize
      );
    } else {
      this.recordButton.drawRect(
        this.nodeWidth / 2 - recordIconSize,
        (this.nodeHeight / 3) * 2 - recordIconSize,
        recordIconSize * 2,
        recordIconSize * 2
      );
    }
  }
}

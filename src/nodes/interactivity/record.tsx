import PPNode from '../../classes/NodeClass';
import * as PIXI from 'pixi.js';
import { TRgba } from '../../utils/interfaces';
import Socket from '../../classes/SocketClass';
import { ArrayType } from '../datatypes/arrayType';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { isArray } from 'lodash';
import { getCurrentCursorPosition } from '../../utils/utils';

const recordButtonColor = new TRgba(255, 50, 50);
const recordIconSize = 40;
const clickName = 'Locations';

export class RecordLocations extends PPNode {
  isRecording = false;
  recordButton: PIXI.Graphics = undefined; // kinda ugly with undefined but whatever

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  public getMinNodeWidth(): number {
    return 150;
  }

  public getMinNodeHeight(): number {
    return 150;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, clickName, new ArrayType(), [], false),
      new Socket(SOCKET_TYPE.OUT, clickName, new ArrayType(), []),
    ];
  }

  public nodeKeyEvent(e: KeyboardEvent): void {
    super.nodeKeyEvent(e);
    if (this.isRecording) {
      const mousePosition = getCurrentCursorPosition();

      let prev = this.getInputData(clickName);
      if (!isArray(prev)) {
        prev = [];
      }
      console.log(
        'recorded mouseclick position: ' + JSON.stringify(mousePosition)
      );
      prev.push([mousePosition.x, mousePosition.y]);
      this.setInputData(clickName, prev);
      this.setOutputData(clickName, prev);
      this.executeChildren();
    }
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[clickName] = inputObject[clickName];
  }

  public drawNodeShape(): void {
    super.drawNodeShape();

    if (this.recordButton == undefined) {
      this.recordButton = new PIXI.Graphics();
      this.recordButton.addEventListener(
        'pointerdown',
        (event: PIXI.FederatedPointerEvent) => {
          event.stopPropagation();
          this.isRecording = !this.isRecording;
          this.drawNodeShape();
        }
      );

      this.addChild(this.recordButton);
      this.recordButton.eventMode = 'dynamic';
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

import PPNode from '../../classes/NodeClass';
import * as PIXI from 'pixi.js';
import { TRgba } from '../../utils/interfaces';

const recordButtonColor = new TRgba(255, 0, 0);
export class RecordClicks extends PPNode {
  recordButton: PIXI.Graphics = undefined; // kinda ugly with undefined but whatever
  public drawNodeShape(): void {
    super.drawNodeShape();

    if (!this.recordButton) {
      this.recordButton = new PIXI.Graphics();
    }
    this.removeChild(this.recordButton);
    this.addChild(this.recordButton);
    this.recordButton.clear();
    this.recordButton.beginFill(
      recordButtonColor.hexNumber(),
      this.getOpacity()
    );
    this.recordButton.lineStyle(3, recordButtonColor.multiply(0.7).hexNumber());
    this.recordButton.drawCircle(this.nodeWidth / 2, this.nodeHeight / 2, 40);
    this.recordButton.interactive = true;
    /*this._BackgroundRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      this.nodeWidth,
      this.getNodeHeight(),
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0
    );*/
  }
}

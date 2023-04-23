import Color from 'color';
import HybridNode2 from '../../classes/HybridNode2';
import PPNode from '../../classes/NodeClass';
import { NODE_TYPE_COLOR, RANDOMMAINCOLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';

export abstract class WidgetHybridBase extends HybridNode2 {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  getOpacity(): number {
    return 0.01;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }
}

export abstract class Widget_Base extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(Color(RANDOMMAINCOLOR).darken(0.85).hex());
  }

  getRoundedCorners(): boolean {
    return false;
  }

  getShowLabels(): boolean {
    return false;
  }

  public getShrinkOnSocketRemove(): boolean {
    return false;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

  public getMinNodeHeight(): number {
    return 80;
  }
}

import Color from 'color';
import HybridNode2 from '../../classes/HybridNode2';
import PPNode from '../../classes/NodeClass';
import { NODE_TYPE_COLOR, RANDOMMAINCOLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';

export abstract class WidgetHybridBase extends HybridNode2 {
  public getTags(): string[] {
    return ['Widget'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  getOpacity(): number {
    return 0.01;
  }

  getRoundedCorners(): boolean {
    return false;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }
}

export abstract class WidgetBase extends PPNode {
  public getTags(): string[] {
    return ['Widget'].concat(super.getTags());
  }

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

  public getMinNodeHeight(): number {
    return 80;
  }
}

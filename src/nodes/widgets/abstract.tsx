import HybridNode from '../../classes/HybridNode';
import { NODE_TYPE_COLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';

export abstract class Widget_Base extends HybridNode {
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

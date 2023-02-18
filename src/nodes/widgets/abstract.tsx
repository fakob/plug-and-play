import HybridNode2 from '../../classes/HybridNode2';
import { NODE_TYPE_COLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';

export abstract class Widget_Base extends HybridNode2 {
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

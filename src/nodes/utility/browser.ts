import { CustomFunction } from '../data/dataFunctions';
import { NODE_TYPE_COLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';

export class OpenURL extends CustomFunction {
  protected getDefaultFunction(): string {
    return `(url) => {
  const openNewTab = (thisUrl) => {
    if (typeof thisUrl === 'string') {
      window.open(thisUrl, '_blank')?.focus();
    }
  };
  openNewTab(url);
}`;
  }

  public getName(): string {
    return 'Open URL';
  }

  public getDescription(): string {
    return 'Opens a URL in a new tab';
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.SYSTEM);
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000);
  }
}

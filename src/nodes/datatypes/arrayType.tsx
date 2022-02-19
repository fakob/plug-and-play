import { TRgba } from '../../utils/interfaces';
import { AbstractType } from './abstractType';

export class ArrayType extends AbstractType {
  constructor() {
    super();
  }
  getName(): string {
    return 'Array';
  }

  getDefaultValue(): any {
    return [];
  }

  getColor(): TRgba {
    return new TRgba(204, 153, 255);
  }
}

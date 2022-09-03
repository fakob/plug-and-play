import { TRgba } from '../../utils/interfaces';
import { AbstractType } from './abstractType';

/* eslint-disable prettier/prettier */
export class MissingType extends AbstractType {
  getName(): string {
    return 'Missing';
  }
  getDefaultValue(): any {
    return 0;
  }

  getColor(): TRgba {
    return new TRgba(255, 0, 0);
  }
}

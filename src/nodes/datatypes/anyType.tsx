import { AbstractType } from './abstractType';

/* eslint-disable prettier/prettier */
export class AnyType extends AbstractType {
  getName(): string {
    return 'Any';
  }
  getDefaultValue() : any {
    return 0;
  }
}

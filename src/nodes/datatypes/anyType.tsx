import { AbstractType } from './abstractType';

/* eslint-disable prettier/prettier */
export class AnyType extends AbstractType {
  getName(): string {
    return 'Any';
  }
  toString(data: any): string {
    return data.toString();
  }
}

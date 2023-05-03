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

  getMetaText(data: any): string {
    return (
      '(' + (Array.isArray(data) ? data.length.toString() : 'Invalid') + ')'
    );
  }

  parse(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        return data;
      }
    }
    return data;
  }

  recommendedInputNodeWidgets(): string[] {
    return [
      'Playground',
      'ArrayPush',
      'ArrayMethod',
      'ArrayState',
      'ArrayCreate',
      // 'ArrayGet',
      // 'ArrayLength',
      'ArraySlice',
    ];
  }

  recommendedOutputNodeWidgets(): string[] {
    return [
      'Playground',
      'ArrayPush',
      'ArrayMethod',
      'ArrayState',
      // 'ArrayCreate',
      'ArrayGet',
      'ArrayLength',
      'ArraySlice',
    ];
  }
}

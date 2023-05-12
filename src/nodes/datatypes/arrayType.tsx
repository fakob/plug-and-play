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
      'ArrayCreate',
      'ArrayMethod',
      'ArraySlice',
      'ArrayPush',
      'ArrayState',
    ];
  }

  recommendedOutputNodeWidgets(): string[] {
    return [
      'ArrayMethod',
      'ArrayGet',
      'ArrayLength',
      'ArraySlice',
      'ArrayPush',
      'Filter',
      'Uniques',
      'Counts',
      'Flatten',
      'Max',
      'Min',
      'ArrayState',
      'WidgetRadio',
    ];
  }
}

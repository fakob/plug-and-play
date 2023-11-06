import { TRgba } from '../../utils/interfaces';
import { AbstractType } from './abstractType';

export class ArrayType extends AbstractType {
  constructor() {
    super();
  }
  getName(): string {
    return 'Array';
  }

  getInputWidgetSize(): any {
    return {
      w: 2,
      h: 3,
      minW: 2,
      minH: 2,
    };
  }

  getOutputWidgetSize(): any {
    return {
      w: 2,
      h: 3,
      minW: 2,
      minH: 2,
    };
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

  recommendedOutputNodeWidgets(): string[] {
    return [
      'Map',
      'Filter',
      'ArrayLength',
      'ArraySlice',
      'ConcatenateArrays',
      'ArrayGet',
    ];
  }

  recommendedInputNodeWidgets(): string[] {
    return [
      'CodeEditor',
      'Constant',
      'RandomArray',
      'RangeArray',
      'ColorArray',
      'ArrayCreate',
      'WidgetRadio',
    ];
  }
}

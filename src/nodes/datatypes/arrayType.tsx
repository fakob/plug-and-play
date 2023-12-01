import React from 'react';
import { ArrayWidget } from '../../widgets';
import { SocketParsingWarning } from '../../classes/ErrorClass';
import { TParseType, TRgba } from '../../utils/interfaces';
import { AbstractType, DataTypeProps } from './abstractType';

export interface ArrayTypeProps extends DataTypeProps {
  dataType: ArrayType;
}

export class ArrayType extends AbstractType {
  constructor() {
    super();
  }
  getName(): string {
    return 'Array';
  }

  getInputWidget = (props: DataTypeProps): any => {
    props.dataType = this;
    return <ArrayWidget {...props} />;
  };

  getDefaultWidgetSize(): any {
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

  parse(data: any): TParseType {
    let parsedData;
    const warnings: SocketParsingWarning[] = [];

    if (Array.isArray(data)) {
      parsedData = data;
    } else if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        if (!Array.isArray(parsedData)) {
          parsedData = undefined;
        }
      } catch (error) {}
    }
    if (parsedData == undefined) {
      parsedData = [];
      warnings.push(new SocketParsingWarning('Not an array. [] is returned'));
    }

    return {
      value: parsedData,
      warnings: warnings,
    };
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

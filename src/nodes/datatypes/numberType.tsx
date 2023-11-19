import React from 'react';
import { TParseType, TRgba } from '../../utils/interfaces';
import { NumberOutputWidget, SliderWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';

export interface NumberTypeProps extends DataTypeProps {
  dataType: NumberType;
}

export class NumberType extends AbstractType {
  round: boolean;
  minValue: number;
  maxValue: number;
  stepSize: number;
  constructor(
    inRound = false,
    inMinValue = 0,
    inMaxValue = 100,
    stepSize = 0.01,
  ) {
    super();
    this.round = inRound;
    this.minValue = inMinValue;
    this.maxValue = inMaxValue;
    this.stepSize = stepSize;
  }

  getInputWidget = (props: NumberTypeProps): any => {
    props.dataType = this;
    return <SliderWidget {...props} />;
  };

  getOutputWidget = (props: NumberTypeProps): any => {
    props.dataType = this;
    if (typeof props.property.data !== 'number') {
      props.property.data = Number(props.property.data);
    }
    return <NumberOutputWidget {...props} />;
  };

  getInputWidgetSize(): any {
    return {
      w: 2,
      h: 2,
      minW: 2,
      minH: 2,
    };
  }

  getOutputWidgetSize(): any {
    return {
      w: 2,
      h: 1,
      minW: 1,
      minH: 1,
    };
  }

  getName(): string {
    return 'Number';
  }

  getDefaultValue(): any {
    return 0;
  }

  parse(data: any): TParseType {
    return parseNumber(data);
  }

  getColor(): TRgba {
    return new TRgba(128, 229, 229);
  }

  recommendedOutputNodeWidgets(): string[] {
    return [
      'Label',
      'Add',
      'Subtract',
      'Multiply',
      'Divide',
      'Sqrt',
      'MathFunction',
    ];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['WidgetSlider', 'Constant'];
  }
}

const parseNumber = (data): TParseType => {
  let parsedData;
  let warning: string;

  switch (typeof data) {
    case 'number':
      parsedData = data;
      break;
    case 'string':
      const parsedString = parseFloat(
        data.replace(',', '.').replace(/[^\d.-]/g, ''),
      );
      if (!isNaN(parsedString)) {
        parsedData = parsedString;
      } else {
        warning = 'Not a number (NaN). 0 is returned';
        parsedData = 0;
      }
      break;
    case 'object':
      if (Array.isArray(data)) {
        for (const item of data) {
          const parsedArrayItem = parseNumber(item);
          if (parsedArrayItem.value !== 0) {
            warning = 'A number was extracted from the array';
            parsedData = parsedArrayItem.value;
          }
        }
        if (parsedData === undefined) {
          warning =
            'No number could be extracted from the array. 0 is returned';
          parsedData = 0;
        }
      } else if (data !== null) {
        const primitive = data.valueOf();
        if (typeof primitive === 'number') {
          parsedData = primitive;
        } else {
          for (const key in data) {
            const parsedObjectValue = parseNumber(data[key]);
            if (parsedObjectValue.value !== 0) {
              warning = 'A number was extracted from the object';
              parsedData = parsedObjectValue;
            }
          }
          if (parsedData === undefined) {
            warning =
              'No number could be extracted from the object. 0 is returned';
            parsedData = 0;
          }
        }
      }
      break;
    // Default case to handle other data types like 'undefined', 'function', etc.
    default:
      warning = 'Number is null or undefined. 0 is returned';
      parsedData = 0;
      break;
  }
  return {
    value: parsedData,
    warning: warning,
  };
};

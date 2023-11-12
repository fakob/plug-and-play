import React from 'react';
import { TRgba } from '../../utils/interfaces';
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
      h: 3,
      minW: 2,
      minH: 2,
    };
  }

  getName(): string {
    return 'Number';
  }

  getDefaultValue(): any {
    return 0;
  }

  parse(data: any): any {
    if (typeof data === 'string') {
      return parseFloat(data.replace(',', '.').replace(/[^\d.-]/g, ''));
    } else {
      return data;
    }
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

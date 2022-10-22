import React from 'react';
import { TRgba } from '../../utils/interfaces';
import {
  NumberOutputWidget,
  SliderWidget,
  SliderWidgetProps,
} from '../../widgets';
import { AbstractType } from './abstractType';

export class NumberType extends AbstractType {
  round: boolean;
  minValue: number;
  maxValue: number;
  stepSize: number;
  constructor(
    inRound = false,
    inMinValue = 0,
    inMaxValue = 100,
    stepSize = 0.01
  ) {
    super();
    this.round = inRound;
    this.minValue = inMinValue;
    this.maxValue = inMaxValue;
    this.stepSize = stepSize;
  }

  getInputWidget = (props: any): any => {
    const sliderProps: SliderWidgetProps = {
      property: props.property,
      isInput: props.isInput,
      hasLink: props.hasLink,
      index: props.index,
      data: props.data,
      listenerAttacher: this.listenerAttacher,
      type: this,
    };
    return <SliderWidget {...sliderProps} />;
  };

  getOutputWidget = (props: any): any => {
    if (typeof props.data !== 'number') {
      props.data = Number(props.data);
    }
    props.listenerAttacher = this.listenerAttacher;
    return <NumberOutputWidget {...props} />;
  };

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

  defaultInputNodeWidget(): string {
    return 'WidgetSlider';
  }
}

import React from 'react';
import {
  DefaultOutputWidget,
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
      type: this,
    };
    return <SliderWidget {...sliderProps} />;
  };

  getName(): string {
    return 'Number';
  }

  getDefaultValue(): any {
    return 0;
  }
}

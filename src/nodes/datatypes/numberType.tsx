import React from 'react';
import { DefaultOutputWidget, SliderWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class NumberType extends AbstractType {
  round: boolean;
  minValue: number;
  maxValue: number;
  constructor(inRound = false, inMinValue = 0, inMaxValue = 100) {
    super();
    this.round = inRound;
    this.minValue = inMinValue;
    this.maxValue = inMaxValue;
    this.inputWidgets = [SliderWidget];
    this.outputWidgets = [DefaultOutputWidget];
  }

  getInputWidget = (data: any): any => {
    return <SliderWidget {...data} />;
  };
}

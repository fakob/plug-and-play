import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { TextWidget } from '../../widgets';
import { AbstractType } from './abstractType';

const widgetSize = {
  w: 2,
  h: 3,
  minW: 2,
  minH: 2,
};

export class StringType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'String';
  }

  getInputWidget = (data: any): any => {
    const props = { ...data };
    return <TextWidget {...props} />;
  };

  getInputWidgetSize(): any {
    return widgetSize;
  }

  getOutputWidgetSize(): any {
    return widgetSize;
  }

  getDefaultValue(): any {
    return '';
  }

  getColor(): TRgba {
    return new TRgba(148, 250, 148);
  }

  parse(data: any): any {
    if (typeof data == 'object' || Array.isArray(data)) {
      return JSON.stringify(data);
    }
    return data;
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['Label', 'DRAW_Text', 'Add'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['Label', 'Constant', 'TextEditor'];
  }
}

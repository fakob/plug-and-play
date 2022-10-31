import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { TextWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class StringType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'String';
  }

  getInputWidget = (data: any): any => {
    const props = { ...data };
    props.dataTyåe = this;
    return <TextWidget {...props} />;
  };

  getDefaultValue(): any {
    return '';
  }

  getColor(): TRgba {
    return new TRgba(128, 250, 128);
  }

  defaultInputNodeWidget(): string {
    return 'Label';
  }
  parse(data: any): any {
    if (typeof data == 'object') {
      return JSON.stringify(data);
    }
    return data;
  }
}

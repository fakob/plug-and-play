import React from 'react';
import { TextWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class StringType extends AbstractType {
  constructor() {
    super();
  }

  getName() {
    return 'String';
  }

  getInputWidget = (data: any): any => {
    return <TextWidget {...data} />;
  };

  getDefaultValue(): any {
    return '';
  }
}

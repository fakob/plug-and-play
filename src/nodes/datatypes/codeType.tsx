import React from 'react';
import { TextWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class CodeType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Code';
  }

  // TODO use cooler widget for this
  getInputWidget = (data: any): any => {
    return <TextWidget {...data} />;
  };

  getDefaultValue(): any {
    return '';
  }
}

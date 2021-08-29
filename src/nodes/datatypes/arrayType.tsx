import React from 'react';
import { TextWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class ArrayType extends AbstractType {
  constructor() {
    super();
  }
  getName(): string {
    return 'Array';
  }
  getInputWidget = (data: any): any => {
    return <TextWidget {...data} />;
  };
}

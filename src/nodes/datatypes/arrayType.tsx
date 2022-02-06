import React from 'react';
import { CodeWidget, TextWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class ArrayType extends AbstractType {
  constructor() {
    super();
  }
  getName(): string {
    return 'Array';
  }

  getDefaultValue(): any {
    return [];
  }
}

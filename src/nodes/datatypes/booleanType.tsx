import React from 'react';
import { BooleanWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class BooleanType extends AbstractType {
  constructor() {
    super();
  }

  getDefaultValue(): any {
    return false;
  }

  getInputWidget = (data: any): any => {
    return <BooleanWidget {...data} />;
  };
}

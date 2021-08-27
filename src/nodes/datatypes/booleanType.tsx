import React from 'react';
import { BooleanWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class BooleanType extends AbstractType {
  constructor() {
    super();
  }

  getInputWidget = (data: any): any => {
    return <BooleanWidget {...data} />;
  };
}

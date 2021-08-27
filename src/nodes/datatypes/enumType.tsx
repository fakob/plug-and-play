import React from 'react';
import { SelectWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class EnumType extends AbstractType {
  classEnum;
  constructor(inEnum: unknown) {
    super();
    this.classEnum = inEnum;
  }

  getInputWidget = (data: any): any => {
    return <SelectWidget {...data} />;
  };
}

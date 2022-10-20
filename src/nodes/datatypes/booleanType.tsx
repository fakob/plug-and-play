import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { BooleanWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class BooleanType extends AbstractType {
  getName(): string {
    return 'Boolean';
  }

  getDefaultValue(): any {
    return false;
  }
  parse(data: any): any {
    return data ? true : false;
  }

  getInputWidget = (data: any): any => {
    return <BooleanWidget {...data} />;
  };

  defaultInputNodeWidget(): string {
    return 'WidgetSwitch';
  }

  getColor(): TRgba {
    return new TRgba(90, 90, 90);
  }
}

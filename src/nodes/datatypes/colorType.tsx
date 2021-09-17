import React from 'react';
import { ColorWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class ColorType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Color';
  }

  getDefaultValue(): any {
    return [255, 55, 0, 0.5];
  }

  getInputWidget = (data: any): any => {
    return <ColorWidget {...data} />;
  };
}

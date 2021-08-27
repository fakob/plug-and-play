import React from 'react';
import { ColorWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class ColorType extends AbstractType {
  constructor() {
    super();
  }

  getInputWidget = (data: any): any => {
    return <ColorWidget {...data} />;
  };
}

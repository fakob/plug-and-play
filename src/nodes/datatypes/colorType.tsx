import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { ColorWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class Color {
  R: number;
  G: number;
  B: number;
  A: number;
}

export class ColorType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Color';
  }

  getDefaultValue(): any {
    return TRgba.fromString('#ff3700');
  }

  parse(data: any): any {
    const color = Object.assign(new TRgba(), data);
    return color;
  }

  getInputWidget = (data: any): any => {
    return <ColorWidget {...data} />;
  };
}

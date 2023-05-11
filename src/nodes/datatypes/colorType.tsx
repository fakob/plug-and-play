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
    return TRgba.randomColor(); //TRgba.fromString('#ff3700');
  }

  parse(data: any): any {
    if (typeof data === 'string') {
      return TRgba.fromString(data);
    } else {
      const color = Object.assign(new TRgba(), data);
      return color;
    }
  }

  getInputWidget = (data: any): any => {
    const props = { ...data };
    props.dataType = this;
    return <ColorWidget {...props} />;
  };

  getColor(): TRgba {
    return new TRgba(255, 170, 60);
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['ColorArray'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['WidgetColorPicker', 'Constant'];
  }
}

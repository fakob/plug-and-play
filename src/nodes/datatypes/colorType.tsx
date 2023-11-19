import React from 'react';
import * as PIXI from 'pixi.js';
import { TParseType, TRgba } from '../../utils/interfaces';
import { COLOR_WARNING } from '../../utils/constants';
import { ColorWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';

export interface ColorTypeProps extends DataTypeProps {
  dataType: ColorType;
}

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

  parse(data: any): TParseType {
    let parsedData;
    let warning: string;
    const warn = 'Not a color. Default color is returned';

    if (typeof data === 'string') {
      try {
        parsedData = TRgba.fromString(data);
      } catch (error) {
        warning = warn;
        parsedData = TRgba.fromString(COLOR_WARNING);
      }
    } else {
      parsedData = Object.assign(new TRgba(), data);
      if (!TRgba.isTRgba(parsedData)) {
        warning = warn;
        parsedData = TRgba.fromString(COLOR_WARNING);
      }
    }

    return {
      value: parsedData as TRgba,
      warning: warning,
    };
  }

  getInputWidget = (props: ColorTypeProps): any => {
    props.dataType = this;
    return <ColorWidget {...props} />;
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 1,
      minW: 1,
      minH: 1,
    };
  }

  getColor(): TRgba {
    return new TRgba(110, 110, 110);
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['ColorArray'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['WidgetColorPicker', 'Constant'];
  }

  drawValueSpecificGraphics(graphics: PIXI.Graphics, data: any) {
    super.drawValueSpecificGraphics(graphics, data);
    if (data) {
      graphics.beginFill(data.hexNumber());
      graphics.drawCircle(0, 0, 4);
    }
  }
}

import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { BooleanWidget } from '../../widgets';
import { AbstractType } from './abstractType';
import * as PIXI from 'pixi.js';
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

  getColor(): TRgba {
    return new TRgba(90, 90, 90);
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['AND', 'OR', 'NOT', 'If_Else', 'Comparison'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['WidgetSwitch', 'Constant'];
  }

  static drawBooleanValue(graphics: PIXI.Graphics, data: any) {
    graphics.lineStyle(1, TRgba.white().hexNumber());
    graphics.beginFill(TRgba.white().hexNumber());
    if (data) {
      graphics.moveTo(-4, 0);
      graphics.lineTo(-1, 3);
      graphics.moveTo(-1.35, 2.65);
      graphics.lineTo(4, -3.5);
    } else {
      graphics.moveTo(-4, -4);
      graphics.lineTo(4, 4);
      graphics.moveTo(-4, 4);
      graphics.lineTo(4, -4);
    }
  }

  drawValueSpecificGraphics(graphics: PIXI.Graphics, data: any) {
    super.drawValueSpecificGraphics(graphics, data);
    BooleanType.drawBooleanValue(graphics, data);
  }
}

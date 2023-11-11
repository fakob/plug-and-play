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

  getMetaText(data: any): string {
    return data ? 'True' : 'False';
  }

  getColor(): TRgba {
    return new TRgba(90, 90, 90);
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['AND', 'OR', 'NOT', 'If_Else', 'Comparison'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['WidgetSwitch', 'Constant'];
  }
  drawValueSpecificGraphics(graphics: PIXI.Graphics, data: any) {
    //graphics.lineStyle(2, TRgba.white().hexNumber());
    if (data) {
      graphics.beginFill(TRgba.white().hexNumber());
      graphics.drawCircle(0, 0, 2);
      //graphics.moveTo(-5, -5);
      //graphics.lineTo(5, 0);
    }
  }
}

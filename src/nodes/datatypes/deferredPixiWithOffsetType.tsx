import * as PIXI from 'pixi.js';
import React from 'react';
import { AbstractType } from './abstractType';
import { TParseType, TRgba } from '../../utils/interfaces';
import { DeferredPixiWithOffsetWidget } from '../../widgets';

// its a function that will draw onto a container

type pixiWithOffsetType = {
  drawFunction: () => void;
  offset: PIXI.Point;
};

export class DeferredPixiWithOffsetType extends AbstractType {
  getInputWidget = (props: any): any => {
    props.dataType = this;
    return <DeferredPixiWithOffsetWidget {...props} />;
  };

  getOutputWidget = (props: any): any => {
    return <></>;
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 1,
      minW: 1,
      minH: 1,
    };
  }

  getName(): string {
    return 'Deferred Pixi with offset';
  }

  // TODO replace this with something more interesting (maybe drawing something basic?)
  getDefaultValue(): any {
    return { drawFunction: () => {}, offset: new PIXI.Point(0, 0) };
  }

  parse(data: any): TParseType {
    const value: pixiWithOffsetType = {
      drawFunction: data?.value,
      offset: new PIXI.Point(0, 0),
    };
    return { value, warnings: data?.warnings || [] };
  }

  getComment(commentData: any): string {
    return commentData ? 'Graphics' : 'null';
  }

  getColor(): TRgba {
    return new TRgba(239, 239, 138);
  }

  recommendedOutputNodeWidgets(): string[] {
    return [
      'DRAW_COMBINE_ARRAY',
      'DRAW_Combine',
      'DRAW_Passthrough',
      'DRAW_Multiplier',
      'DRAW_Multipy_Along',
      'Extract_Image_From_Graphics',
      'Extract_PixelArray_From_Graphics',
    ];
  }

  recommendedInputNodeWidgets(): string[] {
    return [
      'DRAW_Shape',
      'DRAW_Text',
      'DRAW_Line',
      'DRAW_Image',
      'DRAW_Polygon',
    ];
  }
  // cannot save this
  prepareDataForSaving(data: any) {
    return { drawFunction: undefined, x: data.x, y: data.y };
  }
}

import React from 'react';
import { FunctionType } from './functionType';

// its a function that will draw onto a container
export class DeferredPixiType extends FunctionType {
  getInputWidget = (props: any): any => {
    return <></>;
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
    return 'Deferred Pixi';
  }

  // TODO replace this with something more interesting (maybe drawing something basic?)
  getDefaultValue(): any {
    return () => {};
  }

  getComment(commentData: any): string {
    return commentData ? 'Graphics' : 'null';
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
    return undefined;
  }
}

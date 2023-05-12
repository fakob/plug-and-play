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

  getName(): string {
    return 'Deferred Pixi';
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
}

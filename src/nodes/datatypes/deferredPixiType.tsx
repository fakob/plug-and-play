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
}

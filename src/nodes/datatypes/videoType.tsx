import React from 'react';
import { FunctionType } from './functionType';

// its a function that will draw onto a container
export class VideoType extends FunctionType {
  getInputWidget = (props: any): any => {
    return <></>;
  };

  getOutputWidget = (props: any): any => {
    return <></>;
  };

  getName(): string {
    return 'Movie';
  }

  getComment(commentData: any): string {
    return commentData ? 'Graphics' : 'null';
  }
}

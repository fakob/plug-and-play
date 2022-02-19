import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { AbstractType } from './abstractType';

export class DeferredPixiType extends AbstractType {
  constructor() {
    super();
  }

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

  getColor(): TRgba {
    return new TRgba(229, 229, 128);
  }
}

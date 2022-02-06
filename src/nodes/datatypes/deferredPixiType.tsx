import React from 'react';
import { inspect } from 'util';
import { convertToString } from '../../utils/utils';
import { CodeWidget } from '../../widgets';
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
}

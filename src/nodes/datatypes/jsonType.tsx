import { inspect } from 'util';
import React from 'react';
import { JSONWidget, TextWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class JSONType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'JSON';
  }

  // TODO get a better JSON widget
  getInputWidget = (data: any): any => {
    return <JSONWidget {...data} />;
  };

  getDefaultValue(): any {
    return {};
  }

  getComment(data: any): string {
    if (data) {
      return inspect(data, null, 10);
    }
    return 'null';
  }
}

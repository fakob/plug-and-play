import { inspect } from 'util';
import React from 'react';
import { JSONWidget } from '../../widgets';
import { AbstractType } from './abstractType';
import { convertToString } from '../../utils/utils';
import { TRgba } from '../../utils/interfaces';

export class JSONType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'JSON';
  }

  getInputWidget = (props: any): any => {
    if (typeof props.data !== 'string') {
      props.data = convertToString(props.data);
    }
    return <JSONWidget {...props} />;
  };

  getDefaultValue(): any {
    return {};
  }

  getColor(): TRgba {
    return new TRgba(128, 128, 250);
  }

  getComment(data: any): string {
    if (data) {
      return inspect(data, null, 10);
    }
    return 'null';
  }
}

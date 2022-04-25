/* eslint-disable prettier/prettier */
import React from 'react';
import { inspect } from 'util';
import { DefaultOutputWidget, CodeWidget } from '../../widgets';
import { convertToString } from '../../utils/utils';
import { TRgba } from '../../utils/interfaces';
import { SOCKET_COLOR_HEX } from '../../utils/constants';
export class AbstractType {
  // override any and all of these in child classes
  getName(): string {
    return this.constructor.name;
  }
  toString(data: any): string {
    return this.getComment(data);
  }
  getComment(data: any): string {
    if (data !== undefined) {
      return inspect(data, null, 1);
    }
    return 'null';
  }

  getInputWidget = (props: any): any => {
    if (typeof props.data !== 'string') {
      props.data = convertToString(props.data);
    }
    return <CodeWidget {...props} />;
  };

  getOutputWidget = (props: any): any => {
    if (typeof props.data !== 'string') {
      props.data = convertToString(props.data);
    }
    return <DefaultOutputWidget {...props} />;
  };

  getDefaultValue(): any {
    return {};
  }

  getColor(): TRgba{
    return TRgba.fromString(SOCKET_COLOR_HEX);
  }

  // override this in children to check whether data is valid, can be used to give user information
  isDataValidForType(data: any): boolean {
    return true;
  }

  parse(data: any): any {
    return data;
  }
}

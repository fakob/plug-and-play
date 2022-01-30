/* eslint-disable prettier/prettier */
import React from 'react';
import { inspect } from 'util';
import { DefaultOutputWidget, CodeWidget } from '../../widgets';
export class AbstractType {
  // override any and all of these in child classes
  getName(): string {
    return this.constructor.name;
  }
  toString(data: any): string {
    return this.getComment(data);
  }
  getComment(data: any): string {
    if (data) {
      return inspect(data, null, 1);
    }
    return 'null';
  }

  getInputWidget = (data: any): any => {
    return <CodeWidget {...data} />;
  };

  getOutputWidget = (data: any): any => {
    return <DefaultOutputWidget {...data} />;
  };

  getDefaultValue(): any {
    return undefined;
  }

  // override this in children to check whether data is valid, can be used to give user information
  isDataValidForType(data: any): boolean {
    return true;
  }

  // TODO add more support for this in children, and make sure to call it from above
  parse(data: any, type: AbstractType): any {
    return data;
  }
}

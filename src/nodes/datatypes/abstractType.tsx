/* eslint-disable prettier/prettier */
import React from 'react';
import { inspect } from 'util';
import { DefaultOutputWidget, SliderWidget, TextWidget } from '../../widgets';
export class AbstractType {
  // TODO add functionality for switching between types n stuff, its what the below stuff here will be used for
  // an extensive list of all widgets you allow for input only allow these when switching widget type
  inputWidgets: any = [SliderWidget];
  // the same, for output
  outputWidgets: any = [DefaultOutputWidget];
  // define possible type conversions
  possibleConversions: AbstractType[] = [];

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
    return <TextWidget {...data} />;
  };

  getOutputWidget = (data: any): any => {
    return <DefaultOutputWidget {...data} />;
  };

  getDefaultValue(): any {
    return undefined;
  }
  
  // override this in children to check whether data is valid, can be used to give user information
  isDataValidForType(data:any) : boolean{
    return true;
  }
}

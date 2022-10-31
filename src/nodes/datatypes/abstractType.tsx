/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import { inspect } from 'util';
import Socket from '../../classes/SocketClass';
import { DefaultOutputWidget, CodeWidget } from '../../widgets';
import { convertToString } from '../../utils/utils';
import { TRgba } from '../../utils/interfaces';
import { SOCKET_COLOR_HEX } from '../../utils/constants';
export class AbstractType {

  valueChangedListeners : Record<string,(data:any) => void> = {} // dict of functions from data any to void

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
    props.dataType = this;

    return <CodeWidget {...props} />;
  };

  getOutputWidget = (props: any): any => {
    if (typeof props.data !== 'string') {
      props.data = convertToString(props.data);
    }

    props.dataType = this;
    return <DefaultOutputWidget {...props} />;
  };

  getDefaultValue(): any {
    return {};
  }

  getColor(): TRgba {
    return TRgba.fromString(SOCKET_COLOR_HEX);
  }

  // override this in children to check whether data is valid, can be used to give user information
  isDataValidForType(data: any): boolean {
    return true;
  }

  parse(data: any): any {
    return data;
  }

  onDataSet(data: any, socket: Socket): void {
    //console.log("listeners: " + this.valueChangedListeners.length)
    Object.keys(this.valueChangedListeners).forEach(key => {
      if (!this.valueChangedListeners[key]){
        delete this.valueChangedListeners[key]
      }
    });

    Object.keys(this.valueChangedListeners).forEach(key => this.valueChangedListeners[key](data));
    return;
  }

  defaultInputNodeWidget(): string {
    return 'Constant';
  }

  defaultOutputNodeWidget(): string {
    return 'Label';
  }

  allowedAsInput(): boolean {
    return true;
  }

  allowedAsOutput(): boolean {
    return true;
  }

}

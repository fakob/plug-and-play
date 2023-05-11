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
  onDataSet(data: any, socket: Socket) {
  }

  // override any and all of these in child classes
  getName(): string {
    return this.constructor.name;
  }
  toString(data: any): string {
    return this.getComment(data);
  }

  // optional, used to give extra information that should be written at all times next to the sockets, keep it short
  getMetaText(data: any): string {
    return "";
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

  parse(data: any): any {
    return data;
  }

  recommendedInputNodeWidgets(): string[] {
    return [];
  }

  recommendedOutputNodeWidgets(): string[] {
    return [];
  }

  allowedAsInput(): boolean {
    return true;
  }

  allowedAsOutput(): boolean {
    return true;
  }

  allowedToAutomaticallyAdapt(): boolean {
    return true;
  }
}

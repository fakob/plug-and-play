import React from 'react';
import Socket from '../../classes/SocketClass';
import { TriggerWidget, TriggerWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';
import { TRIGGER_TYPE_OPTIONS } from '../../utils/constants';

export class TriggerType extends AbstractType {
  triggerType: string;
  customFunctionString: string;
  constructor(
    triggerType = TRIGGER_TYPE_OPTIONS[0].value,
    customFunctionString = ''
  ) {
    super();
    this.triggerType = triggerType;
    this.customFunctionString = customFunctionString;
  }

  getName(): string {
    return 'Trigger';
  }

  getInputWidget = (props: any): any => {
    const triggerProps: TriggerWidgetProps = {
      property: props.property,
      isInput: props.isInput,
      index: props.index,
      hasLink: props.hasLink,
      data: props.data,
      type: this,
      randomMainColor: props.randomMainColor,
    };
    return <TriggerWidget {...triggerProps} />;
  };

  getOutputWidget = (data: any): any => {
    return <TriggerWidget {...data} />;
  };

  shouldTriggerExecution(
    socket: Socket,
    previousData: any,
    newData: any
  ): boolean {
    if (
      (this.triggerType === TRIGGER_TYPE_OPTIONS[0].value &&
        previousData !== newData) ||
      (this.triggerType === TRIGGER_TYPE_OPTIONS[1].value &&
        previousData < newData) ||
      (this.triggerType === TRIGGER_TYPE_OPTIONS[2].value &&
        previousData > newData)
    ) {
      // return false if a custom function is executed
      if (this.customFunctionString !== '') {
        socket.getNode()[this.customFunctionString]();
        return false;
      }
      return true;
    }
    return false;
  }
}

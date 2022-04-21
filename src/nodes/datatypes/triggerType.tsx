import React from 'react';
import Socket from '../../classes/SocketClass';
import { TriggerWidget, TriggerWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';
import {
  TRIGGER_FUNCTION_OPTIONS,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';

export class TriggerType extends AbstractType {
  changeFunctionString: string;
  triggerFunctionString: string;
  constructor(
    changeFunctionString = TRIGGER_TYPE_OPTIONS[0].value,
    triggerFunctionString = TRIGGER_FUNCTION_OPTIONS[0].value
  ) {
    super();
    this.changeFunctionString = changeFunctionString;
    this.triggerFunctionString = triggerFunctionString;
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

  onSetData(socket: Socket, previousData: any, newData: any): void {
    console.log(socket, previousData, newData);
    if (
      (this.changeFunctionString === TRIGGER_TYPE_OPTIONS[0].value &&
        previousData !== newData) ||
      (this.changeFunctionString === TRIGGER_TYPE_OPTIONS[1].value &&
        previousData < newData) ||
      (this.changeFunctionString === TRIGGER_TYPE_OPTIONS[2].value &&
        previousData > newData)
    ) {
      socket.getNode()[this.triggerFunctionString];
    }
  }
}

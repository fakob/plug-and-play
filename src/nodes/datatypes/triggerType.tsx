import React from 'react';
import Socket from '../../classes/SocketClass';
import { TriggerWidget, TriggerWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';
import { TRIGGER_TYPE_OPTIONS } from '../../utils/constants';

export class TriggerType extends AbstractType {
  triggerType: string;
  customFunctionString: string;
  previousData: any = undefined;
  constructor(
    triggerType = TRIGGER_TYPE_OPTIONS[0].text,
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

  onDataSet(data: any, socket: Socket): void {
    super.onDataSet(data, socket);
    if (
      socket.isInput() &&
      (this.previousData === undefined || // after loading the first time, execute regardless
        (this.triggerType === TRIGGER_TYPE_OPTIONS[0].text &&
          this.previousData < data) ||
        (this.triggerType === TRIGGER_TYPE_OPTIONS[1].text &&
          this.previousData > data) ||
        (this.triggerType === TRIGGER_TYPE_OPTIONS[2].text &&
          this.previousData !== data) ||
        this.triggerType === TRIGGER_TYPE_OPTIONS[3].text)
    ) {
      // if im an input and condition is fullfilled, execute either custom function or start new chain with this as origin
      if (this.customFunctionString !== '') {
        socket.getNode()[this.customFunctionString]();
      } else {
        socket.getNode().executeOptimizedChain();
      }
    }
    this.previousData = data;
  }

  allowedAsOutput(): boolean {
    return false;
  }

  allowedToAutomaticallyAdapt(): boolean {
    return false;
  }

  recommendedInputNodeWidgets(): string[] {
    return ['WidgetButton', 'Constant', 'WidgetSwitch'];
  }
}

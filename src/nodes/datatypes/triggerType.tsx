import React from 'react';
import { TriggerWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class TriggerType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Trigger';
  }

  getInputWidget = (data: any): any => {
    return <TriggerWidget {...data} />;
  };

  getOutputWidget = (data: any): any => {
    return <TriggerWidget {...data} />;
  };
}

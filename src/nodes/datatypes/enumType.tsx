import React from 'react';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export class EnumType extends AbstractType {
  options;
  constructor(inOptions: [any]) {
    super();
    this.options = inOptions;
  }

  getInputWidget = (data: any): any => {
    const widgetProps: SelectWidgetProps = data;
    widgetProps.options;
    return <SelectWidget {...widgetProps} />;
  };
}

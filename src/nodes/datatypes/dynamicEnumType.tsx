import React from 'react';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export class DynamicEnumType extends AbstractType {
  getOptions = () => [];
  constructor(getOptions) {
    super();
    this.getOptions = getOptions;
  }
  getName(): string {
    return 'Dynamic Enum';
  }

  getDefaultValue(): any {
    return '';
  }

  getInputWidget = (data: any): any => {
    const widgetProps: SelectWidgetProps = data;
    widgetProps.options = this.getOptions();
    return <SelectWidget {...widgetProps} />;
  };
}

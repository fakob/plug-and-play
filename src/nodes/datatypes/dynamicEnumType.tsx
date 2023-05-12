/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export class DynamicEnumType extends AbstractType {
  getOptions = () => [];
  onChange = () => {};
  constructor(getOptions, onChange = () => {}) {
    super();
    this.getOptions = getOptions;
    this.onChange = onChange;
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
    widgetProps.onChange = this.onChange;
    return <SelectWidget {...widgetProps} />;
  };

  recommendedOutputNodeWidgets(): string[] {
    return ['WidgetDropdown'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['CodeEditor', 'Constant'];
  }
}

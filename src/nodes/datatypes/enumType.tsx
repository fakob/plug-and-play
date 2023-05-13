import React from 'react';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export type EnumStructure = { text: string; value?: any }[];

// This class is a crutch for legacy reasons, you normally shouldn't need it but instead create new types

export class EnumType extends AbstractType {
  options: EnumStructure;
  onChange?: (value: string) => void;

  constructor(inOptions: EnumStructure, onChange?: (value: string) => void) {
    super();
    this.options = inOptions;
    this.onChange = onChange;
  }

  getName(): string {
    return 'Enum';
  }

  getInputWidget = (data: any): any => {
    const widgetProps: SelectWidgetProps = data;
    widgetProps.options = this.options;
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

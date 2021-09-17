import React from 'react';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export type EnumStructure = { text: string; value: any }[];

// IMPORTANT: This class is a crutch for legacy reasons, you normally shouldn't need it but instead create new types

export class EnumType extends AbstractType {
  options: EnumStructure;
  constructor(inOptions: EnumStructure) {
    super();
    this.options = inOptions;
  }

  getName(): string {
    return 'Enum';
  }

  getInputWidget = (data: any): any => {
    const widgetProps: SelectWidgetProps = data;
    widgetProps.options = this.options;
    return <SelectWidget {...widgetProps} />;
  };
}

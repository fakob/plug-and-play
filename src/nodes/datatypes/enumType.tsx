import React from 'react';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export type EnumStructure = { text: string; value?: any }[];

// This class is a crutch for legacy reasons, you normally shouldn't need it but instead create new types

export class EnumType extends AbstractType {
  options: EnumStructure;
  onChange?: (value: string) => void;
  setOptions?: () => EnumStructure;

  constructor(
    inOptions: EnumStructure,
    onChange?: (value: string) => void,
    setOptions?: () => EnumStructure
  ) {
    super();
    this.options = inOptions;
    this.onChange = onChange;
    this.setOptions = setOptions;
  }

  getName(): string {
    return 'Enum';
  }

  setSetOptions(newSetOptions: () => EnumStructure): void {
    this.setOptions = newSetOptions;
  }

  getInputWidget = (data: any): any => {
    const widgetProps: SelectWidgetProps = data;
    widgetProps.options = this.options;
    widgetProps.setOptions = this.setOptions;
    widgetProps.onChange = this.onChange;
    return <SelectWidget {...widgetProps} />;
  };
}

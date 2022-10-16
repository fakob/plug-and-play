import React from 'react';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export type EnumStructure = { text: string; value?: any }[];

// This class is a crutch for legacy reasons, you normally shouldn't need it but instead create new types

export class EnumType extends AbstractType {
  options: EnumStructure;
  onChange?: (value: string) => void;
  onOpen?: () => void;

  constructor(
    inOptions: EnumStructure,
    onChange?: (value: string) => void,
    onOpen?: () => void
  ) {
    super();
    this.options = inOptions;
    this.onChange = onChange;
    this.onOpen = onOpen;
  }

  getName(): string {
    return 'Enum';
  }

  setOnOpen(newOnOpen?: () => void): void {
    this.onOpen = newOnOpen;
  }

  setOptions(newOptions: EnumStructure): void {
    this.options = newOptions;
  }

  getInputWidget = (data: any): any => {
    const widgetProps: SelectWidgetProps = data;
    widgetProps.options = this.options;
    widgetProps.onChange = this.onChange;
    widgetProps.onOpen = this.onOpen;
    return <SelectWidget {...widgetProps} />;
  };
}

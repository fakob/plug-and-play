import React from 'react';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export type EnumStructure = { text: string; value?: any }[];

// This class is a crutch for legacy reasons, you normally shouldn't need it but instead create new types

export class EnumType extends AbstractType {
  options: EnumStructure;
  onChange?: (value: string) => void;
  onOpen?: () => void;
  setOptions?: () => EnumStructure;

  constructor(inOptions: EnumStructure, onChange?: (value: string) => void) {
    super();
    this.options = inOptions;
    this.onChange = onChange;
  }

  getName(): string {
    return 'Enum';
  }

  setOnOpen(newOnOpen: () => void): void {
    this.onOpen = newOnOpen;
  }

  setSetOptions(newSetOptions: () => EnumStructure): void {
    this.setOptions = newSetOptions;
  }

  getInputWidget = (data: any): any => {
    const widgetProps: SelectWidgetProps = data;
    widgetProps.setOptions = this.setOptions;
    widgetProps.onChange = this.onChange;
    widgetProps.onOpen = this.onOpen;
    return <SelectWidget {...widgetProps} />;
  };
}

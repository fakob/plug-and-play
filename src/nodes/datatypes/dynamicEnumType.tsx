/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import { SelectWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';
import { EnumStructure } from './enumType';

export interface DynamicEnumTypeProps extends DataTypeProps {
  dataType: DynamicEnumType;
  options: EnumStructure;
  onChange?: (value: string) => void;
  setOptions;
}

export class DynamicEnumType extends AbstractType {
  getOptions = () => [];
  onChange = () => {};
  constructor(getOptions, onChange) {
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

  getInputWidget = (props: DynamicEnumTypeProps): any => {
    props.dataType = this;
    props.options = this.getOptions();
    props.onChange = this.onChange;
    return <SelectWidget {...props} />;
  };

  recommendedOutputNodeWidgets(): string[] {
    return ['WidgetDropdown'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['CodeEditor', 'Constant'];
  }

  configureOnLoad(): boolean {
    return false;
  }
}

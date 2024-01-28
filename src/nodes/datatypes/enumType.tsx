import React from 'react';
import { SelectWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';

export type EnumStructure = { text: string; value?: any }[];

export interface EnumTypeProps extends DataTypeProps {
  dataType: EnumType;
  options: EnumStructure;
  onChange?: (value: string) => void;
  setOptions;
}

// This class is a crutch for legacy reasons, you normally shouldn't need it but instead create new types

export class EnumType extends AbstractType {
  options: EnumStructure;
  onChange?: (value: string) => void;

  constructor(
    inOptions: EnumStructure,
    onChange: (value: string) => void = () => {},
  ) {
    super();
    this.options = inOptions;
    this.onChange = onChange;
  }

  getName(): string {
    return 'Enum';
  }

  getInputWidget = (props: EnumTypeProps): any => {
    props.dataType = this;
    props.options = this.options;
    props.onChange = this.onChange;
    return <SelectWidget {...props} />;
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 2,
      minW: 1,
      minH: 1,
    };
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['WidgetDropdown'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['CodeEditor', 'Constant'];
  }
}

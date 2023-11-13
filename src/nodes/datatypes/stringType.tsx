import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { TextWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';

export interface StringTypeProps extends DataTypeProps {
  dataType: StringType;
}

export class StringType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'String';
  }

  getInputWidget = (props: StringTypeProps): any => {
    props.dataType = this;
    return <TextWidget {...props} />;
  };

  getOutputWidget = (props: StringTypeProps): any => {
    props.dataType = this;
    return <TextWidget {...props} />;
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 2,
      minW: 1,
      minH: 1,
    };
  }

  getDefaultValue(): any {
    return '';
  }

  getColor(): TRgba {
    return new TRgba(148, 250, 148);
  }

  parse(data: any): any {
    if (typeof data == 'object' || Array.isArray(data)) {
      return JSON.stringify(data);
    }
    return data;
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['Label', 'DRAW_Text', 'Add'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['Label', 'Constant', 'TextEditor'];
  }
}

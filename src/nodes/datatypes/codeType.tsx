import React from 'react';
import { CodeWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';
import { convertToString } from '../../utils/utils';

export interface CodeTypeProps extends DataTypeProps {
  dataType: CodeType;
}

export class CodeType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Code';
  }

  getInputWidget = (props: CodeTypeProps): any => {
    props.dataType = this;
    if (typeof props.property.data !== 'string') {
      props.property.data = convertToString(props.property.data);
    }
    return <CodeWidget {...props} />;
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 4,
      minW: 2,
      minH: 2,
    };
  }

  getDefaultValue(): any {
    return '';
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['CodeEditor'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['CodeEditor', 'Constant'];
  }
}

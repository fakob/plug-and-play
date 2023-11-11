import React from 'react';
import { CodeWidget } from '../../widgets';
import { AbstractType } from './abstractType';
import { convertToString } from '../../utils/utils';

export class CodeType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Code';
  }

  getInputWidget = (props: any): any => {
    if (typeof props.data !== 'string') {
      props.data = convertToString(props.data);
    }
    props.dataType = this;
    return <CodeWidget {...props} />;
  };

  getInputWidgetSize(): any {
    return {
      w: 2,
      h: 4,
      minW: 2,
      minH: 2,
    };
  }

  getOutputWidgetSize(): any {
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

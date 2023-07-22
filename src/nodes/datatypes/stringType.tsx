import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { TextWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class StringType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'String';
  }

  getInputWidget = (data: any): any => {
    const props = { ...data };
    return <TextWidget {...props} />;
  };

  getDefaultValue(): any {
    return '';
  }

  getColor(): TRgba {
    return new TRgba(148, 250, 148);
  }

  parse(data: any): any {
    if (typeof data == 'object' || Array.isArray(data)) {
      try {
        return JSON.stringify(data);
      } catch (e) {
        // continue
      }
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

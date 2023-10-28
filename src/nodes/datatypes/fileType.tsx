import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { FileBrowserWidget } from '../../widgets';
import { AbstractType } from './abstractType';

export class FileType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'File';
  }

  getInputWidget = (data: any): any => {
    const props = { ...data };
    return <FileBrowserWidget {...props} />;
  };

  getDefaultValue(): any {
    return '';
  }

  getColor(): TRgba {
    return new TRgba(148, 0, 148);
  }

  parse(data: any): any {
    if (typeof data == 'object' || Array.isArray(data)) {
      return JSON.stringify(data);
    }
    return data;
  }

  allowedAsOutput(): boolean {
    return false;
  }

  recommendedInputNodeWidgets(): string[] {
    return ['Label', 'Constant', 'TextEditor'];
  }
}

import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { FileBrowserWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';

export interface FileTypeProps extends DataTypeProps {
  dataType: FileType;
}

export class FileType extends AbstractType {
  filterExtensions: string[];
  constructor(filterExtensions = []) {
    super();
    this.filterExtensions = filterExtensions;
  }

  getName(): string {
    return 'File';
  }

  getInputWidget = (props: FileTypeProps): any => {
    props.dataType = this;
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

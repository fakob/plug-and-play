import React from 'react';
import { TRgba } from '../../utils/interfaces';
import { FileBrowserWidget, FileWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';

export class FileType extends AbstractType {
  filterExtensions: string[];
  constructor(filterExtensions = []) {
    super();
    this.filterExtensions = filterExtensions;
  }

  getName(): string {
    return 'File';
  }

  getInputWidget = (props: any): any => {
    const sliderProps: FileWidgetProps = {
      property: props.property,
      hasLink: props.hasLink,
      index: props.index,
      data: props.data,
      randomMainColor: props.randomMainColor,
      type: this,
    };
    return <FileBrowserWidget {...sliderProps} />;
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

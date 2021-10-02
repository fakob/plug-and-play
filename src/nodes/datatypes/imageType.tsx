import React from 'react';
import { AbstractType } from './abstractType';

export class ImageType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Image';
  }

  // no widget for this, or maybe something that displays the image?
  getInputWidget = (data: any): any => {
    return <div></div>;
  };

  getDefaultValue(): any {
    return '';
  }

  getComment(data: any): string {
    return 'Image';
  }
}

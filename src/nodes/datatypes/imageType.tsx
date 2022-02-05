import React from 'react';
import { AbstractType } from './abstractType';
import { CodeWidget } from '../../widgets';
import { convertToString } from '../../utils/utils';

export class ImageType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Image';
  }

  // no widget for this, or maybe something that displays the image or some cool data?
  getInputWidget = (props: any): any => {
    console.log(props, typeof props);
    if (typeof props.data === 'string') {
      return <img src={props.data} alt="Red dot" />;
    }
    return '';
  };

  getDefaultValue(): any {
    return '';
  }

  getComment(data: any): string {
    return data ? 'Image' : 'No Image';
  }
}

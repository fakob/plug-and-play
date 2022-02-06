import React from 'react';
import { AbstractType } from './abstractType';
import { BROKEN_IMAGE } from '../../utils/constants';

export class ImageType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Image';
  }

  // no widget for this, or maybe something that displays the image or some cool data?
  getInputWidget = (props: any): any => {
    if (typeof props.data === 'string') {
      return (
        <img
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          src={props.data}
          alt={props.key}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src = BROKEN_IMAGE;
            currentTarget.style.width = '48px';
          }}
        />
      );
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

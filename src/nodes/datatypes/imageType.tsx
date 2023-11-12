import React from 'react';
import { AbstractType } from './abstractType';
import { BROKEN_IMAGE } from '../../utils/constants';

type ImgComponentProps = {
  data: string;
  alt: string;
};

const ImgComponent: React.FunctionComponent<ImgComponentProps> = (props) => {
  return (
    <img
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '60vh',
        objectFit: 'scale-down',
      }}
      src={props.data}
      alt={props.alt}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null; // prevents looping
        currentTarget.src = BROKEN_IMAGE;
        currentTarget.style.width = '48px';
      }}
    />
  );
};

export class ImageType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'Image';
  }

  getInputWidget = (props: any): any => {
    if (typeof props.data === 'string') {
      return <ImgComponent data={props.data} alt={props.key} />;
    }
    return '';
  };

  getOutputWidget = (props: any): any => {
    if (typeof props.data === 'string') {
      return <ImgComponent data={props.data} alt={props.key} />;
    }
    return '';
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 5,
      minW: 2,
      minH: 2,
    };
  }

  getDefaultValue(): any {
    return '';
  }

  getComment(data: any): string {
    return data ? 'Image' : 'No Image';
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['DRAW_Image', 'ImageShader', 'Image'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['Image', 'Extract_Image_From_Graphics'];
  }
}

import React from 'react';
import { AbstractType, DataTypeProps } from './abstractType';
import { BROKEN_IMAGE } from '../../utils/constants';

interface ImageTypeProps extends DataTypeProps {
  dataType: ImageType;
}

const ImageWidget: React.FunctionComponent<ImageTypeProps> = (props) => {
  return (
    <img
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '60vh',
        objectFit: 'contain',
      }}
      src={props.property.data}
      alt={props.property.name}
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
    props.dataType = this;
    if (typeof props.property.data === 'string') {
      return <ImageWidget {...props} />;
    }
    return '';
  };

  getOutputWidget = (props: any): any => {
    props.dataType = this;
    if (typeof props.property.data === 'string') {
      return <ImageWidget {...props} />;
    }
    return '';
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 5,
      minW: 1,
      minH: 1,
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

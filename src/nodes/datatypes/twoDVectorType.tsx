import React from 'react';
import { DEFAULT_2DVECTOR } from '../../utils/constants';
import { parse2DVector } from '../../utils/utils';
import { TTwoDVector, TParseType, TRgba } from '../../utils/interfaces';
import { TwoDNumberWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';

export interface TwoDVectorTypeProps extends DataTypeProps {
  dataType: TwoDVectorType;
}

export class TwoDVectorType extends AbstractType {
  getInputWidget = (props: TwoDVectorTypeProps): any => {
    props.dataType = this;
    return <TwoDNumberWidget {...props} />;
  };

  getInputWidgetSize(): any {
    return {
      w: 2,
      h: 2,
      minW: 2,
      minH: 1,
    };
  }

  getOutputWidgetSize(): any {
    return {
      w: 2,
      h: 2,
      minW: 1,
      minH: 1,
    };
  }

  getName(): string {
    return '2D vector';
  }

  getDefaultValue(): TTwoDVector {
    return DEFAULT_2DVECTOR;
  }

  parse(data: any): TParseType {
    return parse2DVector(data);
  }

  getColor(): TRgba {
    return new TRgba(128, 229, 229);
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['Label', 'Break'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['Constant'];
  }
}

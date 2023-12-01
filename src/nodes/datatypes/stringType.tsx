import React from 'react';
import { SocketParsingWarning } from '../../classes/ErrorClass';
import { TParseType, TRgba } from '../../utils/interfaces';
import { TextWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';

export interface StringTypeProps extends DataTypeProps {
  dataType: StringType;
}

export class StringType extends AbstractType {
  constructor() {
    super();
  }

  getName(): string {
    return 'String';
  }

  getInputWidget = (props: StringTypeProps): any => {
    props.dataType = this;
    return <TextWidget {...props} />;
  };

  getOutputWidget = (props: StringTypeProps): any => {
    props.dataType = this;
    return <TextWidget {...props} />;
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 2,
      minW: 1,
      minH: 1,
    };
  }

  getDefaultValue(): any {
    return '';
  }

  getColor(): TRgba {
    return new TRgba(148, 250, 148);
  }

  parse(data: any): TParseType {
    return parseString(data);
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['Label', 'DRAW_Text', 'Add'];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['Label', 'Constant', 'TextEditor'];
  }
}

export const parseString = (data: any): TParseType => {
  let parsedData;
  const warnings: SocketParsingWarning[] = [];

  if (typeof data == 'object' || Array.isArray(data)) {
    try {
      parsedData = JSON.stringify(data);
    } catch (error) {}
  } else {
    parsedData = String(data);
  }
  if (parsedData == undefined) {
    parsedData = '';
    warnings.push(
      new SocketParsingWarning('Not a string. Empty string is returned'),
    );
  }

  return {
    value: parsedData,
    warnings: warnings,
  };
};

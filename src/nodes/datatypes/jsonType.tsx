import { inspect } from 'util';
import React from 'react';
import { JSONWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';
import { TParseType, TRgba } from '../../utils/interfaces';
import { parseJSON } from '../../utils/utils';

export interface JSONTypeProps extends DataTypeProps {
  dataType: JSONType;
}

export class JSONType extends AbstractType {
  strictParsing: boolean; // whether to force the result into JSON or not
  constructor(strictParsing: boolean = false) {
    super();
    this.strictParsing = strictParsing;
  }

  getName(): string {
    return 'JSON';
  }

  getInputWidget = (props: JSONTypeProps): any => {
    props.dataType = this;
    return <JSONWidget {...props} />;
  };

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 4,
      minW: 2,
      minH: 2,
    };
  }

  getDefaultValue(): any {
    return {};
  }

  getColor(): TRgba {
    return new TRgba(128, 128, 250);
  }

  getComment(data: any): string {
    if (data) {
      return inspect(data, null, 10);
    }
    return 'null';
  }

  dataIsCompatible(data: any): boolean {
    return typeof data === 'string' || typeof data == 'object';
  }

  parse(data: any): TParseType {
    return parseJSON(data, this.strictParsing);
  }

  recommendedOutputNodeWidgets(): string[] {
    return [
      'Break',
      'Format',
      'JSONKeys',
      'JSONValues',
      'CodeEditor',
      'Table',
      'MergeJSONs',
    ];
  }

  recommendedInputNodeWidgets(): string[] {
    return ['CodeEditor', 'Constant'];
  }
}

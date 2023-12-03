import { inspect } from 'util';
import React from 'react';
import { SocketParsingWarning } from '../../classes/ErrorClass';
import { JSONWidget } from '../../widgets';
import { AbstractType, DataTypeProps } from './abstractType';
import { convertToString } from '../../utils/utils';
import { TParseType, TRgba } from '../../utils/interfaces';

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
    if (typeof props.property.data !== 'string') {
      props.property.data = convertToString(props.property.data);
    }
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

  parse(data: any): TParseType {
    let parsedData;
    const warnings: SocketParsingWarning[] = [];
    if (typeof data === 'string' || this.strictParsing) {
      try {
        parsedData = JSON.parse(data);
      } catch (error) {}
    }
    if (parsedData == undefined) {
      try {
        parsedData = JSON.parse(JSON.stringify(data));
      } catch (error) {
        parsedData = {};
        warnings.push(new SocketParsingWarning('Not a JSON. {} is returned'));
      }
    }

    return {
      value: parsedData,
      warnings: warnings,
    };
  }

  recommendedOutputNodeWidgets(): string[] {
    return [
      'Break',
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

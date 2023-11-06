import { inspect } from 'util';
import React from 'react';
import { JSONWidget } from '../../widgets';
import { AbstractType } from './abstractType';
import { convertToString } from '../../utils/utils';
import { TRgba } from '../../utils/interfaces';

export class JSONType extends AbstractType {
  strictParsing: boolean; // whether to force the result into JSON or not
  constructor(strictParsing: boolean = false) {
    super();
    this.strictParsing = strictParsing;
  }

  getName(): string {
    return 'JSON';
  }

  getInputWidget = (props: any): any => {
    if (typeof props.data !== 'string') {
      props.data = convertToString(props.data);
    }
    props.dataType = this;
    return <JSONWidget {...props} />;
  };

  getInputWidgetSize(): any {
    return {
      w: 2,
      h: 4,
      minW: 2,
      minH: 2,
    };
  }

  getOutputWidgetSize(): any {
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

  parse(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        // console.log('failed parsing data: ' + data);
        if (this.strictParsing) {
          return { InvalidJSON: data };
        }
      }
    }
    return data;
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

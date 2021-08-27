/* eslint-disable prettier/prettier */
import React, { useEffect, useRef, useState } from 'react';
import { DefaultOutputWidget, SliderWidget } from '../../widgets';
export class AbstractType {
  inputWidgets: any = [];
  outputWidgets: any = [];

  getName(): string {
    return 'Abstract Type';
  }
  toString(data: any): string {
    return data.toString();
  }

  getInputWidget = (data: any): any => {
    return <SliderWidget {...data} />;
  };

  getOutputWidget = (data: any): any => {
    return <DefaultOutputWidget {...data} />;
  };

  getDefaultValue(): any {
    return 0;
  }
}

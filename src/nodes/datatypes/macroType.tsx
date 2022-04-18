/* eslint-disable prettier/prettier */
import React from 'react';
import PPGraph from '../../classes/GraphClass';
import { SelectWidget, SelectWidgetProps } from '../../widgets';
import { AbstractType } from './abstractType';
import { EnumStructure } from './enumType';

export class MacroType extends AbstractType {
  getName(): string {
    return 'Macro';
  }

  private getMacroEnumOptions(graph: PPGraph): EnumStructure {
    return Object.values(graph.macrosIn).map((macroNode) => {
      return { text: macroNode.name, value: macroNode.name };
    });
  }

  getInputWidget = (data: any): any => {
    const widgetProps: SelectWidgetProps = data;
    widgetProps.options = this.getMacroEnumOptions(
      data.property.getNode().graph
    );
    return <SelectWidget {...widgetProps} />;
  };
}

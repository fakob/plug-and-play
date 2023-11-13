import { TRgba } from '../../utils/interfaces';
import { AbstractType } from './abstractType';

/* eslint-disable prettier/prettier */
export class AnyType extends AbstractType {
  getName(): string {
    return 'Any';
  }

  getDefaultWidgetSize(): any {
    return {
      w: 2,
      h: 2,
      minW: 1,
      minH: 1,
    };
  }

  getDefaultValue(): any {
    return 0;
  }

  getColor(): TRgba {
    return new TRgba(204, 204, 204);
  }

  recommendedOutputNodeWidgets(): string[] {
    return ['Label', 'CodeEditor', 'LogViewer', 'ConsolePrint'];
  }

  recommendedInputNodeWidgets(): string[] {
    return [
      'CodeEditor',
      'Constant',
      'WidgetButton',
      'WidgetSlider',
      'WidgetSwitch',
      'Label',
      'WidgetColorPicker',
    ];
  }
}

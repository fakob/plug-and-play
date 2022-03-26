import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import {
  COLOR,
  NODE_TYPE_COLOR,
  SOCKET_WIDTH,
  NODE_CORNERRADIUS,
  NODE_PADDING_TOP,
  NODE_HEADER_HEIGHT,
  NODE_WIDTH,
  SOCKET_HEIGHT,
} from '../utils/constants';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { getMethods } from '../utils/utils';
import { NumberType } from './datatypes/numberType';
import { AnyType } from './datatypes/anyType';
import { TriggerType } from './datatypes/triggerType';
import { ColorType } from './datatypes/colorType';
import { StringType } from './datatypes/stringType';
import { EnumType } from './datatypes/enumType';

export class Mouse extends PPNode {
  onViewportMove: (event: PIXI.InteractionEvent) => void;
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onViewportZoomed: (event: PIXI.InteractionEvent) => void;
  onViewportZoomedHandler: (event?: PIXI.InteractionEvent) => void;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      customArgs,
    });

    this.addOutput('screen-x', new NumberType());
    this.addOutput('screen-y', new NumberType());
    this.addOutput('world-x', new NumberType());
    this.addOutput('world-y', new NumberType());
    this.addOutput('scale', new NumberType());
    this.addOutput('buttons', new NumberType());

    this.name = 'Mouse';
    this.description = 'Get mouse coordinates';

    // add event listener
    this.onViewportMove = (event: PIXI.InteractionEvent): void => {
      const screen = event.data.global;
      const world = this.graph.viewport.toWorld(screen.x, screen.y);
      const buttons = event.data.buttons;
      this.setOutputData('screen-x', screen.x);
      this.setOutputData('screen-y', screen.y);
      this.setOutputData('world-x', world.x);
      this.setOutputData('world-y', world.y);
      this.setOutputData('buttons', buttons);
    };
    this.onViewportMoveHandler = this.onViewportMove.bind(this);
    this.graph.viewport.on('pointermove', (this as any).onViewportMoveHandler);

    this.onViewportZoomed = (event: PIXI.InteractionEvent): void => {
      const scale = (event as any).viewport.scale.x;
      this.setOutputData('scale', scale);
    };
    this.onViewportZoomedHandler = this.onViewportZoomed.bind(this);
    this.graph.viewport.on('zoomed', (this as any).onViewportZoomedHandler);
  }
  protected getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class GridCoordinates extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);

    this.addOutput('x-array', new AnyType());
    this.addOutput('y-array', new AnyType());
    this.addInput('x', new NumberType(), 0, false);
    this.addInput('y', new NumberType(), 0, false);
    this.addInput('count', new NumberType(true), 9, false);
    this.addInput('column', new NumberType(true), 3, false);
    this.addInput('distanceWidth', new NumberType(), 110.0, false);
    this.addInput('distanceHeight', new NumberType(), 110.0, false);

    this.name = 'Grid coordinates';
    this.description = 'Create grid coordinates';

    this.onExecute = async function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const count = input['count'];
      const column = Math.abs(input['column']);
      const distanceWidth = Math.abs(input['distanceWidth']);
      const distanceHeight = Math.abs(input['distanceHeight']);
      const xArray = [];
      const yArray = [];
      for (let indexCount = 0; indexCount < count; indexCount++) {
        xArray.push(x + distanceWidth * (indexCount % column));
        yArray.push(y + distanceHeight * Math.floor(indexCount / column));
      }
      output['x-array'] = xArray;
      output['y-array'] = yArray;
    };
  }
  protected getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class ColorArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const colorA: TRgba = TRgba.fromString(COLOR[5]);
    const colorB: TRgba = TRgba.fromString(COLOR[15]);

    super(name, graph, customArgs);

    this.addOutput('color-array', new AnyType());
    this.addInput('count', new NumberType(true), 9, false);
    this.addInput('colorA', new ColorType(), colorA, false);
    this.addInput('colorB', new ColorType(), colorB, false);

    this.name = 'Color array';
    this.description = 'Create color array';

    this.onExecute = async function (input, output) {
      const count = input['count'];
      const colorA: TRgba = input['colorA'];
      const colorB: TRgba = input['colorB'];
      const colorArray = [];
      for (let indexCount = 0; indexCount < count; indexCount++) {
        const blendFactor = count <= 1 ? 0 : indexCount / (count - 1);
        colorArray.push(colorA.mix(colorB, blendFactor));
      }
      output['color-array'] = colorArray;
    };
  }
  protected getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class RangeArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);

    this.addOutput('output array', new AnyType());
    this.addInput('start', new NumberType());
    this.addInput('stop', new NumberType());
    this.addInput('step', new NumberType());

    this.name = 'Range array';
    this.description = 'Create range array';

    this.onExecute = async function (input, output) {
      const start = input['start'] || 0;
      const stop = input['stop'] || 100;
      const step = input['step'] || 2;
      output['output array'] = Array.from(
        { length: (stop - start) / step + 1 },
        (_, i) => start + i * step
      );
    };
  }
  protected getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class RandomArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);

    this.addOutput('output array', new AnyType());
    this.addInput('trigger', new TriggerType());
    this.addInput('length', new NumberType(true, 1), 20, undefined);
    this.addInput('min', new NumberType(), 0);
    this.addInput('max', new NumberType(), 1);

    this.name = 'Random array';
    this.description = 'Create random array';
  }

  trigger(): void {
    const length = this.getInputData('length');
    const min = this.getInputData('min');
    const max = this.getInputData('max');
    const randomArray = Array.from({ length: length }, () => {
      return Math.floor(Math.random() * (max - min) + min);
    });
    this.setOutputData('output array', randomArray);
  }
  protected getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class Trigger extends PPNode {
  _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);

    this.addOutput('trigger', new TriggerType());

    this.name = 'Trigger';
    this.description = 'Creates a trigger event';

    this.onNodeAdded = () => {
      const button = new PIXI.Graphics();
      this._rectRef = (this as PIXI.Container).addChild(button);
      this._rectRef.beginFill(PIXI.utils.string2hex('#00FF00'));
      this._rectRef.drawRoundedRect(
        SOCKET_WIDTH,
        NODE_PADDING_TOP + NODE_HEADER_HEIGHT,
        NODE_WIDTH / 2,
        SOCKET_HEIGHT,
        NODE_CORNERRADIUS
      );
      this._rectRef.endFill();

      this._rectRef.buttonMode = true;
      this._rectRef.interactive = true;

      this._rectRef.on('pointerdown', this.trigger.bind(this));
    };
  }
  trigger(): void {
    console.log('Triggered node: ', this.name);
    this.outputSocketArray[0].links.forEach((link) => {
      (link.target.parent as any).trigger();
    });
  }
  onButtonOver(): void {
    this._rectRef.cursor = 'hover';
  }

  protected getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

export class DateAndTime extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);

    const dateMethodsArray = getMethods(new Date());
    const dateMethodsArrayOptions = dateMethodsArray
      .filter((methodName) => {
        // do not expose constructor and setters
        const shouldExposeMethod = !(
          methodName === 'constructor' || methodName.startsWith('set')
        );
        return shouldExposeMethod;
      })
      .sort()
      .map((methodName) => {
        return {
          text: methodName,
          value: methodName,
        };
      });

    this.addInput(
      'Date method',
      new EnumType(dateMethodsArrayOptions),
      'toUTCString',
      false
    );
    this.addOutput('date and time', new StringType());

    this.name = 'Date and time';
    this.description = 'Outputs current time in different formats';

    this.onExecute = async function (input) {
      const dateMethod = input['Date method'];
      this.setOutputData('date and time', new Date()[dateMethod]());
    };
  }
  protected getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }
}

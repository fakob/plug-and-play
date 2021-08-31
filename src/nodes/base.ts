import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import {
  COLOR,
  NODE_TYPE_COLOR,
  DATATYPE,
  SOCKET_WIDTH,
  NODE_OUTLINE_DISTANCE,
  NODE_CORNERRADIUS,
  NODE_PADDING_TOP,
  NODE_HEADER_HEIGHT,
  NODE_WIDTH,
  SOCKET_HEIGHT,
} from '../utils/constants';
import { CustomArgs } from '../utils/interfaces';
import { colorToTrgba, hexToTRgba, trgbaToColor } from '../pixi/utils-pixi';

export class Mouse extends PPNode {
  onViewportMove: (event: PIXI.InteractionEvent) => void;
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onViewportZoomed: (event: PIXI.InteractionEvent) => void;
  onViewportZoomedHandler: (event?: PIXI.InteractionEvent) => void;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.INPUT,
    });

    this.addOutput('screen-x', DATATYPE.NUMBER);
    this.addOutput('screen-y', DATATYPE.NUMBER);
    this.addOutput('world-x', DATATYPE.NUMBER);
    this.addOutput('world-y', DATATYPE.NUMBER);
    this.addOutput('scale', DATATYPE.NUMBER);
    this.addOutput('buttons', DATATYPE.NUMBER);

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
}

export class GridCoordinates extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.INPUT,
    });

    this.addOutput('x-array', DATATYPE.ARRAY);
    this.addOutput('y-array', DATATYPE.ARRAY);
    this.addInput('x', DATATYPE.NUMBER, 0, false);
    this.addInput('y', DATATYPE.NUMBER, 0, false);
    this.addInput('count', DATATYPE.NUMBER, 9, false, {
      round: true,
      minValue: 0,
    });
    this.addInput('column', DATATYPE.NUMBER, 3, false, {
      round: true,
      minValue: 0,
    });
    this.addInput('distance', DATATYPE.NUMBER, 100.0, false);

    this.name = 'Grid coordinates';
    this.description = 'Create grid coordinates';

    this.onExecute = async function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const count = input['count'];
      const column = input['column'];
      const distance = input['distance'];
      const xArray = [];
      const yArray = [];
      for (let indexCount = 0; indexCount < count; indexCount++) {
        xArray.push(x + distance * (indexCount % column));
        yArray.push(y + distance * Math.floor(indexCount / column));
      }
      output['x-array'] = xArray;
      output['y-array'] = yArray;
    };
  }
}

export class ColorArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const colorA = COLOR[5];
    const colorB = COLOR[15];

    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.INPUT,
    });

    this.addOutput('color-array', DATATYPE.ARRAY);
    this.addInput('count', DATATYPE.NUMBER, 9, false, {
      round: true,
      minValue: 0,
    });
    this.addInput('colorA', DATATYPE.COLOR, hexToTRgba(colorA), false);
    this.addInput('colorB', DATATYPE.COLOR, hexToTRgba(colorB), false);

    this.name = 'Color array';
    this.description = 'Create color array';

    this.onExecute = async function (input, output) {
      const count = input['count'];
      const colorA = trgbaToColor(input['colorA']);
      const colorB = trgbaToColor(input['colorB']);
      const colorArray = [];
      for (let indexCount = 0; indexCount < count; indexCount++) {
        const blendFactor = count <= 1 ? 0 : indexCount / (count - 1);
        colorArray.push(colorToTrgba(colorA.mix(colorB, blendFactor)));
      }
      output['color-array'] = colorArray;
    };
  }
}

export class RangeArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.INPUT,
    });

    this.addOutput('output array', DATATYPE.ARRAY);
    this.addInput('start', DATATYPE.NUMBER);
    this.addInput('stop', DATATYPE.NUMBER);
    this.addInput('step', DATATYPE.NUMBER);

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
}

export class RandomArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.INPUT,
    });

    this.addOutput('output array', DATATYPE.ARRAY);
    this.addInput('trigger', DATATYPE.TRIGGER);
    this.addInput('length', DATATYPE.NUMBER, 20, undefined, {
      round: true,
      minValue: 1,
    });
    this.addInput('min', DATATYPE.NUMBER, 0);
    this.addInput('max', DATATYPE.NUMBER, 1);

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
}
export class Trigger extends PPNode {
  _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.INPUT,
    });

    this.addOutput('trigger', DATATYPE.TRIGGER);

    this.name = 'Trigger';
    this.description = 'Creates a trigger event';

    this.onNodeAdded = () => {
      const button = new PIXI.Graphics();
      this._rectRef = (this as PIXI.Container).addChild(button);
      this._rectRef.beginFill(PIXI.utils.string2hex('#00FF00'));
      this._rectRef.drawRoundedRect(
        NODE_OUTLINE_DISTANCE + SOCKET_WIDTH,
        NODE_OUTLINE_DISTANCE + NODE_PADDING_TOP + NODE_HEADER_HEIGHT,
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
}

export class TimeAndDate extends PPNode {
  date: Date;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.INPUT,
    });

    this.addOutput('date and time', DATATYPE.STRING);
    this.addOutput('time stamp', DATATYPE.NUMBER);

    this.name = 'Time';
    this.description = 'Outputs current time in different formats';
    this.date = new Date();

    this.onExecute = async function () {
      this.setOutputData('date and time', this.date.getUTCDate());
      this.setOutputData('time stamp', Date.now());
    };
  }
}

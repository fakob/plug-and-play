import axios from 'axios';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import {
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

export class RangeArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.TRANSFORM,
    });

    this.addOutput('output array', DATATYPE.ARRAY);
    this.addInput('start', DATATYPE.NUMBER);
    this.addInput('stop', DATATYPE.NUMBER);
    this.addInput('step', DATATYPE.NUMBER);

    this.name = 'Range array';
    this.description = 'Create range array';

    this.onExecute = function (input, output) {
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

export class MakeAPICall extends PPNode {
  // _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.INPUT,
    });

    const url = 'https://jsonplaceholder.typicode.com/users';

    this.addOutput('response', DATATYPE.STRING);
    this.addInput('trigger', DATATYPE.TRIGGER);
    this.addInput('url', DATATYPE.STRING, url);

    this.name = 'Make API call';
    this.description = 'Makes an API call and outputs the response';
  }
  trigger(): void {
    axios
      .get(this.getInputData('url'))
      .then((response) => {
        // handle success
        console.log(response);
        this.setOutputData('response', response.data);
      })
      .catch((error) => {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
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

    this.onExecute = function () {
      this.setOutputData('date and time', this.date.getUTCDate());
      this.setOutputData('time stamp', Date.now());
    };
  }
}

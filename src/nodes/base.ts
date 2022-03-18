/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode, { TriggerNode, UpdateBehaviour } from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import {
  COLOR,
  COMPARISON_OPTIONS,
  CONDITION_OPTIONS,
  NODE_TYPE_COLOR,
  SOCKET_WIDTH,
  NODE_CORNERRADIUS,
  NODE_PADDING_TOP,
  NODE_HEADER_HEIGHT,
  NODE_WIDTH,
  SOCKET_HEIGHT,
  SOCKET_TYPE,
} from '../utils/constants';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { compare, isVariable, getMethods, isInputTrue } from '../utils/utils';
import { NumberType } from './datatypes/numberType';
import { AnyType } from './datatypes/anyType';
import { TriggerType } from './datatypes/triggerType';
import { ColorType } from './datatypes/colorType';
import { StringType } from './datatypes/stringType';
import { EnumType } from './datatypes/enumType';
import { BooleanType } from './datatypes/booleanType';
import { JSONType } from './datatypes/jsonType';

export class Mouse extends PPNode {
  onViewportMove: (event: PIXI.InteractionEvent) => void;
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;
  onViewportZoomed: (event: PIXI.InteractionEvent) => void;
  onViewportZoomedHandler: (event?: PIXI.InteractionEvent) => void;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
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
}

export class Keyboard extends PPNode {
  onKeyDownHandler: (event?: KeyboardEvent) => void = () => {};
  onKeyUpHandler: (event?: KeyboardEvent) => void = () => {};
  _onKeyDown = (event: KeyboardEvent): void => {
    this.setOutputData('key', event.key);
    this.setOutputData('code', event.code);
    this.setOutputData('shiftKey', event.shiftKey);
    this.setOutputData('ctrlKey', event.ctrlKey);
    this.setOutputData('altKey', event.altKey);
    this.setOutputData('metaKey', event.metaKey);
    this.setOutputData('repeat', event.repeat);
    this.executeChildren();
  };
  _onKeyUp = (event: KeyboardEvent): void => {
    if (!this.getInputData('keep last')) {
      this.setOutputData('key', '');
      this.setOutputData('code', '');
      this.setOutputData('shiftKey', false);
      this.setOutputData('ctrlKey', false);
      this.setOutputData('altKey', false);
      this.setOutputData('metaKey', false);
      this.setOutputData('repeat', false);
      this.executeChildren();
    }
  };

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

    this.addOutput('key', new StringType());
    this.addOutput('code', new StringType());
    this.addOutput('shiftKey', new BooleanType());
    this.addOutput('ctrlKey', new BooleanType());
    this.addOutput('altKey', new BooleanType());
    this.addOutput('metaKey', new BooleanType());
    this.addOutput('repeat', new BooleanType());
    this.addInput('keep last', new BooleanType(), false, false);

    this.name = 'Keyboard';
    this.description = 'Get keyboard input';

    // add event listener
    this.onKeyDownHandler = this._onKeyDown.bind(this);
    window.addEventListener('keydown', (this as any).onKeyDownHandler);
    this.onKeyUpHandler = this._onKeyUp.bind(this);
    window.addEventListener('keyup', (this as any).onKeyUpHandler);
  }

  onNodeRemoved = (): void => {
    window.removeEventListener('keydown', this.onKeyDownHandler);
    window.removeEventListener('keyup', this.onKeyUpHandler);
  };
}

export class GridCoordinates extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

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
}

export class ColorArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const colorA: TRgba = TRgba.fromString(COLOR[5]);
    const colorB: TRgba = TRgba.fromString(COLOR[15]);

    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

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
}

export class RangeArray extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

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
}

export class RandomArray extends TriggerNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

    this.addOutput('output array', new AnyType());
    this.addInput('length', new NumberType(true, 1), 20, undefined);
    this.addInput('min', new NumberType(), 0);
    this.addInput('max', new NumberType(), 1);

    this.name = 'Random array';
    this.description = 'Create random array';

    this.onTriggerUpdate = (): void => {
      const length = this.getInputData('length');
      const min = this.getInputData('min');
      const max = this.getInputData('max');
      const randomArray = Array.from({ length: length }, () => {
        return Math.floor(Math.random() * (max - min) + min);
      });
      this.setOutputData('output array', randomArray);
    };
  }
}

export class Trigger extends PPNode {
  _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

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
    this.outputSocketArray[0].links.forEach((link) => {
      // trigger both a normal trigger as well as a node update
      if ((link.target.parent as any).triggerUpdate) {
        (link.target.parent as any).triggerUpdate();
      }
      if ((link.target.parent as any).trigger) {
        (link.target.parent as any).trigger();
      }
    });
    this.executeChildren();
  }

  onButtonOver(): void {
    this._rectRef.cursor = 'hover';
  }
}

export class TriggerOnUpFlank extends PPNode {
  _rectRef: PIXI.Graphics;
  previousValue: any = false;
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

    this.addOutput('Trigger', new TriggerType());
    this.addInput('Input', new AnyType());
    this.addInput('Delay (ms)', new NumberType(true, 0, 10000), 0);

    this.name = 'Trigger on up flank';
    this.description =
      'Creates a trigger event when switching from false to true/0 to 1';

    this.onExecute = async function (input) {
      const newValue = input['Input'];
      if (!isInputTrue(this.previousValue) && isInputTrue(newValue)) {
        const delay = input['Delay (ms)'];
        setTimeout(() => {
          this.trigger();
        }, delay);
      }
      this.previousValue = newValue;
    };
  }

  trigger(): void {
    this.outputSocketArray[0].links.forEach((link) => {
      // trigger both a normal trigger as well as a node update
      if ((link.target.parent as any).triggerUpdate) {
        (link.target.parent as any).triggerUpdate();
      }
      if ((link.target.parent as any).trigger) {
        (link.target.parent as any).trigger();
      }
    });
    this.executeChildren();
  }
}

export class TriggerOnChange extends PPNode {
  _rectRef: PIXI.Graphics;
  previousValue: any = false;
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

    this.addOutput('Trigger', new TriggerType());
    this.addOutput('Output', new AnyType());
    this.addInput('Input', new AnyType());

    this.name = 'Trigger on change';
    this.description = 'Creates a trigger event when changing the input value';

    this.onExecute = async function (input, output) {
      const newValue = input['Input'];
      if (this.previousValue !== newValue) {
        output['Output'] = newValue;
        this.trigger();
        this.previousValue = newValue;
      }
    };
  }

  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, false, 1000);
  }

  trigger(): void {
    this.outputSocketArray[0].links.forEach((link) => {
      // trigger both a normal trigger as well as a node update
      if ((link.target.parent as any).triggerUpdate) {
        (link.target.parent as any).triggerUpdate();
      }
      if ((link.target.parent as any).trigger) {
        (link.target.parent as any).trigger();
      }
    });
    this.executeChildren();
  }
}

export class PassThrough extends TriggerNode {
  _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

    this.addOutput('Output', new AnyType());
    this.addInput('Input', new AnyType());

    this.name = 'Pass through';
    this.description = 'Passes the input to the output on trigger';

    this.onTriggerUpdate = () => {
      this.setOutputData('Output', this.getInputData('Input'));
      this.executeChildren();
    };
  }
}

export class Delay extends PPNode {
  _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

    this.addOutput('Output', new AnyType());
    this.addInput('Input', new AnyType());
    this.addInput('Delay (ms)', new NumberType(true, 0, 10000), 100);

    this.name = 'Delay';
    this.description = 'Delay the input (setTimeout)';

    this.onExecute = async function (input, output) {
      const newValue = input['Input'];
      const delay = input['Delay (ms)'];
      setTimeout(() => {
        output['Output'] = newValue;
        this.executeChildren();
      }, delay);
    };
  }
}

export class DateAndTime extends TriggerNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
    });

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

    this.onExecute = async function (input, output) {
      const dateMethod = input['Date method'];
      output['date and time'] = new Date()[dateMethod]();
    };
  }
}

export class If_Else extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = 'If else condition';
    this.description = 'Passes through input A or B based on a condition';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'Condition', new AnyType(), 0),
      new Socket(SOCKET_TYPE.IN, 'A', new AnyType(), 'A'),
      new Socket(SOCKET_TYPE.IN, 'B', new AnyType(), 'B'),
      new Socket(SOCKET_TYPE.OUT, 'Output', new AnyType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const condition = isInputTrue(inputObject['Condition']);
    if (condition) {
      outputObject['Output'] = inputObject?.['A'];
    } else {
      outputObject['Output'] = inputObject?.['B'];
    }
  }
}

export class Comparison extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = 'Compare';
    this.description = 'Compares two values (greater, less, equal, logical)';
  }

  protected getDefaultIO(): Socket[] {
    const onOptionChange = (value) => {
      this.nodeName = value;
    };

    return [
      new Socket(SOCKET_TYPE.IN, 'A', new AnyType(), 0),
      new Socket(SOCKET_TYPE.IN, 'B', new AnyType(), 1),
      new Socket(
        SOCKET_TYPE.IN,
        'Operator',
        new EnumType(COMPARISON_OPTIONS, onOptionChange),
        COMPARISON_OPTIONS[0].text,
        false
      ),
      new Socket(SOCKET_TYPE.OUT, 'Output', new BooleanType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputA = inputObject['A'];
    const inputB = inputObject['B'];
    const operator = inputObject['Operator'];
    outputObject['Output'] = compare(inputA, operator, inputB);
  }
}

export class Check extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
    });

    this.name = 'Check';
    this.description = 'Check if an input is undefined, null, etc';
  }

  protected getDefaultIO(): Socket[] {
    const onOptionChange = (value) => {
      this.nodeName = value;
    };

    return [
      new Socket(SOCKET_TYPE.IN, 'A', new AnyType(), 0),
      new Socket(
        SOCKET_TYPE.IN,
        'Condition',
        new EnumType(CONDITION_OPTIONS, onOptionChange),
        CONDITION_OPTIONS[0].text,
        false
      ),
      new Socket(SOCKET_TYPE.OUT, 'Output', new BooleanType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputA = inputObject['A'];
    const condition = inputObject['Condition'];
    outputObject['Output'] = isVariable(inputA, condition);
  }
}

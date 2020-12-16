import axios from 'axios';
import PPGraph from '../GraphClass';
import PPNode from '../NodeClass';
import { rgbToHex } from '../utils-pixi';

export class RangeArray extends PPNode {
  constructor(name: string, graph: PPGraph) {
    super(name, graph);

    this.addInput('start', 'number');
    this.addInput('stop', 'number');
    this.addInput('step', 'number');
    this.addOutput('output array', 'array');

    this.title = 'Range array';
    this.type = 'RangeArray';
    this.description = 'Create range array';

    this.onExecute = function () {
      const start = this.getInputData(0) || 0;
      const stop = this.getInputData(1) || 100;
      const step = this.getInputData(2) || 2;
      const output = Array.from(
        { length: (stop - start) / step + 1 },
        (_, i) => start + i * step
      );
      this.setOutputData(0, output);
    };
  }
}

export class MakeAPICall extends PPNode {
  _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph) {
    super(name, graph);

    const url = 'https://jsonplaceholder.typicode.com/users';

    this.addInput('url', 'string', url);
    this.addOutput('response', 'string');

    this.title = 'Make API call';
    this.type = 'MakeAPICall';
    this.description = 'Makes an API call and outputs the response';

    const button = new PIXI.Graphics();
    this._rectRef = (this as PIXI.Container).addChild(button);
    this._rectRef.beginFill(PIXI.utils.string2hex('#00FF00'), 0.5);
    this._rectRef.drawRect(0, 0, 100, 100);
    this._rectRef.endFill();
    button.cursor = 'hover';

    // make the button interactive...
    button.interactive = true;

    button
      // Mouse & touch events are normalized into
      // the pointer* events for handling different
      // button events.
      .on('pointerdown', this.executeOnce.bind(this));
    // .on('pointerup', onButtonUp)
    // .on('pointerupoutside', onButtonUp)
    // .on('pointerover', onButtonOver)
    // .on('pointerout', onButtonOut);

    this.onExecute = function () {
      // const start = this.getInputData(0) || url;
      // this.setOutputData(0, output);
    };
  }
  executeOnce(): void {
    axios
      .get(this.getInputData(0))
      .then((response) => {
        // handle success
        console.log(response);
        this.setOutputData(0, response.data);
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

export class DrawRect extends PPNode {
  _x: number;
  _y: number;
  _width: number;
  _height: number;
  _color: number;
  _rectRef: PIXI.Graphics;

  constructor(
    name: string,
    graph: PPGraph,
    x: number,
    y: number,
    width: number,
    height: number,
    color?: number[]
  ) {
    super(name, graph);

    this.addInput('x', 'number');
    this.addInput('y', 'number');
    this.addInput('width', 'number');
    this.addInput('height', 'number');
    this.addInput('color', 'color');
    // this.addOutput('time stamp', 'number');

    this.title = 'Draw Rect';
    this.type = 'DrawRect';
    this.description = 'Draws a rectangle';

    const rect = new PIXI.Graphics();
    this._rectRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container).addChild(rect);
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    let convertedColor;
    if (color === undefined) {
      convertedColor = PIXI.utils.string2hex('#00FF00');
    } else {
      convertedColor = PIXI.utils.string2hex(rgbToHex(color));
    }
    this._rectRef.beginFill(convertedColor, 0.5);
    this._rectRef.drawRect(this._x, this._y, this._width, this._height);
    this._rectRef.endFill();

    this.onExecute = function () {
      const x = this.getInputData(0) || 0;
      const y = this.getInputData(1) || 0;
      const width = this.getInputData(2) || 100;
      const height = this.getInputData(3) || 100;
      const color = (this.getInputData(4) as number[]) || [255, 0, 0, 0.5];
      this._rectRef.clear();
      let xArray: number[] = [];
      if (Array.isArray(x)) {
        xArray = x;
      } else {
        xArray.push(x);
      }
      this._rectRef.beginFill(PIXI.utils.string2hex(rgbToHex(color)), color[3]);
      xArray.forEach((xValue: number) => {
        this._rectRef.drawRect(
          this.x + this.width + xValue,
          this.y + y,
          width,
          height
        );
        this._rectRef.moveTo(xValue + 2);
      });
      this._rectRef.endFill();
      // this.setOutputData(1, Date.now());
    };
  }
}

export class TimeAndDate extends PPNode {
  date: Date;

  constructor(name: string, graph: PPGraph) {
    super(name, graph);

    // this.addInput('in', 'number');
    this.addOutput('date and time', 'string');
    this.addOutput('time stamp', 'number');

    this.title = 'Time';
    this.type = 'BaseTime';
    this.description = 'Outputs current time in different formats';
    this.date = new Date();

    this.onExecute = function () {
      // const a = this.getInputData(0) || 0;
      this.setOutputData(0, this.date.getUTCDate());
      // this.setOutputData(1, this.date.getTime());
      this.setOutputData(1, Date.now());
      console.log(this.result);
    };
  }
}

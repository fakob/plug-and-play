import axios from 'axios';
import PPGraph from '../GraphClass';
import PPNode from '../NodeClass';
import { rgbToHex } from '../utils-pixi';
import { convertToArray, getElement } from '../utils';
import { INPUTTYPE, OUTPUTTYPE } from '../constants';

export class RangeArray extends PPNode {
  constructor(name: string, graph: PPGraph, customId: string) {
    super(name, graph, customId);

    this.addInput('start', INPUTTYPE.NUMBER);
    this.addInput('stop', INPUTTYPE.NUMBER);
    this.addInput('step', INPUTTYPE.NUMBER);
    this.addOutput('output array', OUTPUTTYPE.ARRAY);

    this.name = 'Range array';
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
  // _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph, customId: string) {
    super(name, graph, customId);

    const url = 'https://jsonplaceholder.typicode.com/users';

    this.addInput('trigger', INPUTTYPE.STRING);
    this.addInput('url', INPUTTYPE.STRING, url);
    this.addOutput('response', OUTPUTTYPE.STRING);

    this.name = 'Make API call';
    this.description = 'Makes an API call and outputs the response';

    // this.onExecute = function () {
    //   const start = this.getInputData(0) || url;
    //   this.setOutputData(0, output);
    // };
  }
  trigger(): void {
    axios
      .get(this.getInputData(1))
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
export class Trigger extends PPNode {
  _rectRef: PIXI.Graphics;
  constructor(name: string, graph: PPGraph, customId: string) {
    super(name, graph, customId);

    this.addOutput('trigger', OUTPUTTYPE.STRING);

    this.name = 'Trigger';
    this.description = 'Creates a trigger event';

    const button = new PIXI.Graphics();
    this._rectRef = (this as PIXI.Container).addChild(button);
    this._rectRef.beginFill(PIXI.utils.string2hex('#00FF00'), 0.5);
    this._rectRef.drawRect(0, 0, 100, 100);
    this._rectRef.endFill();

    this._rectRef.buttonMode = true;
    this._rectRef.interactive = true;

    this._rectRef.on('pointerdown', this.trigger.bind(this));

    this.onExecute = function () {
      // const start = this.getInputData(0) || url;
      // this.setOutputData(0, output);
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

  constructor(name: string, graph: PPGraph, customId: string) {
    super(name, graph, customId);

    this.addOutput('date and time', OUTPUTTYPE.STRING);
    this.addOutput('time stamp', OUTPUTTYPE.NUMBER);

    this.name = 'Time';
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

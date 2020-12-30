import PPGraph from '../GraphClass';
import PPNode from '../NodeClass';
import { INPUTTYPE, OUTPUTTYPE } from '../constants';

export class MathAdd extends PPNode {
  min: number;
  max: number;
  smooth: boolean;
  seed: number;
  octaves: number;
  persistence: number;
  speed: number;
  data2: Float32Array;

  constructor(name: string, graph: PPGraph) {
    super(name, graph);

    this.addInput('in', INPUTTYPE.NUMBER, 0);
    this.addInput('in2', INPUTTYPE.NUMBER, 0);
    this.addOutput('out', OUTPUTTYPE.NUMBER);

    this.name = 'Add';
    this.type = 'MathAdd';
    this.description = 'Add 2 numbers';
    this.data2 = null;

    this.onExecute = function () {
      const a = this.getInputData(0);
      const b = this.getInputData(1);
      const result = a + b;
      this.setOutputData(0, result);
      console.log(this.result);
    };
  }
}

export class MathNoise extends PPNode {
  min: number;
  max: number;
  smooth: boolean;
  seed: number;
  octaves: number;
  persistence: number;
  speed: number;
  data2: Float32Array;

  constructor(name: string, graph: PPGraph) {
    super(name, graph);

    this.addInput('in', INPUTTYPE.NUMBER);
    this.addOutput('out', OUTPUTTYPE.NUMBER);
    this.min = 0;
    this.max = 1;
    this.smooth = true;
    this.seed = 0;
    this.octaves = 1;
    this.persistence = 0.8;
    this.speed = 1;

    this.name = 'Noise';
    this.type = 'MathNoise';
    this.description = 'Random number with temporal continuity';
    this.data2 = null;

    const getValue = (f: number, smooth: boolean) => {
      if (!this.data2) {
        this.data2 = new Float32Array(1024);
        for (let i = 0; i < this.data2.length; ++i) {
          this.data2[i] = Math.random();
        }
      }
      f = f % 1024;
      if (f < 0) {
        f += 1024;
      }
      const f_min = Math.floor(f);
      f = f - f_min;
      const r1 = this.data2[f_min];
      const r2 = this.data2[f_min == 1023 ? 0 : f_min + 1];
      if (smooth) {
        f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      }
      return r1 * (1 - f) + r2 * f;
    };

    this.onExecute = function () {
      let f = this.getInputData(0) || 0;
      // let f = 0;
      const iterations = this.octaves || 1;
      let r = 0;
      let amp = 1;
      const seed = this.seed || 0;
      f += seed;
      const speed = this.speed || 1;
      let total_amp = 0;
      for (let i = 0; i < iterations; ++i) {
        r += getValue(f * (1 + i) * speed, this.smooth) * amp;
        total_amp += amp;
        amp *= this.persistence;
        if (amp < 0.001) break;
      }
      r /= total_amp;
      const min = this.min;
      const max = this.max;
      this._last_v = r * (max - min) + min;
      this.setOutputData(0, this._last_v);
      console.log(this._last_v);
    };
  }
}

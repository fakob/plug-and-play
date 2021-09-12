import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { NODE_TYPE_COLOR } from '../utils/constants';
import { CustomArgs } from '../utils/interfaces';
import { NumberType } from './datatypes/numberType';

export class MathAdd extends PPNode {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.TRANSFORM,
    });

    this.addOutput('out', new NumberType());
    this.addInput('in', new NumberType(), 0);
    this.addInput('in2', new NumberType(), 0);

    this.name = 'Add';
    this.description = 'Add 2 numbers';

    this.onExecute = async function (input, output) {
      const a = input['in'];
      const b = input['in2'];
      const result = a + b;
      output['out'] = result;
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

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.TRANSFORM,
    });

    this.addOutput('out', new NumberType());
    this.addInput('in', new NumberType());
    this.min = 0;
    this.max = 1;
    this.smooth = true;
    this.seed = 0;
    this.octaves = 1;
    this.persistence = 0.8;
    this.speed = 1;

    this.name = 'Noise';
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

    this.onExecute = async function (input, output) {
      let f = input['in'] || 0;
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
      output['out'] = this._last_v;
      console.log(this._last_v);
    };
  }
}

// add additional nodes from functions
export function multiply(a: number, b: number): number {
  return a * b;
}

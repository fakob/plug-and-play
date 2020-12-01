import PPGraph from '../GraphClass';
import PPNode from '../NodeClass';

export default class MathNoise extends PPNode {
  min: number;
  max: number;
  smooth: boolean;
  seed: number;
  octaves: number;
  persistence: number;
  speed: number;

  constructor(name: string, graph: PPGraph) {
    super(name, graph);

    this.addInput('in', 'number');
    this.addOutput('out', 'number');
    this.min = 0;
    this.max = 1;
    this.smooth = true;
    this.seed = 0;
    this.octaves = 1;
    this.persistence = 0.8;
    this.speed = 1;

    this.title = 'Noise';
    this.type = 'MathNoise';
    this.description = 'Random number with temporal continuity';
    this.data = null;

    const getValue = function (f: number, smooth: boolean) {
      if (!this.data) {
        this.data = new Float32Array(1024);
        for (let i = 0; i < this.data.length; ++i) {
          this.data[i] = Math.random();
        }
      }
      f = f % 1024;
      if (f < 0) {
        f += 1024;
      }
      const f_min = Math.floor(f);
      f = f - f_min;
      const r1 = this.data[f_min];
      const r2 = this.data[f_min == 1023 ? 0 : f_min + 1];
      if (smooth) {
        f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      }
      return r1 * (1 - f) + r2 * f;
    };

    this.onExecute = function () {
      // let f = this.getInputData(0) || 0;
      let f = 0;
      const iterations = this.properties.octaves || 1;
      let r = 0;
      let amp = 1;
      const seed = this.properties.seed || 0;
      f += seed;
      const speed = this.properties.speed || 1;
      let total_amp = 0;
      for (let i = 0; i < iterations; ++i) {
        r += getValue(f * (1 + i) * speed, this.properties.smooth) * amp;
        total_amp += amp;
        amp *= this.properties.persistence;
        if (amp < 0.001) break;
      }
      r /= total_amp;
      const min = this.properties.min;
      const max = this.properties.max;
      this._last_v = r * (max - min) + min;
      this.setOutputData(0, this._last_v);
    };
  }
}

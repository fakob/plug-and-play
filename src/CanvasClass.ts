import * as PIXI from 'pixi.js';
import PPGraph from './GraphClass';

export default class PPCanvas {
  constructor(canvas: PIXI.Application, graph: PPGraph) {
    //link canvas and graph
    if (graph) {
      // graph.attachCanvas(this);
    }

    this.setCanvas(canvas);
  }

  setCanvas(app: PIXI.Application): void {}
}

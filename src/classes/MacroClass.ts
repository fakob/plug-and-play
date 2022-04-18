
import * as PIXI from 'pixi.js';
import PPGraph from './GraphClass';
export default class PPMacro extends PIXI.Container {
    id: number;
    nodes: string[];
    graph: PPGraph;

    constructor(id: number, nodes: string[], graph: PPGraph) {
        super();
        this.id = id;
        this.graph = graph;

    }

}
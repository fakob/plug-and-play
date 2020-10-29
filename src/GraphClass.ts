import PPCanvas from './CanvasClass';
// import PPLink from './LinkClass';
import PPNode from './NodeClass';

export default class PPGraph {
  list_of_graphcanvas: PPCanvas[];

  last_node_id: number;

  last_link_id: number;

  _nodes: PPNode[];
  // links: PPLink;

  constructor() {
    console.log('Graph created');
    this.list_of_graphcanvas = null;
    this.clear();
  }

  clear(): void {
    this.last_node_id = 0;
    this.last_link_id = 0;

    //nodes
    this._nodes = [];

    //links
    this.links = {}; //container with all the links
  }

  attachCanvas(graphcanvas: PPCanvas): void {
    // if (graphcanvas.constructor != LGraphCanvas) {
    //   throw 'attachCanvas expects a LGraphCanvas instance';
    // }
    if (graphcanvas.graph && graphcanvas.graph != this) {
      graphcanvas.graph.detachCanvas(graphcanvas);
    }

    graphcanvas.graph = this;

    if (!this.list_of_graphcanvas) {
      this.list_of_graphcanvas = [];
    }
    this.list_of_graphcanvas.push(graphcanvas);
  }

  detachCanvas(graphcanvas: PPCanvas): void {
    if (!this.list_of_graphcanvas) {
      return;
    }

    const pos = this.list_of_graphcanvas.indexOf(graphcanvas);
    if (pos == -1) {
      return;
    }
    graphcanvas.graph = null;
    this.list_of_graphcanvas.splice(pos, 1);
  }
}

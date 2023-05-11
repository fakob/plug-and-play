import { Segment } from './segment';
import { SegmentNode } from './segmentNode';
import * as graph from './simpleBarGraph.json';

export class SimpleBarGraphSegmentNode extends SegmentNode {
  protected getSegment(): Segment {
    return new SimpleBarGraph();
  }
}

class SimpleBarGraph extends Segment {
  getName(): string {
    return 'Simple Bar Graph';
  }

  getDescription(): string {
    return 'Shows a simple bar graph segment';
  }

  getData(): string {
    return JSON.stringify(graph.default);
  }
}

import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import { TNodeSource } from '../../utils/interfaces';
import { getNodeDataFromText } from '../../utils/utils';
import { Segment } from './segment';

export abstract class SegmentNode extends PPNode {
  getName() {
    return this.getSegment().getName();
  }

  getDescription() {
    return this.getSegment().getDescription();
  }

  getTags(): string[] {
    return ['Segment'];
  }

  protected getSegment(): Segment {
    return undefined;
  }

  // paste my segment and remove self
  public async addAndDestroy() {
    await PPGraph.currentGraph.action_pasteNodes(
      getNodeDataFromText(this.getSegment().getData()),
      { x: this.x, y: this.y },
    );

    PPGraph.currentGraph.removeNode(this);
  }

  public async onNodeAdded(source: TNodeSource) {
    await super.onNodeAdded(source);
    this.addAndDestroy();
  }
}

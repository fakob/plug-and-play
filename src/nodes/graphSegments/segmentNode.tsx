import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import { getNodeDataFromText } from '../../utils/utils';
import { Segment } from './segment';

export abstract class SegmentNode extends PPNode {
  protected getSegment(): Segment {
    return undefined;
  }
  getName() {
    return this.getSegment().getName();
  }
  getDescription() {
    return this.getSegment().getDescription();
  }
  public onNodeAdded() {
    PPGraph.currentGraph.pasteNodes(
      getNodeDataFromText(this.getSegment().getData())
    );
    // paste my segment and remove self
    this.destroy();
  }
}

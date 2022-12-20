import FlowLogic from '../../classes/FlowLogic';
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

  // paste my segment and remove self
  public async addAndDestroy() {
    const addedNodes = await PPGraph.currentGraph.pasteNodes(
      getNodeDataFromText(this.getSegment().getData()),
      { x: this.x, y: this.y }
    );
    await FlowLogic.executeOptimizedChainBatch(
      addedNodes.filter((node) => !node.getHasDependencies())
    );
    PPGraph.currentGraph.removeNode(this);
  }

  public onNodeAdded() {
    this.addAndDestroy();
  }
}

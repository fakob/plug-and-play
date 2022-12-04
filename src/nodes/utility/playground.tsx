import * as PIXI from 'pixi.js';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import PPSocket from '../../classes/SocketClass';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import { sortCompare } from '../../utils/utils';
import { getNodesBounds } from '../../pixi/utils-pixi';
import { TRgba } from '../../utils/interfaces';
import { JSONType } from '../datatypes/jsonType';
import { TriggerType } from './../datatypes/triggerType';
import { getAllNodeTypes } from '../../nodes/allNodes';

export class Playground extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.SYSTEM);
  }

  public getName(): string {
    return 'Playground';
  }

  public getDescription(): string {
    return 'Playground functions';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'output', new JSONType()),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Add all nodes',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].value, 'addAllNodes'),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Arrange selected nodes by type',
        new TriggerType(
          TRIGGER_TYPE_OPTIONS[0].value,
          'arrangeSelectedNodesByType'
        ),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Show graph JSON',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].value, 'showGraphJSON'),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Get all added nodes',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].value, 'getAllAddedNodes'),
        0
      ),
    ].concat(super.getDefaultIO());
  }

  addAllNodes(): void {
    const allNodeTypes = getAllNodeTypes();
    const allNodeTypeNames = Object.keys(allNodeTypes);
    console.log(allNodeTypeNames);
    let lastNodePosX = this.x + this.width + 40;
    const lastNodePosY = this.y;
    const addedNodes: PPNode[] = [];
    allNodeTypeNames.forEach((nodeName) => {
      console.log(this.x, lastNodePosX);
      const newNode = PPGraph.currentGraph.addNewNode(nodeName);
      newNode.setPosition(lastNodePosX, lastNodePosY, false);
      lastNodePosX += newNode.width + 40;
      addedNodes.push(newNode);
    });
    PPGraph.currentGraph.selection.selectedNodes = addedNodes;
    this.arrangeSelectedNodesByType();
    this.setOutputData('output', allNodeTypes);
    this.executeChildren();
  }

  arrangeSelectedNodesByType(): void {
    const selectedNodes = PPGraph.currentGraph.selection.selectedNodes;
    selectedNodes.sort((a, b) =>
      sortCompare(a.getColor().hex(), b.getColor().hex(), true)
    );
    console.log(selectedNodes);
    if (selectedNodes.length > 0) {
      const boundsOfSelection = getNodesBounds(selectedNodes);
      const origNodePosX = boundsOfSelection.x;
      let lastNodePosX = origNodePosX;
      let lastNodePosY = boundsOfSelection.y;
      const nodesFromLastRow: PPNode[] = [];
      selectedNodes.forEach((node, index) => {
        if (index % 10 === 0 && index !== 0) {
          console.log(index);
          lastNodePosX = origNodePosX;
          const boundsOfSelection = getNodesBounds(nodesFromLastRow);
          lastNodePosY = boundsOfSelection.y + boundsOfSelection.height + 40;
          nodesFromLastRow.length = 0;
        }
        node.setPosition(lastNodePosX, lastNodePosY, false);
        lastNodePosX += node.width + 40;
        nodesFromLastRow.push(node);
      });
    }
  }

  showGraphJSON(): void {
    const serializedGraph = PPGraph.currentGraph.serialize();
    // const max = this.getInputData('max');
    this.setOutputData('output', serializedGraph);
    this.executeChildren();
  }

  getAllAddedNodes(): void {
    const serializedGraph = PPGraph.currentGraph.serialize();
    // const max = this.getInputData('max');
    this.setOutputData('output', serializedGraph.nodes);
    this.executeChildren();
  }
}

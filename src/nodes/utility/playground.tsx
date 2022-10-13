import * as PIXI from 'pixi.js';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import PPSocket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, TRIGGER_TYPE_OPTIONS } from '../../utils/constants';
import { SOCKET_TYPE } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { JSONType } from '../datatypes/jsonType';
import { TriggerType } from './../datatypes/triggerType';
import { getAllNodeTypes } from '../../nodes/allNodes';

export class Playground extends PPNode {
  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
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
    allNodeTypeNames.forEach((nodeName) => {
      console.log(this.x, lastNodePosX);
      const newNode = PPGraph.currentGraph.addNewNode(nodeName);
      newNode.setPosition(lastNodePosX, lastNodePosY, false);
      // lastNodePosX += 40;
      lastNodePosX += newNode.width + 40;
    });
    this.setOutputData('output', allNodeTypes);
    this.executeChildren();
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

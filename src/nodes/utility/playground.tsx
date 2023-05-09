import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import PPSocket from '../../classes/SocketClass';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import { sortCompare } from '../../utils/utils';
import { getNodesBounds, zoomToFitNodes } from '../../pixi/utils-pixi';
import { TRgba } from '../../utils/interfaces';
import { JSONType } from '../datatypes/jsonType';
import { TriggerType } from './../datatypes/triggerType';
import { getAllNodeTypes, getAllNodesInDetail } from '../../nodes/allNodes';
import { EnumType } from '../datatypes/enumType';

export class Playground extends PPNode {
  public getName(): string {
    return 'Playground';
  }

  public getDescription(): string {
    return 'Exposes some Playground functions';
  }

  public getTags(): string[] {
    return ['Playground'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.SYSTEM);
  }

  protected getDefaultIO(): PPSocket[] {
    const STRIP_COMMENTS =
      /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/gm;
    const ARGUMENT_NAMES = /([^\s,]+)/g;
    function getParamNames(func) {
      let result;
      if (typeof func === 'function') {
        const fnStr = func.toString().replace(STRIP_COMMENTS, '');
        result = fnStr
          .slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'))
          .match(ARGUMENT_NAMES);
      }
      if (result === null) result = [];
      return result;
    }
    const graphMethods = Object.getOwnPropertyNames(PPGraph.currentGraph);
    const prototype = Object.getPrototypeOf(PPGraph.currentGraph);
    const inheritedMethods = Object.getOwnPropertyNames(prototype);
    const graphOptions = graphMethods
      .concat(inheritedMethods)
      .filter((methodName: string) => {
        return getParamNames(PPGraph.currentGraph[methodName])?.length === 0;
      })
      .map((methodName) => {
        return {
          text: methodName,
        };
      });

    const nodeMethods = Object.getOwnPropertyNames(this);
    const nodePrototype = Object.getPrototypeOf(this);
    const inheritedNodeMethods = Object.getOwnPropertyNames(nodePrototype);
    const nodeOptions = nodeMethods
      .concat(inheritedNodeMethods)
      // .filter((methodName: string) => {
      //   return getParamNames(this[methodName])?.length === 0;
      // })
      .map((methodName) => {
        return {
          text: methodName,
        };
      });

    return [
      new PPSocket(SOCKET_TYPE.OUT, 'output', new JSONType()),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Add all nodes',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'addAllNodes'),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'List all nodes',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'listAllNodes'),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Output graph JSON',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'outputGraphJSON'),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Output all added nodes',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'outputAllAddedNodes'),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Zoom to fit selected nodes',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'zoomToFitNodes'),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Trigger graph method',
        new EnumType(graphOptions, () => {
          const methodName = this.getInputData('Trigger graph method');
          this.setOutputData('output', PPGraph.currentGraph[methodName]());
        }),
        0
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Trigger node method',
        new EnumType(nodeOptions, () => {
          const methodName = this.getInputData('Trigger node method');
          this.setOutputData(
            'output',
            PPGraph.currentGraph.selection.selectedNodes?.[0]?.[methodName]()
          );
        }),
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

  listAllNodes(): void {
    const newArray = getAllNodesInDetail();
    this.setOutputData('output', newArray);
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

  outputGraphJSON(): void {
    const serializedGraph = PPGraph.currentGraph.serialize();
    // const max = this.getInputData('max');
    this.setOutputData('output', serializedGraph);
    this.executeChildren();
  }

  outputAllAddedNodes(): void {
    const serializedGraph = PPGraph.currentGraph.serialize();
    // const max = this.getInputData('max');
    this.setOutputData('output', serializedGraph.nodes);
    this.executeChildren();
    console.log(PPGraph.currentGraph);
  }

  zoomToFitNodes(): void {
    const selectedNodes = PPGraph.currentGraph.selection.selectedNodes;
    zoomToFitNodes(selectedNodes);
    this.executeChildren();
  }
}

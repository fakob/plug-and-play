import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';

export default class TestController {
  identify(): string {
    return 'its testcontroller';
  }

  addNode(nodeName): boolean {
    PPGraph.currentGraph.addNewNode(nodeName);
    return true;
  }

  getNodeByType(nodeType: string): PPNode {
    const nodes = Object.values(PPGraph.currentGraph.nodes);
    return nodes.find((node) => node.type == nodeType);
  }
  getNodeCenterByType(nodeType: string): [number, number] {
    const toReturn = this.getNodeByType(nodeType);
    return [toReturn.x + toReturn.width / 2, toReturn.y + toReturn.height / 2];
  }

  getSocketCenterByNodeTypeAndSocketName(nodeType: string, socketName: string) {
    const node = this.getNodeByType(nodeType);
    const socket = node
      .getAllSockets()
      .find((socket) => socket.name == socketName);
    return [
      node.x + socket.x + socket._SocketRef.x + socket._SocketRef.width / 2,
      node.y + socket.y + socket._SocketRef.y + socket._SocketRef.height / 2,
    ];
  }
}

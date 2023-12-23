import PPGraph from './classes/GraphClass';
import PPLink from './classes/LinkClass';
import PPNode from './classes/NodeClass';
import { hri } from 'human-readable-ids';

export default class TestController {
  identify(): string {
    return 'its testcontroller';
  }

  addNode(nodeType: string, id = hri.random()): boolean {
    PPGraph.currentGraph.addNewNode(nodeType, { overrideId: id });
    return true;
  }

  getNodeByID(id: string): PPNode {
    return Object.values(PPGraph.currentGraph.nodes).find(node => node.id == id);
  }

  getNodeCenter(node: PPNode): [number, number] {
    return [node.x + node.width / 2, node.y + node.height / 2];
  }

  getNodeByType(nodeType: string): PPNode {
    const nodes = Object.values(PPGraph.currentGraph.nodes);
    return nodes.find((node) => node.type == nodeType);
  }


  getNodeCenterByType(nodeType: string): [number, number] {
    const toReturn = this.getNodeByType(nodeType);
    return this.getNodeCenter(toReturn);
  }

  moveNodeByID(id: string, x: number, y: number): void {
    const node = this.getNodeByID(id);
    node.x += x;
    node.y += y;
  }

  connectNodesByID(
    node1ID: string,
    node2ID: string,
    node1Socket: string,
  ) {
    const n1 = this.getNodeByID(node1ID);
    const n2 = this.getNodeByID(node2ID);
    const originSocket = n1.getOutputSocketByName(node1Socket);
    PPGraph.currentGraph.connect(
      originSocket,
      n2.getSocketForNewConnection(originSocket),
    );
  }

  getInputSocketLinkNamesForType(nodeType: string, socketName: string) {
    const n = this.getNodeByType(nodeType);
    return n
      .getSocketByName(socketName)
      .links.map((link: PPLink) => link.getSource().name);
  }

  setNodeInputValue(id: string, inputSocketName: string, value: any): void {
    this.getNodeByID(id).getInputSocketByName(inputSocketName).data = value;
  }
  getNodeOutputValue(id: string, outputSocketName: string): any {
    return this.getNodeByID(id).getOutputData(outputSocketName);
  }

  executeNodeByID(id: string) {
    this.getNodeByID(id).executeOptimizedChain();
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

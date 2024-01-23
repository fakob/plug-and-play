import PPGraph from './classes/GraphClass';
import PPLink from './classes/LinkClass';
import PPNode from './classes/NodeClass';
import { hri } from 'human-readable-ids';
import Socket from './classes/SocketClass';
import { getAllNodeTypes } from './nodes/allNodes';
import { ActionHandler } from './utils/actionHandler';

export default class TestController {
  identify(): string {
    return 'its testcontroller';
  }

  addNode(nodeType: string, id = hri.random()): boolean {
    PPGraph.currentGraph.addNewNode(nodeType, { overrideId: id });
    return true;
  }

  getNodeByID(id: string): PPNode {
    return Object.values(PPGraph.currentGraph.nodes).find(
      (node) => node.id == id,
    );
  }

  getNodeCenter(node: PPNode): [number, number] {
    return [node.x + node.width / 2, node.y + node.height / 2];
  }

  getNodeCenterById(nodeType: string): [number, number] {
    const toReturn = this.getNodeByID(nodeType);
    return this.getNodeCenter(toReturn);
  }

  moveNodeByID(id: string, x: number, y: number): void {
    const node = this.getNodeByID(id);
    node.x += x;
    node.y += y;
  }

  connectNodesByID(node1ID: string, node2ID: string, node1Socket: string) {
    const n1 = this.getNodeByID(node1ID);
    const n2 = this.getNodeByID(node2ID);
    const originSocket = n1.getOutputSocketByName(node1Socket);
    PPGraph.currentGraph.connect(
      originSocket,
      n2.getSocketForNewConnection(originSocket),
    );
  }

  async disconnectLink(
    endNodeID: string,
    inputSocketName: string,
  ): Promise<void> {
    await PPGraph.currentGraph.linkDisconnect(endNodeID, inputSocketName, true);
  }
  getSocketLinks(nodeID: string, socketName: string): PPLink[] {
    return this.getNodeByID(nodeID).getSocketByName(socketName).links;
  }

  getInputSocketType(nodeID: string, socketName: string) {
    return this.getNodeByID(nodeID)
      .getInputSocketByName(socketName)
      .dataType.getName();
  }
  getOutputSocketType(nodeID: string, socketName: string) {
    return this.getNodeByID(nodeID)
      .getOutputSocketByName(socketName)
      .dataType.getName();
  }

  getInputSocketLinkNamesForID(nodeType: string, socketName: string) {
    const n = this.getNodeByID(nodeType);
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
  getOutputSockets(id: string) {
    return this.getNodeByID(id).outputSocketArray;
  }
  getInputSocketByIDandName(id: string, socketName: string): Socket {
    return this.getNodeByID(id).getInputSocketByName(socketName);
  }
  getTriggerSocketByIDandName(id: string, socketName: string): Socket {
    return this.getNodeByID(id).getNodeTriggerSocketByName(socketName);
  }
  getOutputSocketByIDandName(id: string, socketName: string): Socket {
    return this.getNodeByID(id).getOutputSocketByName(socketName);
  }

  executeNodeByID(id: string) {
    this.getNodeByID(id).executeOptimizedChain();
  }

  getSocketCenterByNodeIDAndSocketName(nodeID: string, socketName: string) {
    const node = this.getNodeByID(nodeID);
    const socket = node
      .getAllSockets()
      .find((socket) => socket.name == socketName);
    return [
      node.x + socket.x + socket._SocketRef.x + socket._SocketRef.width / 2,
      node.y + socket.y + socket._SocketRef.y + socket._SocketRef.height / 2,
    ];
  }

  getNodes(): PPNode[] {
    return Object.values(PPGraph.currentGraph.nodes);
  }

  getAllDefinedNodeTypes(): string[] {
    return Object.keys(getAllNodeTypes());
  }

  getGraph(): PPGraph {
    return PPGraph.currentGraph;
  }

  removeNode(nodeID: string): void {
    PPGraph.currentGraph.removeNode(PPGraph.currentGraph.nodes[nodeID]);
  }

  selectNodesById(nodeIDs: string[]): PPNode[] {
    const nodes = nodeIDs.map((id) => this.getNodeByID(id));
    this.getGraph().selection.selectNodes(nodes, false, true);
    return nodes;
  }

  doesNodeHaveError(nodeID: string): boolean {
    const node = this.getNodeByID(nodeID);
    return node.status.node.isError() || node.status.socket.isError();
  }

  undo() {
    ActionHandler.undo();
  }

  redo() {
    ActionHandler.redo();
  }
}

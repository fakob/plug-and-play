import PPGraph from './classes/GraphClass';
import PPLink from './classes/LinkClass';
import PPNode from './classes/NodeClass';
import InterfaceController from './InterfaceController';
import { hri } from 'human-readable-ids';
import Socket from './classes/SocketClass';
import { getAllNodeTypes } from './nodes/allNodes';
import { ActionHandler } from './utils/actionHandler';
import { STATUS_SEVERITY } from './utils/constants';
import PPStorage from './PPStorage';

export default class TestController {
  identify(): string {
    return 'its testcontroller';
  }

  async addNode(
    nodeType: string,
    id = hri.random(),
    x = 0,
    y = 0,
  ): Promise<boolean> {
    await PPGraph.currentGraph
      .addNewNode(nodeType, { overrideId: id })
      .then((node) => {
        (node.x += x), (node.y += y);
      });
    return true;
  }

  getNodeByID(id: string): PPNode {
    return Object.values(PPGraph.currentGraph.nodes).find(
      (node) => node.id == id,
    );
  }

  getNodeCenter(node: PPNode): [number, number] {
    const pos = node.screenPointBackgroundRectCenter();
    return [pos.x, pos.y];
  }

  getNodeCenterById(nodeId: string): [number, number] {
    const toReturn = this.getNodeByID(nodeId);
    return this.getNodeCenter(toReturn);
  }

  moveNodeByID(id: string, x: number, y: number): void {
    const node = this.getNodeByID(id);
    node.x += x;
    node.y += y;
  }

  async connectNodesByID(
    node1ID: string,
    node2ID: string,
    node1Socket: string | undefined = undefined,
    node2Socket: string | undefined = undefined,
  ) {
    const n1 = this.getNodeByID(node1ID);
    const n2 = this.getNodeByID(node2ID);
    const originSocket =
      node1Socket == undefined
        ? n1.outputSocketArray[0]
        : n1.getOutputSocketByName(node1Socket);
    const targetSocket =
      node2Socket === undefined
        ? n2.getSocketForNewConnection(originSocket)
        : n2.getInputSocketByName(node2Socket);
    await PPGraph.currentGraph.connect(originSocket, targetSocket);
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
  getNodeInputValue(id: string, inputSocketName: string): any {
    return this.getNodeByID(id).getInputSocketByName(inputSocketName).data;
  }
  getNodeOutputValue(id: string, outputSocketName: string): any {
    return this.getNodeByID(id).getOutputData(outputSocketName);
  }
  getOutputSockets(id: string) {
    return this.getNodeByID(id).outputSocketArray;
  }
  getInputSockets(id: string) {
    return this.getNodeByID(id).inputSocketArray;
  }
  getVisibleInputSockets(id: string) {
    return this.getInputSockets(id).filter((socket) => socket.visible);
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

  async executeNodeByID(id: string) {
    await this.getNodeByID(id).executeOptimizedChain();
  }

  getSocketByNodeIDAndSocketName(nodeID: string, socketName: string) {
    const node = this.getNodeByID(nodeID);
    return node.getAllSockets().find((socket) => socket.name == socketName);
  }

  getSocketCenterByNodeIDAndSocketName(nodeID: string, socketName: string) {
    const socket = this.getSocketByNodeIDAndSocketName(nodeID, socketName);
    const pos = socket.screenPointSocketCenter();
    return [pos.x, pos.y];
  }

  getSocketLabelCenterByNodeIDAndSocketName(
    nodeID: string,
    socketName: string,
  ) {
    const socket = this.getSocketByNodeIDAndSocketName(nodeID, socketName);
    const pos = socket.screenPointSocketLabelCenter();
    return [pos.x, pos.y];
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

  async deleteAllGraphs(): Promise<void> {
    await PPStorage.getInstance().deleteAllGraphs();
  }

  removeNode(nodeID: string): void {
    PPGraph.currentGraph.removeNode(PPGraph.currentGraph.nodes[nodeID]);
  }

  getSelectedNodes(): PPNode[] {
    return this.getGraph().selection.selectedNodes;
  }

  selectNodesById(nodeIDs: string[]): PPNode[] {
    const nodes = nodeIDs.map((id) => this.getNodeByID(id));
    this.getGraph().selection.selectNodes(nodes, false, true);
    return nodes;
  }

  doesNodeHaveError(nodeID: string): boolean {
    const node = this.getNodeByID(nodeID);
    return (
      node.status.node.getSeverity() >= STATUS_SEVERITY.ERROR ||
      node.status.socket.getSeverity() >= STATUS_SEVERITY.ERROR
    );
  }

  getNodeCustomStatuses(nodeID: string) {
    return this.getNodeByID(nodeID).status.custom;
  }

  async undo() {
    await ActionHandler.undo();
  }

  async redo() {
    await ActionHandler.redo();
  }

  setShowUnsavedChangesWarning(show: boolean) {
    InterfaceController.showUnsavedChangesWarning = show;
  }

  toggleLeftSideDrawer(open = false) {
    InterfaceController.toggleLeftSideDrawer(open);
  }

  getTimesLoadedFromDB() {
    return PPStorage.getInstance().debug_timesLoaded;
  }
  getNodeTimesDrawn(nodeID: string) {
    return this.getNodeByID(nodeID).debug_timesDrawn;
  }
  spamToast(message: string) {
    InterfaceController.spamToast(message);
  }
}

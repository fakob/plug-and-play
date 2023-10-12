import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';

export class DynamicInputNode extends PPNode {
  public getSocketForNewConnection = (socket: Socket): Socket =>
    DynamicInputNodeFunctions.getSocketForNewConnection(socket, this);

  public async inputUnplugged() {
    return DynamicInputNodeFunctions.inputUnplugged(this);
  }
}

// i structured it like this so that classes that cannot directly inherit from DynamicInputNode can still use these
export class DynamicInputNodeFunctions {
  static getSocketForNewConnection(socket: Socket, node: PPNode): Socket {
    if (socket.isInput()) {
      return node.getSocketForNewConnection(socket);
    } else {
      const newSocket = new Socket(
        SOCKET_TYPE.IN,
        node.getNewInputSocketName(socket.name),
        socket.dataType,
      );
      node.addSocket(newSocket);
      node.resizeAndDraw();
      return newSocket;
    }
  }

  static async inputUnplugged(node: PPNode): Promise<void> {
    // remove all input sockets without connections
    const toRemove = node
      .getAllUserInterestingInputSockets()
      .filter((socket) => !socket.links.length);
    toRemove.forEach((socket) => node.removeSocket(socket));
    await node.executeOptimizedChain();
    node.inputUnplugged();
  }
}

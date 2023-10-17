import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';

export class DynamicInputNode extends PPNode {
  public getSocketForNewConnection = (socket: Socket): Socket =>
    DynamicInputNodeFunctions.getSocketForNewConnection(socket, this);

  public async inputUnplugged() {
    await DynamicInputNodeFunctions.recalibrateInputs(this);
    await super.inputUnplugged();
  }
  public async inputPlugged(): Promise<void> {
    await DynamicInputNodeFunctions.recalibrateInputs(this);
    await super.inputPlugged();
  }
  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return true;
  }
}

// i structured it like this so that classes that cannot directly inherit from DynamicInputNode (because JS/TS doesn't allow multiple inheritance) can still use these
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

  static getUnconnectedInterestingInputs(node: PPNode): Socket[] {
    return node
      .getAllUserInterestingInputSockets()
      .filter((socket) => socket.hasLink());
  }

  static async recalibrateInputs(node: PPNode): Promise<void> {
    // remove all input sockets without connections apart from "Input" and always make sure there are more of them
    const inputs = node.getAllUserInterestingInputSockets();
    //const connected = inputs.filter((socket) => socket.hasLink());
    const unConnected = inputs.filter((socket) => !socket.hasLink());
    const toRemove = unConnected.filter((socket) =>
      socket.name.includes('Input'),
    );
    toRemove.forEach((socket) => node.removeSocket(socket));

    const allNamedInput = inputs.filter((socket) =>
      socket.name.includes('Input'),
    );
    if (allNamedInput.find((socket) => !socket.hasLink()) == undefined) {
      node.addSocket(
        new Socket(SOCKET_TYPE.IN, node.getNewInputSocketName(), new AnyType()),
      );
    }
    await node.executeOptimizedChain();
  }
}

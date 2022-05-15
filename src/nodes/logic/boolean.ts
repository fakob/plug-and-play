import PPGraph from '../../classes/GraphClass';
import { PureNode } from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { BooleanType } from '../datatypes/booleanType';
import { NumberType } from './../datatypes/numberType';

const inputName = 'Input';
const input1Name = 'Input 1';
const input2Name = 'Input 2';
const outputName = 'Output';

export class NOT extends PureNode {
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[outputName] = !inputObject[inputName];
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputName, new BooleanType()),
      new Socket(SOCKET_TYPE.OUT, outputName, new BooleanType()),
    ];
  }
  public getName(): string {
    return 'NOT';
  }
  public getDescription(): string {
    return 'Logical NOT operation, returns inverse of input truthiness';
  }
}

export class OR extends PureNode {
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[outputName] =
      this.getAllSockets()
        .filter((socket) => socket.socketType === SOCKET_TYPE.IN)
        .find((socket) => socket.data) !== undefined;
  }

  public getCanAddInput(): boolean {
    return true;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, input1Name, new BooleanType()),
      new Socket(SOCKET_TYPE.IN, input2Name, new BooleanType()),
      new Socket(SOCKET_TYPE.OUT, outputName, new BooleanType()),
    ];
  }
  public getName(): string {
    return 'OR';
  }
  public getDescription(): string {
    return 'Logical OR operation, returns true if any of the inputs are truthy';
  }
}

export class AND extends PureNode {
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const inputSockets = this.getAllSockets().filter(
      (socket) => socket.socketType === SOCKET_TYPE.IN
    );
    outputObject[outputName] =
      inputSockets.find((socket) => !socket.data) === undefined;
  }

  public getCanAddInput(): boolean {
    return true;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, input1Name, new BooleanType()),
      new Socket(SOCKET_TYPE.IN, input2Name, new BooleanType()),
      new Socket(SOCKET_TYPE.OUT, outputName, new BooleanType()),
    ];
  }
  public getName(): string {
    return 'AND';
  }
  public getDescription(): string {
    return 'Logical AND operation, returns true if all of the inputs are truthy';
  }
}
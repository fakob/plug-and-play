import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  NODE_CORNERRADIUS,
  NODE_MARGIN,
  SOCKET_TYPE,
} from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';

export class Reroute extends PPNode {
  public getName(): string {
    return 'Reroute';
  }
  public getDescription(): string {
    return 'Reroute point';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'In', new AnyType()),
      new Socket(SOCKET_TYPE.OUT, 'Out', new AnyType()),
    ];
  }

  public getNodeWidth(): number {
    return 20;
  }
  public getNodeHeight(): number {
    return 3;
  }

  get headerHeight(): number {
    return -11;
  }

  public getDrawBackground(): boolean {
    return false;
  }

  public getShowLabels(): boolean {
    return false;
  }

  public getParallelInputsOutputs(): boolean {
    return true;
  }
  public getRoundedCorners(): boolean {
    return false;
  }

  public getColor(): TRgba {
    return TRgba.white();
  }

  public drawBackground(): void {
    this._BackgroundRef.drawCircle(16, 0, 14.5);
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject['Out'] = inputObject['In'];
  }
}

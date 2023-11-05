import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { DeferredPixiType } from '../datatypes/deferredPixiType';
import { NumberType } from '../datatypes/numberType';
import { outputPixiName } from './abstract';

const outputXName = 'X';
const outputYName = 'Y';
const outputWidthName = 'Width';
const outputHeightName = 'Height';

export default class DRAw_Get_Bounds extends PPNode {
  public getName(): string {
    return 'Get Draw Bounds';
  }

  public getDescription(): string {
    return 'Returns the origina and width and height of a draw';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  public getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.DRAW);
  }
  public getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, outputPixiName, new DeferredPixiType()),
      new Socket(SOCKET_TYPE.OUT, outputXName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, outputYName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, outputWidthName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, outputHeightName, new NumberType()),
    ];
  }

  protected onExecute(input: any, output: any): Promise<void> {}
}

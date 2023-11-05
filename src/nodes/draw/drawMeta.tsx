import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { DeferredPixiType } from '../datatypes/deferredPixiType';
import { NumberType } from '../datatypes/numberType';
import { outputPixiName } from './abstract';
import * as PIXI from 'pixi.js';

const outputXName = 'X';
const outputYName = 'Y';
const outputWidthName = 'Width';
const outputHeightName = 'Height';
const inputMarginName = 'Margin';

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
      new Socket(
        SOCKET_TYPE.IN,
        inputMarginName,
        new NumberType(false, 0, 100),
        0,
      ),
      new Socket(SOCKET_TYPE.OUT, outputXName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, outputYName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, outputWidthName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, outputHeightName, new NumberType()),
    ];
  }

  public static getDrawingBounds(drawingFunction, margin: number) {
    const tempContainer = new PIXI.Container();
    drawingFunction(tempContainer, {});
    const bounds = tempContainer.getBounds();
    bounds.x -= margin;
    bounds.y -= margin;
    bounds.width += margin * 2;
    bounds.height += margin * 2;
    return bounds;
  }

  protected onExecute(input: any, output: any): Promise<void> {
    const drawingFunction = input[outputPixiName];
    const bounds = DRAw_Get_Bounds.getDrawingBounds(
      drawingFunction,
      input[inputMarginName],
    );
    output[outputXName] = bounds.x;
    output[outputYName] = bounds.y;
    output[outputWidthName] = bounds.width;
    output[outputHeightName] = bounds.height;
    return;
  }
}

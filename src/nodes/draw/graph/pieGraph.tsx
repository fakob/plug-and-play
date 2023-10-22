import { DRAW_Base, injectedDataName } from '../abstract';
import Socket from '../../../classes/SocketClass';
import { SOCKET_TYPE } from '../../../utils/constants';
import { ArrayType } from '../../datatypes/arrayType';
import { NumberType } from '../../datatypes/numberType';
import { BooleanType } from '../../datatypes/booleanType';
import * as PIXI from 'pixi.js';

const inputDataName = 'Input data';
const inputLineWidth = 'Line width';
const inputShowValues = 'Show values';
const inputShowValuesFontSize = 'Font size';

export class GRAPH_PIE extends DRAW_Base {
  public getName(): string {
    return 'Draw Pie Graph';
  }

  public getDescription(): string {
    return 'Draws a Pie Graph based on input data/labels/colors';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputDataName, new ArrayType(), [
        { Value: 1, Name: 'Example' },
      ]),
      new Socket(
        SOCKET_TYPE.IN,
        inputLineWidth,
        new NumberType(false, 1, 10),
        2,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputShowValues,
        new BooleanType(),
        true,
        false,
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        inputShowValuesFontSize,
        new NumberType(),
        12,
        () => this.getInputData(inputShowValues),
      ),
    ].concat(super.getDefaultIO());
  }

  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number },
  ): void {
    inputObject = {
      ...inputObject,
      ...inputObject[injectedDataName][
        this.getAndIncrementExecutions(executions)
      ],
    };

    const graphics = new PIXI.Graphics();

    // determine total amount of values
    // we allow either an array of just the numbers, or (better), an object that contains data and potentially other stuff
    const total = inputObject[inputDataName].map((value) => {
      return typeof value == 'number' ? value : value['Value'];
    });

    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

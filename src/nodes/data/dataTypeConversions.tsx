/* eslint-disable prettier/prettier */
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import {
  parseValueAndAttachWarnings,
  updateDataIfDefault,
} from '../../utils/utils';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import { NumberType } from '../datatypes/numberType';
import { TwoDVectorType } from '../datatypes/twoDVectorType';

const xName = 'x';
const yName = 'y';
const xyDefault = 0;
const outValueName = '2D vector';

export class NumberToTwoDVector extends PPNode {
  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });
  }

  public getName(): string {
    return 'Number to 2D vector';
  }

  public getDescription(): string {
    return 'Converts 2 numbers to a 2D vector';
  }

  public getTags(): string[] {
    return ['JSON'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        xName,
        new NumberType(false, -1000, 1000),
        xyDefault,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        yName,
        new NumberType(false, -1000, 1000),
        xyDefault,
      ),
      new Socket(SOCKET_TYPE.OUT, outValueName, new TwoDVectorType()),
    ];
  }

  public async populateDefaults(socket): Promise<void> {
    const target = socket.links[0].getTarget();
    if (
      xyDefault === this.getInputData(xName) &&
      xyDefault === this.getInputData(yName)
    ) {
      const data = parseValueAndAttachWarnings(
        this,
        new TwoDVectorType(),
        target.defaultData,
      );
      this.setInputData(xName, data.x);
      this.setInputData(yName, data.y);
      this.executeOptimizedChain();
    }
    await super.populateDefaults(socket);
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    outputObject[outValueName] = {
      x: inputObject[xName],
      y: inputObject[yName],
    };
  }
}

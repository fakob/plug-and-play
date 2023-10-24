import { DRAW_Base, injectedDataName } from '../abstract';
import Socket from '../../../classes/SocketClass';
import { SOCKET_TYPE } from '../../../utils/constants';
import { ArrayType } from '../../datatypes/arrayType';
import { NumberType } from '../../datatypes/numberType';
import { BooleanType } from '../../datatypes/booleanType';
import * as PIXI from 'pixi.js';
import { TRgba } from '../../../utils/interfaces';

const inputDataName = 'Input data';
const inputLineWidth = 'Line width';
const inputRadius = "Radius";
const inputShowValues = 'Show values';
const inputShowValuesFontSize = 'Font size';


class PieSlice {
  Value: number;
  Name: string | undefined;
  Color: TRgba | undefined;

  constructor(inValue, inName) {
    this.Name = inName;
    this.Value = inValue;
  }
};
const PIE_GRAPH_RESOLUTION = 360;
const RADIAN_PER_DEGREES = 1 / 57.2957795;

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
        { Value: 2, Name: 'Big slice', Color: new TRgba(1, 0, 0, 0.5) }, { Value: 1, Name: "Small slice", Color: new TRgba(0, 1, 1, 0.5) }
      ]),
      new Socket(SOCKET_TYPE.IN, inputRadius, new NumberType(false, 1, 1000), 100),
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

  private djb2(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
  }

  private generateHexColorFromString(input) {
    const hashValue = this.djb2(input);
    const hexColor = '#' + (hashValue & 0xFFFFFF).toString(16).padStart(6, '0');
    return hexColor;
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

    const pieSlices: PieSlice[] = inputObject[inputDataName];
    // determine total amount of values
    // we allow either an array of just the numbers, or (better), an object that contains data and potentially other stuff
    const total: number = pieSlices.reduce((total, pieSlice) =>
      total + pieSlice.Value, 0);

    const radius = inputObject[inputRadius];

    let currDegrees = 0;
    pieSlices.forEach((pieSlice, index) => {
      const partOfTotal = pieSlice.Value / total;
      const slice = new PIXI.Polygon();
      slice.points.push(0);
      slice.points.push(0);
      const hexColor = /*pieSlice.Color !== undefined ? new TRgba(pieSlice.Color).hexNumber() :*/ this.generateHexColorFromString(pieSlice.Name);
      graphics.beginFill(hexColor);
      //graphics.alpha = 0.5;
      for (let i = 0; i < PIE_GRAPH_RESOLUTION * partOfTotal; i++) {
        const x = Math.cos(RADIAN_PER_DEGREES * currDegrees) * radius;
        const y = Math.sin(RADIAN_PER_DEGREES * currDegrees) * radius;
        //graphics.drawCircle(x, y, 10);
        slice.points.push(x);
        slice.points.push(y);
        currDegrees += 360 / PIE_GRAPH_RESOLUTION;
        // console.log("x, y: " + x + ", " + y);
      }
      currDegrees -= 360 / PIE_GRAPH_RESOLUTION;
      // last slice needs to wrap around
      if (index == pieSlices.length - 1) {
        slice.points.push(radius);
        slice.points.push(0);
      }
      slice.points.push(0);
      slice.points.push(0);

      graphics.drawPolygon(slice);
    });


    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

import { DRAW_Base, injectedDataName } from '../abstract';
import Socket from '../../../classes/SocketClass';
import { SOCKET_TYPE } from '../../../utils/constants';
import { ArrayType } from '../../datatypes/arrayType';
import { NumberType } from '../../datatypes/numberType';
import { BooleanType } from '../../datatypes/booleanType';
import * as PIXI from 'pixi.js';
import { TRgba } from '../../../utils/interfaces';

const inputDataName = 'Input Data';
const inputRadius = 'Radius';
const inputShowNames = 'Show Names';
const inputShowValuesFontSize = 'Font Size';
const inputShowReference = 'Show Reference';
const inputShowPercentage = 'Percentage';
const input3DRatio = '3D ratio';
const distanceFromCenter = 'Distance From Center';

class PieSlice {
  Value: number;
  Name: string | undefined;
  Color: TRgba | undefined;

  constructor(inValue, inName) {
    this.Name = inName;
    this.Value = inValue;
  }
}
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
        { Value: 2, Name: 'Big slice', Color: new TRgba(1, 0, 0, 0.5) },
        { Value: 1, Name: 'Small slice', Color: new TRgba(0, 1, 1, 0.5) },
      ]),
      new Socket(
        SOCKET_TYPE.IN,
        inputRadius,
        new NumberType(false, 1, 1000),
        100,
      ),
      new Socket(SOCKET_TYPE.IN, input3DRatio, new NumberType(false, 0, 1), 0),
      new Socket(
        SOCKET_TYPE.IN,
        distanceFromCenter,
        new NumberType(false, 0, 20),
        1,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputShowNames,
        new BooleanType(),
        true,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputShowReference,
        new BooleanType(),
        true,
        true,
      ),
      new Socket(SOCKET_TYPE.IN, inputShowPercentage, new BooleanType(), false),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        inputShowValuesFontSize,
        new NumberType(),
        24,
        () => this.getInputData(inputShowNames),
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

  private generateColorFromString(input) {
    const hashValue = this.djb2(input);
    const hexColor = '#' + (hashValue & 0xffffff).toString(16).padStart(6, '0');
    const toReturn = TRgba.fromString(hexColor);
    toReturn.a = 0.5;
    return toReturn;
  }

  private getValueText(
    text: string,
    location: PIXI.Point,
    fontSize: number,
    anchorCentered = true,
  ): PIXI.Text {
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: fontSize,
      whiteSpace: 'pre-line',
      lineJoin: 'round',
    });
    const basicText = new PIXI.Text(text, textStyle);
    basicText.position = location;
    if (anchorCentered) {
      basicText.anchor.y = 0.5;
      basicText.anchor.x = 0.5;
    }
    return basicText;
  }

  private drawReference() {}

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
    const total: number = pieSlices.reduce(
      (total, pieSlice) => total + pieSlice.Value,
      0,
    );

    const radius = inputObject[inputRadius];
    const fontSize = inputObject[inputShowValuesFontSize];

    let currDegrees = 0;
    pieSlices.forEach((pieSlice, index) => {
      const partOfTotal = pieSlice.Value / total;
      const slice = new PIXI.Polygon();
      const polygonPoints: PIXI.Point[] = [];
      polygonPoints.push(new PIXI.Point(0, 0));
      const color =
        pieSlice.Color !== undefined
          ? TRgba.fromObject(pieSlice.Color)
          : this.generateColorFromString(pieSlice.Name);
      graphics.beginFill(color.hexNumber());
      graphics.alpha = color.a;
      const degreesPre = currDegrees;
      for (let i = 0; i < PIE_GRAPH_RESOLUTION * partOfTotal; i++) {
        const x = Math.cos(RADIAN_PER_DEGREES * currDegrees) * radius;
        const y = Math.sin(RADIAN_PER_DEGREES * currDegrees) * radius;
        polygonPoints.push(new PIXI.Point(x, y));
        currDegrees += 360 / PIE_GRAPH_RESOLUTION;
        // console.log("x, y: " + x + ", " + y);
      }
      currDegrees -= 360 / PIE_GRAPH_RESOLUTION;
      const averageDegree = (currDegrees + degreesPre) / 2;
      const averageDirection = new PIXI.Point(
        Math.cos(RADIAN_PER_DEGREES * averageDegree),
        Math.sin(RADIAN_PER_DEGREES * averageDegree),
      );
      if (inputObject[inputShowNames]) {
        const distance = radius * (3 / 4);
        const valuePosition = new PIXI.Point(
          averageDirection.x * distance,
          averageDirection.y * distance,
        );
        const textToUse = pieSlice.Name;
        graphics.addChild(
          this.getValueText(textToUse, valuePosition, fontSize),
        );
      }
      if (inputObject[inputShowReference]) {
        const distanceBetween =
          (radius * 2) / Math.max(1, pieSlices.length - 1);
        const location = new PIXI.Point(
          radius * (4 / 3),
          -radius + index * distanceBetween,
        );
        const textToUse =
          pieSlice.Name +
          ': ' +
          (inputObject[inputShowPercentage]
            ? (partOfTotal * 100.0).toFixed(2) + '%'
            : pieSlice.Value.toString());
        graphics.addChild(
          this.getValueText(
            textToUse,
            location,
            inputObject[inputShowValuesFontSize],
            false,
          ),
        );
        graphics.drawCircle(
          location.x - fontSize * 2,
          location.y + fontSize * 0.5,
          fontSize,
        );
      }
      // last slice needs to wrap around
      if (index == pieSlices.length - 1) {
        polygonPoints.push(new PIXI.Point(radius, 0));
      }
      polygonPoints.push(new PIXI.Point(0, 0));

      polygonPoints.forEach((point) => {
        slice.points.push(point.x);
        slice.points.push(point.y);
      });

      graphics.drawPolygon(slice);
    });

    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

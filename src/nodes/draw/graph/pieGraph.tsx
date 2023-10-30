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
const inputShowBorder = 'Show Border';
const inputShowPercentage = 'Percentage';
const input3DRatio = '3D ratio';
const inputDistanceFromCenter = 'Distance From Center';

class PieSlice {
  Value: number;
  Name: string | undefined;
  Color: TRgba | undefined;

  constructor(inValue, inName) {
    this.Name = inName;
    this.Value = inValue;
  }
}

interface PieDrawnSlice {
  highestY: number;
  color: TRgba;
  drawFunction: (graphics: PIXI.Graphics) => void;
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
        { Value: 5, Name: 'Big slice', Color: new TRgba(0, 9, 148, 1) },
        { Value: 3, Name: 'Small slice', Color: new TRgba(128, 192, 0, 1) },
        { Value: 1, Name: 'Tiny slice', Color: new TRgba(192, 128, 0, 1) },
      ]),
      new Socket(
        SOCKET_TYPE.IN,
        inputRadius,
        new NumberType(false, 1, 1000),
        250,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        input3DRatio,
        new NumberType(false, 0, 1),
        0.25,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputDistanceFromCenter,
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
      new Socket(
        SOCKET_TYPE.IN,
        inputShowBorder,
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

  private convexHull(points) {
    if (points.length <= 3) return points;

    // Sort by lowest Y and then by X if tied
    points.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
    const start = points[0];

    // Calculate polar angles
    points.forEach((p) => {
      p.angle = Math.atan2(p.y - start.y, p.x - start.x);
    });

    // Sort by polar angle
    points.sort((a, b) => a.angle - b.angle);

    const result = [start];
    for (let i = 1; i < points.length; i++) {
      while (
        result.length > 1 &&
        this.crossProduct(
          result[result.length - 2],
          result[result.length - 1],
          points[i],
        ) <= 0
      ) {
        result.pop();
      }
      result.push(points[i]);
    }

    return result;
  }

  private crossProduct(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
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
    const total: number = pieSlices.reduce(
      (total, pieSlice) => total + pieSlice.Value,
      0,
    );

    const radius = inputObject[inputRadius];
    const fontSize = inputObject[inputShowValuesFontSize];

    let currDegrees = 0;
    const deferredGraphics = new PIXI.Graphics(); // we might want stuff underneath the top layer (3D perspective)

    const distanceFromCenter = Math.max(
      0.01,
      inputObject[inputDistanceFromCenter],
    );
    // 3D perspective scale
    const yScale = Math.max(0, Math.cos(inputObject[input3DRatio]));

    const slicesToDraw: PieDrawnSlice[] = [];

    pieSlices.sort((slice1, slice2) => slice2.Value - slice1.Value);

    pieSlices.forEach((pieSlice, index) => {
      const partOfTotal = pieSlice.Value / total;
      const polygonPoints: PIXI.Point[] = [];
      polygonPoints.push(new PIXI.Point(0, 0));
      const color =
        pieSlice.Color !== undefined
          ? TRgba.fromObject(pieSlice.Color)
          : this.generateColorFromString(pieSlice.Name);
      deferredGraphics.beginFill(color.hexNumber(), color.a);
      graphics.beginFill(color.hexNumber(), color.a);
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
          averageDirection.y * distance * yScale,
        );
        const textToUse = pieSlice.Name;
        deferredGraphics.addChild(
          this.getValueText(textToUse, valuePosition, fontSize),
        );
      }
      if (inputObject[inputShowReference]) {
        const circleOffsetX = fontSize * 2;
        const distanceBetween =
          (radius * 2) / Math.max(1, pieSlices.length - 1);
        const location = new PIXI.Point(
          radius * (4 / 3) + distanceFromCenter + circleOffsetX,
          -radius + index * distanceBetween,
        );
        const textToUse =
          pieSlice.Name +
          ': ' +
          (inputObject[inputShowPercentage]
            ? (partOfTotal * 100.0).toFixed(2) + '%'
            : pieSlice.Value.toString());
        deferredGraphics.addChild(
          this.getValueText(
            textToUse,
            location,
            inputObject[inputShowValuesFontSize],
            false,
          ),
        );
        deferredGraphics.drawCircle(
          location.x - circleOffsetX,
          location.y + fontSize * 0.5,
          fontSize,
        );
      }
      // last slice needs to wrap around
      if (index == pieSlices.length - 1) {
        polygonPoints.push(new PIXI.Point(radius, 0));
      }
      polygonPoints.push(new PIXI.Point(0, 0));

      const polygonPointsMovedFromCenter = polygonPoints.map((point) => {
        return new PIXI.Point(
          point.x + averageDirection.x * distanceFromCenter,
          point.y + averageDirection.y * distanceFromCenter,
        );
      });

      const slice = new PIXI.Polygon();
      let highestY = -100000000000;

      polygonPointsMovedFromCenter.forEach((point) => {
        const scaledY = yScale * point.y;
        slice.points.push(point.x);
        slice.points.push(scaledY);
        highestY = Math.max(highestY, scaledY);
      });

      if (inputObject[input3DRatio] > 0) {
        const dist = Math.sin(inputObject[input3DRatio]) * radius;
        const polygonMovedScaled = polygonPointsMovedFromCenter.map((point) => {
          return new PIXI.Point(point.x, point.y * yScale);
        });
        const bottom = polygonMovedScaled.map(
          (point) => new PIXI.Point(point.x, point.y + dist),
        );
        //const allP = this.convexHull(bottom.concat(polygonMovedScaled));

        const slice3D = new PIXI.Polygon();
        bottom.forEach((point) => {
          slice3D.points.push(point.x);
          slice3D.points.push(point.y);
        });

        // complex... wander around the two polygons filling in area in between them
        const inbetweenArea = new PIXI.Polygon();
        let minX = 1000000;
        let minXY = -1;
        let maxX = -1000000;
        let maxXY = -1;

        polygonMovedScaled.forEach((point) => {
          if (point.x < minX) {
            minX = point.x;
            minXY = point.y;
          } else if (point.x > maxX) {
            maxX = point.x;
            maxXY = point.y;
          }
        });
        inbetweenArea.points.push(minX);
        inbetweenArea.points.push(minXY);

        inbetweenArea.points.push(minX);
        inbetweenArea.points.push(minXY + dist);

        inbetweenArea.points.push(maxX);
        inbetweenArea.points.push(maxXY + dist);

        inbetweenArea.points.push(maxX);
        inbetweenArea.points.push(maxXY);

        slicesToDraw.push({
          highestY: highestY,
          color,
          drawFunction: (graphics: PIXI.Graphics) => {
            graphics.lineStyle(0);
            graphics.drawPolygon(inbetweenArea);
            graphics.drawPolygon(slice3D);
            if (inputObject[inputShowBorder]) {
              graphics.lineStyle(1, color.multiply(0.8).hexNumber());
            }
            graphics.drawPolygon(slice);
          },
        });
      } else {
        slicesToDraw.push({
          highestY: highestY,
          color,
          drawFunction: (graphics: PIXI.Graphics) => {
            if (inputObject[inputShowBorder]) {
              graphics.lineStyle(1, color.multiply(0.8).hexNumber());
              graphics.drawPolygon(slice);
            }
          },
        });
      }
    });

    // we sort them based on Y so that they are correctly sorted when doing the 3D view
    slicesToDraw.sort(
      (pieSlice1, pieSlice2) => pieSlice1.highestY - pieSlice2.highestY,
    );
    slicesToDraw.forEach((slice) => {
      graphics.beginFill(slice.color.hexNumber());
      slice.drawFunction(graphics);
    });

    graphics.addChild(deferredGraphics);
    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

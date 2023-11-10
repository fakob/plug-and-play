import { DRAW_Base, injectedDataName } from '../abstract';
import Socket from '../../../classes/SocketClass';
import { COLOR, SOCKET_TYPE } from '../../../utils/constants';
import { ArrayType } from '../../datatypes/arrayType';
import { NumberType } from '../../datatypes/numberType';
import { BooleanType } from '../../datatypes/booleanType';
import * as PIXI from 'pixi.js';
import { TRgba } from '../../../utils/interfaces';
import {
  GraphInputPoint,
  GraphInputType,
} from '../../datatypes/graphInputType';

const inputDataName = 'Input Data';
const inputRadius = 'Radius';
const inputShowNames = 'Show Names';
const inputShowNamesDistance = 'Name Distance';
const inputShowValuesFontSize = 'Font Size';
const inputShowReference = 'Show Reference';
const inputShowBorder = 'Show Border';
const inputDegreesTotal = 'Degrees In Total';
const inputShowPercentage = 'Percentage';
const input3DRatio = '3D ratio';
const inputDistanceFromCenter = 'Distance From Center';

interface PieDrawnSlice {
  highestY: number;
  lowestY: number;
  color: TRgba;
  preDraws: ((g: PIXI.Graphics, desiredIntensity: number) => void)[];
  draws: ((g: PIXI.Graphics, desiredIntensity: number) => void)[];
  textDraws: ((g: PIXI.Graphics, desiredIntensity: number) => void)[];
}

const PIE_GRAPH_RESOLUTION = 1000;
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
      new Socket(SOCKET_TYPE.IN, inputDataName, new GraphInputType(), [
        { Value: 5, Name: 'Big slice', Color: new TRgba(33, 150, 243, 1) },
        { Value: 3, Name: 'Small slice', Color: new TRgba(251, 192, 45, 1) },
        {
          Value: 1,
          Name: 'Tiny slice',
          Color: new TRgba(38, 166, 154, 1),
        },
      ]),
      new Socket(
        SOCKET_TYPE.IN,
        inputRadius,
        new NumberType(false, 1, 1000),
        205,
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
        new NumberType(false, 0, 40),
        10,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputShowNames,
        new BooleanType(),
        true,
        false,
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        inputShowNamesDistance,
        new NumberType(false, 0.1, 2),
        0.75,
        () => this.getInputData(inputShowNamesDistance),
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
        inputDegreesTotal,
        new NumberType(true, 1, 360),
        360,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, inputShowBorder, new BooleanType(), false),
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

    const pieSlices: GraphInputPoint[] = inputObject[inputDataName];
    // fail error if invalid input
    if (typeof pieSlices !== 'object') {
      return;
    }
    // determine total amount of values
    // we allow either an array of just the numbers, or (better), an object that contains data and potentially other stuff
    const total: number = pieSlices.reduce(
      (total, pieSlice) => total + pieSlice.Value,
      0,
    );

    const radius = inputObject[inputRadius];
    const fontSize = inputObject[inputShowValuesFontSize];
    const degreesTotal = inputObject[inputDegreesTotal];
    const defaultNameDistance = inputObject[inputShowNamesDistance];

    let currDegrees = 0;

    // 3D perspective scale
    const yScale = Math.max(0, Math.cos(inputObject[input3DRatio]));

    const slicesToDraw: PieDrawnSlice[] = [];

    pieSlices.sort((slice1, slice2) => slice2.Value - slice1.Value);

    // sick shit
    const remainders = pieSlices.map((slice) => {
      const val = (slice.Value * PIE_GRAPH_RESOLUTION) / total;
      return val - Math.floor(val);
    });

    //console.log('remainders : ' + JSON.stringify(remainders));
    let totalRemainingSteps = remainders.reduce((prev, curr) => prev + curr, 0);
    totalRemainingSteps = Math.ceil(totalRemainingSteps);
    //console.log('remainding steps: ' + totalRemainingSteps);

    // draw all slices
    pieSlices.forEach((pieSlice, index) => {
      pieSlice.Color =
        pieSlice.Color !== undefined
          ? TRgba.fromObject(pieSlice.Color)
          : TRgba.fromString(COLOR[index % COLOR.length]);
      const draws: ((g: PIXI.Graphics, desiredIntensity: number) => void)[] =
        [];
      const preDraws: ((g: PIXI.Graphics, desiredIntensity: number) => void)[] =
        [];
      const textDraws: ((
        g: PIXI.Graphics,
        desiredIntensity: number,
      ) => void)[] = [];
      const distanceFromCenter = Math.max(
        0.01,
        inputObject[inputDistanceFromCenter] || 0.01,
      );

      const partOfTotal = pieSlice.Value / total;
      const polygonPoints: PIXI.Point[] = [];

      polygonPoints.push(new PIXI.Point(0, 0));
      const color = pieSlice.Color;
      const degreesPre = currDegrees;
      const endIndex =
        PIE_GRAPH_RESOLUTION * partOfTotal +
        (index < totalRemainingSteps ? 1.0 : 0.0);

      for (let i = 0; i < endIndex; i++) {
        const currRadian = RADIAN_PER_DEGREES * currDegrees;
        const x = Math.cos(currRadian) * radius;
        const y = Math.sin(currRadian) * radius;
        polygonPoints.push(new PIXI.Point(x, y));
        currDegrees += degreesTotal / PIE_GRAPH_RESOLUTION;
      }
      currDegrees -= degreesTotal / PIE_GRAPH_RESOLUTION;
      const averageDegree = (currDegrees + degreesPre) / 2;
      const averageDirection = new PIXI.Point(
        Math.cos(RADIAN_PER_DEGREES * averageDegree),
        Math.sin(RADIAN_PER_DEGREES * averageDegree),
      );
      if (inputObject[inputShowNames]) {
        const distance = radius * defaultNameDistance;
        const valuePosition = new PIXI.Point(
          averageDirection.x * distance,
          averageDirection.y * distance * yScale,
        );
        const textToUse = pieSlice.Name;
        textDraws.push((drawGraphics: PIXI.Graphics) => {
          drawGraphics.addChild(
            this.getValueText(textToUse, valuePosition, fontSize),
          );
        });

        // if too far away, draw line back to my slice
        if (distance > radius) {
          textDraws.push((drawGraphics: PIXI.Graphics) => {
            drawGraphics.lineStyle(1, TRgba.black().hexNumber());
            drawGraphics.moveTo(
              averageDirection.x * radius,
              averageDirection.y * radius * yScale,
            );
            drawGraphics.lineTo(
              averageDirection.x * distance,
              averageDirection.y * (distance - fontSize * 0.5) * yScale,
            );
            drawGraphics.lineStyle(0, TRgba.black().hexNumber());
          });
        }
      }
      if (inputObject[inputShowReference]) {
        const circleOffsetX = fontSize * 2;
        const distanceDesiredByPie = distanceFromCenter + circleOffsetX;
        const distanceDesiredByName =
          (defaultNameDistance - 1) * radius + circleOffsetX;
        const distanceBetween =
          (radius * 2) / Math.max(1, pieSlices.length - 1);
        const location = new PIXI.Point(
          radius * (4 / 3) +
            Math.max(distanceDesiredByName, distanceDesiredByPie),
          -radius + index * distanceBetween,
        );
        const textToUse =
          pieSlice.Name +
          ': ' +
          (inputObject[inputShowPercentage]
            ? (partOfTotal * 100.0).toFixed(2) + '%'
            : pieSlice.Value.toString());

        draws.push((drawGraphics: PIXI.Graphics) => {
          drawGraphics.lineStyle(1, TRgba.black().hexNumber());
          drawGraphics.addChild(
            this.getValueText(
              textToUse,
              location,
              inputObject[inputShowValuesFontSize],
              false,
            ),
          );
          drawGraphics.drawCircle(
            location.x - circleOffsetX,
            location.y + fontSize * 0.5,
            fontSize,
          );
          drawGraphics.lineStyle(0);
        });
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
      let lowestY = 1000000000;

      polygonPointsMovedFromCenter.forEach((point) => {
        const scaledY = yScale * point.y;
        slice.points.push(point.x);
        slice.points.push(scaledY);
        highestY = Math.max(highestY, scaledY);
        lowestY = Math.min(lowestY, scaledY);
      });

      const drawTop = (graphics: PIXI.Graphics, desiredIntensity) => {
        if (inputObject[inputShowBorder]) {
          graphics.lineStyle(1, color.multiply(0.8).hexNumber());
        }
        graphics.beginFill(color.multiply(desiredIntensity).hexNumber());
        graphics.drawPolygon(slice);
      };
      draws.unshift(drawTop);

      if (inputObject[input3DRatio] > 0) {
        const dist = Math.sin(inputObject[input3DRatio]) * 0.5 * radius;
        const polygonMovedScaled = polygonPointsMovedFromCenter.map((point) => {
          return new PIXI.Point(point.x, point.y * yScale);
        });
        const bottom = polygonMovedScaled.map(
          (point) => new PIXI.Point(point.x, point.y + dist),
        );

        const slice3D = new PIXI.Polygon();
        bottom.forEach((point) => {
          slice3D.points.push(point.x);
          slice3D.points.push(point.y);
        });

        // complex... wander around the two polygons filling in area in between them with a 4 corner polygon
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
        [
          minX,
          minXY,
          minX,
          minXY + dist,
          maxX,
          maxXY + dist,
          maxX,
          maxXY,
        ].forEach((point) => inbetweenArea.points.push(point));
        preDraws.unshift((graphics: PIXI.Graphics) => {
          graphics.lineStyle(0);
          graphics.beginFill(color.multiply(0.95).hexNumber());
          graphics.drawPolygon(inbetweenArea);
          graphics.drawPolygon(slice3D);
        });
      }
      slicesToDraw.push({
        highestY,
        lowestY,
        color,
        preDraws,
        draws,
        textDraws,
      });
    });

    // we sort them based on Y so that they are correctly sorted when doing the 3D view
    slicesToDraw.sort(
      (pieSlice1, pieSlice2) =>
        pieSlice1.highestY -
        pieSlice2.highestY +
        (pieSlice1.lowestY - pieSlice2.lowestY),
    );
    const topDraws: PIXI.Graphics[] = [];
    graphics.lineStyle(1, TRgba.black().hexNumber());
    slicesToDraw.forEach((slice) => {
      graphics.beginFill(slice.color.hexNumber());
      slice.preDraws.forEach((preDraw) => {
        preDraw(graphics, 1.0);
      });
    });
    slicesToDraw.forEach((slice) => {
      const drawGraphics = new PIXI.Graphics();
      drawGraphics.beginFill(slice.color.hexNumber());
      slice.draws.forEach((draw) => {
        draw(drawGraphics, 1.0);
      });
      drawGraphics.interactive = true;
      drawGraphics.addEventListener('pointerover', (e) => {
        drawGraphics.removeChildren();
        slice.draws.forEach((draw) => {
          draw(drawGraphics, 1.2);
        });
      });

      drawGraphics.addEventListener('pointerout', (e) => {
        drawGraphics.removeChildren();
        slice.draws.forEach((draw) => {
          draw(drawGraphics, 1.0);
        });
      });
      topDraws.push(drawGraphics);
    });

    topDraws.forEach((draw) => graphics.addChild(draw));
    slicesToDraw.forEach((slice) => {
      graphics.beginFill(slice.color.hexNumber());
      slice.textDraws.forEach((draw) => {
        draw(graphics, 1.0);
      });
    });
    //graphics.addChild(deferredGraphics);
    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

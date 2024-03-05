import Socket from '../../../classes/SocketClass';
import { SOCKET_TYPE } from '../../../utils/constants';
import { parseValueAndAttachWarnings } from '../../../utils/utils';
import { NumberType } from '../../datatypes/numberType';
import * as PIXI from 'pixi.js';
import { BooleanType } from '../../datatypes/booleanType';
import { TRgba } from '../../../utils/interfaces';
import { ColorType } from '../../datatypes/colorType';
import { DRAW_Base, injectedDataName } from '../abstract';
import {
  GraphInputPoint,
  GraphInputType,
} from '../../datatypes/graphInputType';

const inputDataName = 'Input Data';
const inputHeightName = 'Height';
const inputWidthName = 'Width';
const inputAutoScaleHeight = 'Auto scale';
const inputCustomMinHeight = 'Custom min height';
const inputCustomMaxHeight = 'Custom max height';
const inputShouldUseBezierCurve = 'Bezier curve';
const inputShouldShowAxis = 'Show axis';
const inputShouldShowAxisLines = 'Show axis lines';
const inputFillGraph = 'Fill Graph';
const inputAxisGranularity = 'Axis granularity';
const inputShouldShowValues = 'Show values';
const inputShowValuesFontSize = 'Font size';
const inputShowNames = 'Show names';
const inputColorName = 'Color';
const inputLineWidthName = 'Line Width';

export class GRAPH_LINE extends DRAW_Base {
  public getName(): string {
    return 'Draw Line Graph';
  }

  public getDescription(): string {
    return 'Draws a line graph based on input points and optional labels';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputDataName, new GraphInputType(), [
        { Value: 0, Name: 'First' },
        { Value: 1, Name: 'Second' },
        { Value: 5 },
        { Value: 10 },
        { Value: 7 },
      ]),
      new Socket(
        SOCKET_TYPE.IN,
        inputWidthName,
        new NumberType(false, 1, 1000),
        400,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputHeightName,
        new NumberType(false, 1, 1000),
        200,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputLineWidthName,
        new NumberType(false, 1, 10),
        2,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputAutoScaleHeight,
        new BooleanType(),
        true,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputCustomMinHeight,
        new NumberType(false, -100, 100),
        0,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputCustomMaxHeight,
        new NumberType(false, 0, 100),
        1,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputShouldUseBezierCurve,
        new BooleanType(),
        true,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputShouldShowAxis,
        new BooleanType(),
        true,
        false,
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        inputShouldShowAxisLines,
        new BooleanType(),
        false,
        () => this.getInputData(inputShouldShowAxis),
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputFillGraph,
        new BooleanType(),
        false,
        false,
      ),
      Socket.getOptionalVisibilitySocket(
        SOCKET_TYPE.IN,
        inputAxisGranularity,
        new NumberType(true, 1, 10),
        3,
        () => this.getInputData(inputShouldShowAxis),
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputShouldShowValues,
        new BooleanType(),
        true,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, inputShowValuesFontSize, new NumberType(), 12),
      new Socket(SOCKET_TYPE.IN, inputShowNames, new BooleanType(), true),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType()),
    ].concat(super.getDefaultIO());
  }

  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number },
    offset: PIXI.Point,
  ): void {
    inputObject = {
      ...inputObject,
      ...inputObject[injectedDataName][
        this.getAndIncrementExecutions(executions)
      ],
    };

    const points: GraphInputPoint[] = inputObject[inputDataName];
    if (!points.length) {
      return;
    }
    const values = points.map((point) => point.Value);
    let maxValue = values.reduce((prevMax, point) => Math.max(prevMax, point));
    let minValue = values.reduce((prevMax, point) => Math.min(prevMax, point));
    if (!inputObject[inputAutoScaleHeight]) {
      maxValue = inputObject[inputCustomMaxHeight];
      minValue = inputObject[inputCustomMinHeight];
    }
    const scaleY = inputObject[inputHeightName] / (maxValue - minValue);
    const scaleX = inputObject[inputWidthName] / Math.max(1, points.length - 1);

    const graphics: PIXI.Graphics = new PIXI.Graphics();
    const selectedColor = parseValueAndAttachWarnings(
      this,
      new ColorType(),
      inputObject[inputColorName],
    );
    graphics.alpha = selectedColor.a;

    const fontSize = inputObject[inputShowValuesFontSize];
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: fontSize,
      whiteSpace: 'pre-line',
      wordWrap: true,
      wordWrapWidth: inputObject[inputWidthName],
      lineJoin: 'round',
    });

    if (inputObject[inputShouldShowAxis]) {
      graphics.lineStyle(
        inputObject[inputLineWidthName] * 0.5,
        TRgba.black().hexNumber(),
      );
      const samples = inputObject[inputAxisGranularity];
      for (let i = 0; i < samples; i++) {
        const ratio = i / Math.max(1, samples - 1);
        const currPos = inputObject[inputHeightName] * ratio;
        graphics.moveTo(-35, -currPos);
        graphics.lineTo(-25, -currPos);

        const basicText = new PIXI.Text(
          (ratio * (maxValue - minValue) + minValue).toPrecision(3),
          textStyle,
        );
        basicText.x = -40;
        basicText.y = -currPos - fontSize * 0.5 - 5;
        basicText.anchor.set(1, 0);
        graphics.addChild(basicText);
        if (inputObject[inputShouldShowAxisLines]) {
          graphics.lineTo(inputObject[inputWidthName], -currPos);
        }
      }
    }

    graphics.lineStyle(
      inputObject[inputLineWidthName],
      selectedColor.hexNumber(),
      selectedColor.a,
    );

    graphics.moveTo(0, (points[0].Value - minValue) * -scaleY);
    const placedPoints: PIXI.Point[] = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const scaledX = scaleX * i;
      const scaledY = (point.Value - minValue) * -scaleY;
      const prevPoint = points[Math.max(0, i - 1)];
      const prevPrevPoint = points[Math.max(i - 2, 0)];
      const nextPoint = points[Math.min(i + 1, points.length - 1)];
      placedPoints.push(new PIXI.Point(scaledX, scaledY));
      if (inputObject[inputShouldUseBezierCurve] && i > 0) {
        const scaledPrevX = scaleX * (i - 1);
        const scaledPrevY = (prevPoint.Value - minValue) * -scaleY;
        const scaledPrevPrevX = scaleX * Math.max(i - 2, 0);
        const scaledPrevPrevY = (prevPrevPoint.Value - minValue) * -scaleY;
        const scaledNextX = scaleX * (i + 1);
        const scaledNextY = (nextPoint.Value - minValue) * -scaleY;
        const prevTanX = (scaledPrevX - scaledPrevPrevX) * 0.07 + scaledPrevX;
        const prevTanY = (scaledPrevY - scaledPrevPrevY) * 0.07 + scaledPrevY;
        const nextTanX = (scaledNextX - scaledX) * -0.07 + scaledX;
        const nextTanY = (scaledNextY - scaledY) * -0.07 + scaledY;

        graphics.bezierCurveTo(
          prevTanX,
          prevTanY,
          nextTanX,
          nextTanY,
          scaledX,
          scaledY,
        );
      } else {
        graphics.lineTo(scaledX, scaledY);
      }
      if (inputObject[inputShouldShowValues]) {
        const basicText = new PIXI.Text(point.Value.toPrecision(2), textStyle);
        basicText.x = scaledX - fontSize * 0.5;
        basicText.y = scaledY - 30 - fontSize * 0.5;

        // if values only above, print below, otherwise above
        if (prevPoint > point && nextPoint > point) {
          basicText.y += 50;
        }
        graphics.addChild(basicText);
      }
      if (point.Name && inputObject[inputShowNames]) {
        const basicText = new PIXI.Text(point.Name, textStyle);
        basicText.x = scaledX - fontSize * 0.5;
        basicText.y = 30;
        graphics.addChild(basicText);
      }
    }
    if (inputObject[inputFillGraph]) {
      placedPoints.push(new PIXI.Point(inputObject[inputWidthName], 0));
      placedPoints.push(new PIXI.Point(0, 0));
      graphics.beginFill(selectedColor.hexNumber());
      graphics.drawPolygon(placedPoints);
      graphics.endFill();
    }

    this.positionAndScale(graphics, inputObject, offset);
    container.addChild(graphics);
  }
}

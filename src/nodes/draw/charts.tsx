import Socket from "../../classes/SocketClass";
import { SOCKET_TYPE } from "../../utils/constants";
import { ArrayType } from "../datatypes/arrayType";
import { NumberType } from "../datatypes/numberType";
import { DRAW_Base, injectedDataName } from "./draw";
import * as PIXI from 'pixi.js';
import { BooleanType } from "../datatypes/booleanType";
import { TRgba } from "../../utils/interfaces";
import { ColorType } from "../datatypes/colorType";

const inputPointsName = "Points";
const inputLabelsName = "Labels";
const inputHeightName = "Height";
const inputWidthName = "Width";
const inputAutoScaleHeight = "Auto scale";
const inputCustomMinHeight = "Custom min height";
const inputCustomMaxHeight = "Custom max height";
const inputShouldUseBezierCurve = "Bezier curve";
const inputShouldShowAxis = "Show axis";
const inputShouldShowAxisLines = "Show axis lines";
const inputAxisGranularity = "Axis granularity";
const inputShouldShowValues = "Show values";
const inputShowValuesFontSize = "Font size";
const inputColorName = "Color";
const inputLineWidthName = "Line Width";

export class GRAPH_LINE extends DRAW_Base {
  public getName(): string {
    return "Draw Line Graph"
  }
  public getDescription(): string {
    return "Draws a line graph based on input points and optional labels"
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        inputPointsName,
        new ArrayType(),
        [0, 1, 5, 10, 7]
      ),
      new Socket(SOCKET_TYPE.IN, inputLabelsName, new ArrayType(), ["First", "Second", "Another"]),
      new Socket(
        SOCKET_TYPE.IN,
        inputWidthName,
        new NumberType(false, 1, 1000),
        400
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputHeightName,
        new NumberType(false, 1, 1000),
        200
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputLineWidthName,
        new NumberType(false, 1, 10),
        2
      ),
      new Socket(SOCKET_TYPE.IN, inputAutoScaleHeight, new BooleanType(), true, false),
      new Socket(SOCKET_TYPE.IN, inputCustomMinHeight, new NumberType(false, -100, 100), 0, false),
      new Socket(SOCKET_TYPE.IN, inputCustomMaxHeight, new NumberType(false, 0, 100), 1, false),
      new Socket(SOCKET_TYPE.IN, inputShouldUseBezierCurve, new BooleanType(), true, false),
      new Socket(SOCKET_TYPE.IN, inputShouldShowAxis, new BooleanType(), true, false),
      new Socket(SOCKET_TYPE.IN, inputShouldShowAxisLines, new BooleanType(), false, false),
      new Socket(SOCKET_TYPE.IN, inputAxisGranularity, new NumberType(true, 1, 10), 3, false),
      new Socket(SOCKET_TYPE.IN, inputShouldShowValues, new BooleanType(), true, false),
      new Socket(SOCKET_TYPE.IN, inputShowValuesFontSize, new NumberType(), 12, false),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType())
    ].concat(super.getDefaultIO());
  }

  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number }
  ): void {
    inputObject = {
      ...inputObject,
      ...inputObject[injectedDataName][
      this.getAndIncrementExecutions(executions)
      ],
    };

    const points: number[] = inputObject[inputPointsName];
    let maxValue = points.reduce((prevMax, point) => Math.max(prevMax, point));
    let minValue = points.reduce((prevMax, point) => Math.min(prevMax, point));
    if (!inputObject[inputAutoScaleHeight]) {
      maxValue = inputObject[inputCustomMaxHeight];
      minValue = inputObject[inputCustomMinHeight];

    }
    const scaleY = inputObject[inputHeightName] / (maxValue - minValue);
    const scaleX = inputObject[inputWidthName] / Math.max(1, (points.length - 1));

    const graphics: PIXI.Graphics = new PIXI.Graphics();
    const selectedColor: TRgba = new ColorType().parse(
      inputObject[inputColorName]
    );
    graphics.beginFill(selectedColor.hexNumber());
    graphics.endFill();

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
      graphics.lineStyle(inputObject[inputLineWidthName] * 0.5, TRgba.black().hexNumber());
      const samples = inputObject[inputAxisGranularity];
      for (let i = 0; i < samples; i++) {
        const ratio = i / (Math.max(1, samples - 1));
        const currPos = inputObject[inputHeightName] * ratio;
        graphics.moveTo(-35, -currPos);
        graphics.lineTo(-25, -currPos);

        const basicText = new PIXI.Text((ratio * (maxValue - minValue) + minValue).toPrecision(2), textStyle);
        basicText.x = - 60 - fontSize * 0.5;
        basicText.y = -currPos - fontSize * 0.5 - 5;
        graphics.addChild(basicText);
        if (inputObject[inputShouldShowAxisLines]) {
          graphics.lineTo(inputObject[inputWidthName], -currPos);
        }
      }
    }

    graphics.lineStyle(inputObject[inputLineWidthName], selectedColor.hexNumber());

    graphics.moveTo(0, (points[0] - minValue) * -scaleY)
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const scaledX = scaleX * i;
      const scaledY = (point - minValue) * -scaleY;
      const prevPoint = points[Math.max(0, i - 1)];
      const prevPrevPoint = points[Math.max(i - 2, 0)];
      const nextPoint = points[Math.min(i + 1, points.length - 1)];
      const nextNextPoint = points[Math.min(i + 2, points.length - 1)];
      if (inputObject[inputShouldUseBezierCurve] && i > 0) {

        const scaledPrevX = scaleX * (i - 1);
        const scaledPrevY = (prevPoint - minValue) * -scaleY;
        const scaledPrevPrevX = scaleX * (Math.max(i - 2, 0));
        const scaledPrevPrevY = (prevPrevPoint - minValue) * -scaleY;
        const scaledNextX = scaleX * (i + 1);
        const scaledNextY = (nextPoint - minValue) * -scaleY;
        const scaledNextNextX = scaleX * (i + 2);
        const scaledNextNextY = (nextNextPoint - minValue) * -scaleY;
        const prevTanX = (scaledPrevX - scaledPrevPrevX) * 0.07 + scaledPrevX;
        const prevTanY = (scaledPrevY - scaledPrevPrevY) * 0.07 + scaledPrevY;
        const nextTanX = (scaledNextX - scaledX) * -0.07 + scaledX;
        const nextTanY = (scaledNextY - scaledY) * -0.07 + scaledY;
        const midP1X = (scaledX + scaledPrevX) * 0.5;
        const midP1Y = (scaledY + scaledPrevY) * 0.5;
        const midP2X = (scaledX + scaledNextX) * 0.5;
        const midP2Y = (scaledY + scaledNextY) * 0.5;
        graphics.bezierCurveTo(prevTanX, prevTanY, nextTanX, nextTanY, scaledX, scaledY);
      } else {
        graphics.lineTo(scaleX * i, (point - minValue) * -scaleY)
      }
      if (inputObject[inputShouldShowValues]) {

        const basicText = new PIXI.Text(point.toString(), textStyle);
        basicText.x = scaledX - fontSize * 0.5;
        basicText.y = scaledY - 30 - fontSize * 0.5;

        // if values only above, print below, otherwise above
        if (prevPoint > point && nextPoint > point) {
          basicText.y += 50;
        }
        graphics.addChild(basicText);
      }
      if (inputObject[inputLabelsName][i]) {
        const basicText = new PIXI.Text(inputObject[inputLabelsName][i], textStyle);
        basicText.x = scaledX - fontSize * 0.5;
        basicText.y = 10;
        graphics.addChild(basicText);

      }
    }


    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);

  }

}
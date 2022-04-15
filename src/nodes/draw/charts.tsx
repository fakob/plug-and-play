import { DRAW_Base } from "./draw";

export class GRAPH_LINE extends DRAW_Base {


}


/*export class DRAW_Shape extends DRAW_Base {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.DRAW),
    });

    this.name = 'Draw shape object';
    this.description = 'Draws a circle, rectangle or rounded rectangle';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        inputShapeName,
        new EnumType(availableShapes),
        'Circle'
      ),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType()),
      new Socket(
        SOCKET_TYPE.IN,
        inputWidthName,
        new NumberType(false, 1, 1000),
        200
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputHeightName,
        new NumberType(false, 1, 1000),
        200
      ),
      new Socket(SOCKET_TYPE.IN, inputBorderName, new BooleanType(), false),
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
    const graphics: PIXI.Graphics = new PIXI.Graphics();
    const selectedColor: TRgba = new ColorType().parse(
      inputObject[inputColorName]
    );
    const drawBorder = inputObject[inputBorderName];
    graphics.beginFill(selectedColor.hexNumber());
    graphics.lineStyle(
      drawBorder ? 3 : 0,
      selectedColor.multiply(0.7).hexNumber()
    );

    const shapeEnum = inputObject[inputShapeName];
    switch (shapeEnum) {
      case 'Circle': {
        graphics.drawCircle(
          inputObject[inputWidthName] / 2,
          inputObject[inputWidthName] / 2,
          inputObject[inputWidthName] / 2
        );
        break;
      }
      case 'Rectangle': {
        graphics.drawRect(
          0,
          0,
          inputObject[inputWidthName],
          inputObject[inputHeightName]
        );
        break;
      }
      case 'Rounded Rectangle': {
        graphics.drawRoundedRect(
          0,
          0,
          inputObject[inputWidthName],
          inputObject[inputHeightName],
          inputObject[inputWidthName] * 0.1
        );
        break;
      }
      case 'Ellipse': {
        graphics.drawEllipse(
          inputObject[inputWidthName] / 2,
          inputObject[inputHeightName] / 2,
          inputObject[inputWidthName] / 2,
          inputObject[inputHeightName] / 2
        );
        break;
      }
    }
    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}*/
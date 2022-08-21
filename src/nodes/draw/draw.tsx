/* eslint-disable @typescript-eslint/no-empty-function */
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  COLOR_WHITE,
  NODE_TYPE_COLOR,
  NOTE_LINEHEIGHT_FACTOR,
  PIXI_PIVOT_OPTIONS,
  SOCKET_TYPE,
} from '../../utils/constants';
import { DeferredPixiType } from '../datatypes/deferredPixiType';
import { EnumStructure, EnumType } from '../datatypes/enumType';
import * as PIXI from 'pixi.js';
import { ColorType } from '../datatypes/colorType';
import { NumberType } from '../datatypes/numberType';
import { BooleanType } from '../datatypes/booleanType';
import { ArrayType } from '../datatypes/arrayType';
import { StringType } from '../datatypes/stringType';
import { ImageType } from '../datatypes/imageType';
import { TRgba } from '../../utils/interfaces';
import { DisplayObject } from 'pixi.js';

const availableShapes: EnumStructure = [
  {
    text: 'Circle',
    value: 'Circle',
  },
  {
    text: 'Rectangle',
    value: 'Rectangle',
  },
  {
    text: 'Rounded Rectangle',
    value: 'Rounded Rectangle',
  },
  {
    text: 'Ellipse',
    value: 'Ellipse',
  },
];

export const inputXName = 'Offset X';
export const inputYName = 'Offset Y';
export const scaleXName = 'Scale X';
export const scaleYName = 'Scale Y';
export const inputRotationName = 'Rotation';
export const inputPivotName = 'Pivot';

const inputShapeName = 'Shape';
const inputColorName = 'Color';
const inputSizeName = 'Size';
const inputBorderName = 'Border';
const outputPixiName = 'Graphics';
const outputImageName = 'Image';
const outputQualityName = 'Quality';

const inputCombineArray = 'GraphicsArray';
const inputCombine1Name = 'Foreground';
const inputCombine2Name = 'Background';
const outputMultiplierIndex = 'LatestPressedIndex';
const outputMultiplierInjected = 'LastPressedInjected';
const outputMultiplierPointerDown = 'PointerDown';

const inputTextName = 'Text';
const inputLineHeightName = 'Line Height';
export const inputWidthName = 'Width';
export const inputHeightName = 'Height';

const inputGraphicsName = 'Graphics';
const totalNumberName = 'Total Number';
const multiplyYName = 'Number Per Column';
const numberPerColumnRow = 'Number Per Column/Row';
const drawingOrder = 'Change Column/Row drawing order';
const spacingXName = 'Spacing X';
const spacingYName = 'Spacing Y';
export const injectedDataName = 'Injected Data';

const inputImageName = 'Image';

const inputPointsName = 'Points';

// a PIXI draw node is a pure node that also draws its graphics if graphics at the end
export abstract class DRAW_Base extends PPNode {
  deferredGraphics: PIXI.Container;

  public getDescription(): string {
    return 'Draw Base';
  }
  public getName(): string {
    return 'Draw';
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.DRAW);
  }

  onNodeRemoved = (): void => {
    const canvas = PPGraph.currentGraph.backgroundCanvas;

    canvas.removeChild(this.deferredGraphics);
  };

  // you probably want to maintain this output in children
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        inputXName,
        new NumberType(false, -500, 500),
        0,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputYName,
        new NumberType(false, -500, 500),
        0,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        scaleXName,
        new NumberType(false, 0.01, 10),
        1,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        scaleYName,
        new NumberType(false, 0.01, 10),
        1,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputRotationName,
        new NumberType(false, -3.14159, 3.14159),
        0,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputPivotName,
        new EnumType(PIXI_PIVOT_OPTIONS),
        PIXI_PIVOT_OPTIONS[0].text,
        false
      ),
      new Socket(SOCKET_TYPE.IN, injectedDataName, new ArrayType(), {}, true),
      new Socket(SOCKET_TYPE.OUT, outputPixiName, new DeferredPixiType()),
    ];
  }

  // if you are a child you likely want to use this instead of normal execute
  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number }
  ): void {}

  getAndIncrementExecutions(executions: { string: number }): number {
    if (executions[this.id] === undefined) {
      executions[this.id] = 0;
    }
    return executions[this.id]++;
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const drawingFunction = (container, executions) =>
      this.drawOnContainer(inputObject, container, executions);
    outputObject[outputPixiName] = drawingFunction;
    this.handleDrawing(drawingFunction);
  }

  protected shouldDraw(): boolean {
    return !this.getOutputSocketByName(outputPixiName).hasLink();
  }

  handleDrawing(drawingFunction: any): void {
    this.removeChild(this.deferredGraphics);
    if (this.shouldDraw()) {
      this.deferredGraphics = new PIXI.Container();
      this.deferredGraphics.x = 400;
      this.deferredGraphics.y = 0;
      drawingFunction(this.deferredGraphics, {});
      this.addChild(this.deferredGraphics);
    }
  }

  protected positionAndScale(toModify: DisplayObject, inputObject: any): void {
    const pivotPoint = PIXI_PIVOT_OPTIONS.find(
      (item) => item.text === inputObject[inputPivotName]
    ).value;

    toModify.setTransform(
      inputObject[inputXName],
      inputObject[inputYName],
      inputObject[scaleXName],
      inputObject[scaleYName],
      inputObject[inputRotationName]
    );
    toModify.pivot.x = pivotPoint.x * toModify.getBounds().width;
    toModify.pivot.y = pivotPoint.y * toModify.getBounds().height;
  }

  public outputPlugged(): void {
    this.executeOptimizedChain();
  }
  public outputUnplugged(): void {
    this.executeOptimizedChain();
  }
}
export class DRAW_Shape extends DRAW_Base {
  public getDescription(): string {
    return 'Draws a shape';
  }
  public getName(): string {
    return 'Draw shape';
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
    const width = inputObject[inputWidthName];
    const height = inputObject[inputHeightName];
    if (Number.isFinite(width) && Number.isFinite(height)) {
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
          graphics.drawCircle(width / 2, width / 2, width / 2);
          break;
        }
        case 'Rectangle': {
          graphics.drawRect(0, 0, width, height);
          break;
        }
        case 'Rounded Rectangle': {
          graphics.drawRoundedRect(0, 0, width, height, width * 0.1);
          break;
        }
        case 'Ellipse': {
          graphics.drawEllipse(width / 2, height / 2, width / 2, height / 2);
          break;
        }
      }
      this.positionAndScale(graphics, inputObject);
      container.addChild(graphics);
    } else {
      throw new Error('The value for width or height is invalid.');
    }
  }
}

export class DRAW_Text extends DRAW_Base {
  public getDescription(): string {
    return 'Draws text object';
  }
  public getName(): string {
    return 'Draw text';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        inputTextName,
        new StringType(),
        'ExampleText'
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputSizeName,
        new NumberType(true, 1, 100),
        24
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputLineHeightName,
        new NumberType(true, 1, 100),
        18
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputWidthName,
        new NumberType(true, 0, 1000),
        0
      ),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType()),
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
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: inputObject[inputSizeName],
      lineHeight: inputObject[inputLineHeightName] * NOTE_LINEHEIGHT_FACTOR,
      whiteSpace: 'pre-line',
      wordWrap: true,
      wordWrapWidth: inputObject[inputWidthName],
      lineJoin: 'round',
    });
    const basicText = new PIXI.Text(inputObject[inputTextName], textStyle);
    basicText.style.fill = new ColorType()
      .parse(inputObject[inputColorName])
      .hex();

    this.positionAndScale(basicText, inputObject);
    container.addChild(basicText);
  }
}

export class DRAW_Combine extends DRAW_Base {
  public getDescription(): string {
    return 'Combines two drawn objects';
  }
  public getName(): string {
    return 'Combine objects';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputCombine1Name, new DeferredPixiType()),
      new Socket(SOCKET_TYPE.IN, inputCombine2Name, new DeferredPixiType()),
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
    const myContainer = new PIXI.Container();

    inputObject[inputCombine2Name](myContainer, executions);
    inputObject[inputCombine1Name](myContainer, executions);

    this.positionAndScale(myContainer, inputObject);

    myContainer.interactive = true;

    container.addChild(myContainer);
  }
}
export class DRAW_COMBINE_ARRAY extends DRAW_Base {
  public getDescription(): string {
    return 'Combines an array of draw objects';
  }
  public getName(): string {
    return 'Combine draw array';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputCombineArray, new ArrayType()),
      new Socket(
        SOCKET_TYPE.IN,
        multiplyYName,
        new NumberType(true, 0, 100),
        2
      ),
      new Socket(
        SOCKET_TYPE.IN,
        spacingXName,
        new NumberType(true, 0, 1000),
        400
      ),
      new Socket(
        SOCKET_TYPE.IN,
        spacingYName,
        new NumberType(true, 0, 1000),
        300
      ),
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
    const myContainer = new PIXI.Container();
    const graphicsArray = inputObject[inputCombineArray];
    for (let i = graphicsArray.length - 1; i >= 0; i--) {
      const x = Math.floor(i / inputObject[multiplyYName]);
      const y = i % inputObject[multiplyYName];
      const shallowContainer = new PIXI.Container();
      graphicsArray[i](shallowContainer, executions);
      shallowContainer.x = x * inputObject[spacingXName];
      shallowContainer.y = y * inputObject[spacingYName];
      myContainer.addChild(shallowContainer);
    }

    this.positionAndScale(myContainer, inputObject);

    myContainer.interactive = true;

    container.addChild(myContainer);
  }
}

export class DRAW_Multiplier extends DRAW_Base {
  public getDescription(): string {
    return 'Multiples a drawing objects onto a grid';
  }
  public getName(): string {
    return 'Multiply object';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputGraphicsName, new DeferredPixiType()),
      new Socket(
        SOCKET_TYPE.IN,
        totalNumberName,
        new NumberType(true, 0, 100),
        2
      ),
      new Socket(
        SOCKET_TYPE.IN,
        numberPerColumnRow,
        new NumberType(true, 1, 100),
        2
      ),
      new Socket(SOCKET_TYPE.IN, drawingOrder, new BooleanType(), 2),
      new Socket(
        SOCKET_TYPE.IN,
        spacingXName,
        new NumberType(true, 0, 1000),
        400
      ),
      new Socket(
        SOCKET_TYPE.IN,
        spacingYName,
        new NumberType(true, 0, 1000),
        300
      ),
      new Socket(SOCKET_TYPE.OUT, outputMultiplierIndex, new NumberType(true)),
      new Socket(SOCKET_TYPE.OUT, outputMultiplierInjected, new ArrayType()),
      new Socket(
        SOCKET_TYPE.OUT,
        outputMultiplierPointerDown,
        new BooleanType()
      ),
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
    const myContainer = new PIXI.Container();
    const total = inputObject[totalNumberName];
    const changeDrawingOrder = inputObject[drawingOrder];
    const numJ = Math.max(1, inputObject[numberPerColumnRow]);
    const numI = Math.ceil(total / numJ);
    let numPlaced = 0;

    for (let i = 0; i < numI; i++) {
      for (let j = 0; j < numJ && numPlaced < total; j++, numPlaced++) {
        const currentIndex = numPlaced;
        const x = changeDrawingOrder ? j : i;
        const y = changeDrawingOrder ? i : j;

        const shallowContainer = new PIXI.Container();
        if (inputObject[inputGraphicsName])
          inputObject[inputGraphicsName](shallowContainer, executions);
        shallowContainer.x = x * inputObject[spacingXName];
        shallowContainer.y = y * inputObject[spacingYName];

        shallowContainer.interactive = true;
        const alphaPre = shallowContainer.alpha;
        const scalePreX = shallowContainer.scale.x;
        const scalePreY = shallowContainer.scale.y;
        shallowContainer.on('pointerdown', (e) => {
          this.setOutputData(outputMultiplierIndex, currentIndex);
          this.setOutputData(outputMultiplierInjected, executions);
          this.setOutputData(outputMultiplierPointerDown, true);
          // tell all children when something is pressed
          this.executeChildren();
          console.log('pressed: ' + x + ' : ' + y);
          shallowContainer.scale.x *= 0.97;
          shallowContainer.scale.y *= 0.97;
          shallowContainer.alpha = alphaPre * 0.8;
        });

        shallowContainer.on('pointerup', (e) => {
          this.setOutputData(outputMultiplierPointerDown, false);
          this.executeChildren();
          shallowContainer.alpha = alphaPre;
          shallowContainer.scale.x = scalePreX;
          shallowContainer.scale.y = scalePreY;
        });

        myContainer.addChild(shallowContainer);
      }
    }
    this.positionAndScale(myContainer, inputObject);
    myContainer.interactive = true;
    myContainer.on('pointerdown', (e) => {
      console.log('im pressed');
    });
    container.addChild(myContainer);
  }
}

export class DRAW_Image extends DRAW_Base {
  public getDescription(): string {
    return 'Draws an image object (jpg,png)';
  }
  public getName(): string {
    return 'Draw image';
  }

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, inputImageName, new ImageType())].concat(
      super.getDefaultIO()
    );
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

    const image = PIXI.Texture.from(inputObject[inputImageName]);
    const sprite = new PIXI.Sprite(image);
    this.positionAndScale(sprite, inputObject);

    container.addChild(sprite);
  }
}

export class DRAW_Line extends DRAW_Base {
  public getDescription(): string {
    return 'Draws a line specified by input points';
  }

  public getName(): string {
    return 'Draw line';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputPointsName, new ArrayType(), [
        [0, 0],
        [100, 100],
        [100, 200],
      ]),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType()),
      new Socket(
        SOCKET_TYPE.IN,
        inputWidthName,
        new NumberType(false, 1, 10),
        3
      ),
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
    graphics.endFill();
    graphics.lineStyle(inputObject[inputWidthName], selectedColor.hexNumber());
    const points: number[][] = inputObject[inputPointsName];
    graphics.moveTo(points[0][0], points[0][1]);
    points.forEach((point, index) => graphics.lineTo(point[0], point[1]));

    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

export class Export_Image_From_Graphics extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, outputPixiName, new DeferredPixiType()),
      new Socket(
        SOCKET_TYPE.IN,
        outputQualityName,
        new NumberType(false, 0, 1),
        0.92
      ),
      new Socket(SOCKET_TYPE.OUT, outputImageName, new ImageType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const newContainer = new PIXI.Container();
    inputObject[outputPixiName](newContainer, {});
    this.addChild(newContainer);
    const base64out = PPGraph.currentGraph.app.renderer.plugins.extract.image(
      newContainer,
      'image/jpeg',
      inputObject[outputQualityName]
    );
    outputObject[outputImageName] = base64out;
    this.removeChild(newContainer);
  }
}

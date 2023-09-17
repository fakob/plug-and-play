/* eslint-disable @typescript-eslint/no-empty-function */
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  IMAGE_TYPES,
  NOTE_LINEHEIGHT_FACTOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import { DeferredPixiType } from '../datatypes/deferredPixiType';
import { EnumStructure, EnumType } from '../datatypes/enumType';
import * as PIXI from 'pixi.js';
import { ColorType } from '../datatypes/colorType';
import { NumberType } from '../datatypes/numberType';
import { BooleanType } from '../datatypes/booleanType';
import { ArrayType } from '../datatypes/arrayType';
import { TriggerType } from '../datatypes/triggerType';
import { StringType } from '../datatypes/stringType';
import { ImageType } from '../datatypes/imageType';
import { saveBase64AsImage } from '../../utils/utils';
import { TRgba } from '../../utils/interfaces';
import { drawDottedLine } from '../../pixi/utils-pixi';
import {
  DRAW_Base,
  DRAW_Interactive_Base,
  injectedDataName,
  outputMultiplierIndex,
  outputMultiplierInjected,
  outputMultiplierPointerDown,
  outputPixiName,
} from './abstract';

const availableShapes: EnumStructure = [
  {
    text: 'Circle',
  },
  {
    text: 'Rectangle',
  },
  {
    text: 'Rounded Rectangle',
  },
  {
    text: 'Ellipse',
  },
];

const inputShapeName = 'Shape';
const inputColorName = 'Color';
const inputSizeName = 'Size';
const inputBorderName = 'Border';
const outputImageName = 'Image';
const outputQualityName = 'Quality';
const outputTypeyName = 'Type';

const inputDottedName = 'Dotted';
const inputDottedIntervalName = 'Dot Interval';

const inputCombineArray = 'GraphicsArray';
const inputCombine1Name = 'Foreground';
const inputCombine2Name = 'Background';

const inputTextName = 'Text';
const inputLineHeightName = 'Line Height';
export const inputWidthName = 'Width';
export const inputHeightName = 'Height';

const inputGraphicsName = 'Graphics';
const totalNumberName = 'Total Number';
const numberPerColumnRow = 'Number Per Column/Row';
const drawingOrder = 'Change Column/Row drawing order';
const spacingXName = 'Spacing X';
const spacingYName = 'Spacing Y';

const inputImageName = 'Image';
const imageExport = 'Save image';

const inputPointsName = 'Points';

const outputPixelArray = 'Color array';
const outputGrayscaleArray = 'Grayscale array';

const addShallowContainerEventListeners = (
  shallowContainer: PIXI.Container,
  node: PPNode,
  index: number,
  executions: { string: number },
) => {
  shallowContainer.eventMode = 'dynamic';
  const alphaPre = shallowContainer.alpha;
  const scalePreX = shallowContainer.scale.x;
  const scalePreY = shallowContainer.scale.y;

  shallowContainer.addEventListener('pointerdown', (e) => {
    node.setOutputData(outputMultiplierIndex, index);
    node.setOutputData(
      outputMultiplierInjected,
      node.getInputData(injectedDataName)?.[index],
    );
    node.setOutputData(outputMultiplierPointerDown, true);
    // tell all children when something is pressed
    node.executeChildren();
    console.log('pressed: ' + shallowContainer.x + ' : ' + shallowContainer.y);
    shallowContainer.alpha = alphaPre * 0.6;
  });

  shallowContainer.addEventListener('pointerup', (e) => {
    node.setOutputData(outputMultiplierPointerDown, false);
    node.executeChildren();
    shallowContainer.alpha = alphaPre;
    shallowContainer.scale.x = scalePreX;
    shallowContainer.scale.y = scalePreY;
  });
};

// a PIXI draw node is a pure node that also draws its graphics if graphics at the end
export class DRAW_Shape extends DRAW_Base {
  public getName(): string {
    return 'Draw shape';
  }

  public getDescription(): string {
    return 'Draws a shape';
  }

  public hasExample(): boolean {
    return true;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        inputShapeName,
        new EnumType(availableShapes),
        'Circle',
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputColorName,
        new ColorType(),
        TRgba.randomColor(),
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputWidthName,
        new NumberType(true, 1, 1000),
        200,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputHeightName,
        new NumberType(true, 1, 1000),
        200,
      ),
      new Socket(SOCKET_TYPE.IN, inputBorderName, new BooleanType(), false),
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
    const width = inputObject[inputWidthName];
    const height = inputObject[inputHeightName];
    if (Number.isFinite(width) && Number.isFinite(height)) {
      const graphics: PIXI.Graphics = new PIXI.Graphics();
      const selectedColor: TRgba = new ColorType().parse(
        inputObject[inputColorName],
      );
      const drawBorder = inputObject[inputBorderName];
      graphics.beginFill(selectedColor.hexNumber());
      graphics.alpha = selectedColor.a;
      graphics.lineStyle(
        drawBorder ? 3 : 0,
        selectedColor.multiply(0.7).hexNumber(),
      );

      const shapeEnum = inputObject[inputShapeName];
      switch (shapeEnum) {
        case 'Circle': {
          graphics.drawCircle(width / 2, -width / 2, width / 2);
          break;
        }
        case 'Rectangle': {
          graphics.drawRect(0, -height, width, height);
          break;
        }
        case 'Rounded Rectangle': {
          graphics.drawRoundedRect(0, -height, width, height, width * 0.1);
          break;
        }
        case 'Ellipse': {
          graphics.drawEllipse(width / 2, -height / 2, width / 2, height / 2);
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

export class DRAW_Passthrough extends DRAW_Base {
  public getName(): string {
    return 'Draw Passthrough';
  }

  public getDescription(): string {
    return 'Draws input draw object';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputGraphicsName, new DeferredPixiType()),
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
    const myContainer = new PIXI.Container();
    inputObject[inputGraphicsName](myContainer, executions);
    this.positionAndScale(myContainer, inputObject);
    container.addChild(myContainer);
  }
}

export class DRAW_Text extends DRAW_Base {
  public getName(): string {
    return 'Draw text';
  }

  public getDescription(): string {
    return 'Draws text object';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        inputTextName,
        new StringType(),
        'ExampleText',
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputSizeName,
        new NumberType(true, 1, 100),
        24,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputLineHeightName,
        new NumberType(true, 1, 100),
        18,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputWidthName,
        new NumberType(true, 0, 2000),
        1000,
      ),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType()),
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
  public getName(): string {
    return 'Combine objects';
  }

  public getDescription(): string {
    return 'Combines two drawn objects';
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
    executions: { string: number },
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

    myContainer.eventMode = 'dynamic';

    container.addChild(myContainer);
  }
}
export class DRAW_COMBINE_ARRAY extends DRAW_Interactive_Base {
  public getName(): string {
    return 'Combine draw array';
  }

  public getDescription(): string {
    return 'Combines an array of draw objects';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputCombineArray, new ArrayType()),
      new Socket(
        SOCKET_TYPE.IN,
        numberPerColumnRow,
        new NumberType(true, 0, 100),
        2,
      ),
      new Socket(SOCKET_TYPE.IN, drawingOrder, new BooleanType(), true),
      new Socket(
        SOCKET_TYPE.IN,
        spacingXName,
        new NumberType(true, 0, 1000),
        400,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        spacingYName,
        new NumberType(true, 0, 1000),
        300,
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
    const myContainer = new PIXI.Container();
    const graphicsArray = inputObject[inputCombineArray];
    const changeDrawingOrder = inputObject[drawingOrder];
    for (let i = graphicsArray.length - 1; i >= 0; i--) {
      const r = Math.floor(i / inputObject[numberPerColumnRow]);
      const s = i % inputObject[numberPerColumnRow];
      const x = changeDrawingOrder ? s : r;
      const y = changeDrawingOrder ? r : s;
      const shallowContainer = new PIXI.Container();
      if (typeof graphicsArray[i] == 'function') {
        graphicsArray[i](shallowContainer, executions);
      }
      shallowContainer.x = x * inputObject[spacingXName];
      shallowContainer.y = y * inputObject[spacingYName];

      addShallowContainerEventListeners(shallowContainer, this, i, executions);

      myContainer.addChild(shallowContainer);
    }

    this.positionAndScale(myContainer, inputObject);

    myContainer.eventMode = 'dynamic';

    container.addChild(myContainer);
  }
}

export class DRAW_Multiplier extends DRAW_Interactive_Base {
  public getName(): string {
    return 'Multiply object';
  }

  public getDescription(): string {
    return 'Multiples a drawn object onto a grid';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputGraphicsName, new DeferredPixiType()),
      new Socket(
        SOCKET_TYPE.IN,
        totalNumberName,
        new NumberType(true, 0, 100),
        2,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        numberPerColumnRow,
        new NumberType(true, 1, 100),
        2,
      ),
      new Socket(SOCKET_TYPE.IN, drawingOrder, new BooleanType(), true),
      new Socket(
        SOCKET_TYPE.IN,
        spacingXName,
        new NumberType(true, 0, 1000),
        400,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        spacingYName,
        new NumberType(true, 0, 1000),
        300,
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
    const myContainer = new PIXI.Container();
    const total = inputObject[totalNumberName];
    const changeDrawingOrder = inputObject[drawingOrder];

    for (let i = total - 1; i >= 0; i--) {
      const r = Math.floor(i / inputObject[numberPerColumnRow]);
      const s = i % inputObject[numberPerColumnRow];
      const x = changeDrawingOrder ? s : r;
      const y = changeDrawingOrder ? r : s;

      const shallowContainer = new PIXI.Container();
      if (inputObject[inputGraphicsName])
        inputObject[inputGraphicsName](shallowContainer, executions);
      shallowContainer.x = x * inputObject[spacingXName];
      shallowContainer.y = y * inputObject[spacingYName];

      addShallowContainerEventListeners(shallowContainer, this, i, executions);

      myContainer.addChild(shallowContainer);
    }

    this.positionAndScale(myContainer, inputObject);
    myContainer.eventMode = 'dynamic';
    myContainer.addEventListener('pointerdown', (e) => {
      console.log('im pressed');
    });
    container.addChild(myContainer);
  }
}

export class DRAW_Multipy_Along extends DRAW_Interactive_Base {
  public getName(): string {
    return 'Multiply onto points';
  }

  public getDescription(): string {
    return 'Multiples a drawn object onto points';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputGraphicsName, new DeferredPixiType()),
      new Socket(SOCKET_TYPE.IN, inputPointsName, new ArrayType()),
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
    const myContainer = new PIXI.Container();
    inputObject[inputPointsName].forEach((points, i) => {
      const x = points[0];
      const y = points[1];
      const shallowContainer = new PIXI.Container();
      if (inputObject[inputGraphicsName])
        inputObject[inputGraphicsName](shallowContainer, executions);
      shallowContainer.x = x;
      shallowContainer.y = y;

      addShallowContainerEventListeners(shallowContainer, this, i, executions);

      myContainer.addChild(shallowContainer);
    });

    container.addChild(myContainer);
  }
}

export class DRAW_Image extends DRAW_Base {
  public getName(): string {
    return 'Draw image';
  }

  public getDescription(): string {
    return 'Draws an image object (jpg,png)';
  }

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, inputImageName, new ImageType())].concat(
      super.getDefaultIO(),
    );
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

    const image = PIXI.Texture.from(inputObject[inputImageName]);
    const sprite = new PIXI.Sprite(image);
    this.positionAndScale(sprite, inputObject);

    container.addChild(sprite);
  }
}

export class DRAW_Line extends DRAW_Base {
  public getName(): string {
    return 'Draw line';
  }

  public getDescription(): string {
    return 'Draws a line specified by input points';
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
        3,
      ),
      new Socket(SOCKET_TYPE.IN, inputDottedName, new BooleanType(), true),
      new Socket(
        SOCKET_TYPE.IN,
        inputDottedIntervalName,
        new NumberType(true, 2, 100),
        10,
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
    const graphics: PIXI.Graphics = new PIXI.Graphics();
    const selectedColor: TRgba = new ColorType().parse(
      inputObject[inputColorName],
    );
    graphics.endFill();
    graphics.lineStyle(inputObject[inputWidthName], selectedColor.hexNumber());
    const points: number[][] = inputObject[inputPointsName];
    if (points.length < 2) {
      return;
    }
    graphics.moveTo(points[0][0], points[0][1]);
    let lastX = points[0][0];
    let lastY = points[0][1];
    points.forEach((point, index) => {
      if (inputObject[inputDottedName]) {
        const nextX = point[0];
        const nextY = point[1];
        drawDottedLine(
          graphics,
          lastX,
          lastY,
          nextX,
          nextY,
          inputObject[inputDottedIntervalName],
        );
        lastX = nextX;
        lastY = nextY;
      }
      graphics.lineTo(point[0], point[1]);
    });

    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

export class DRAW_Polygon extends DRAW_Base {
  public getName(): string {
    return 'Draw polygon';
  }

  public getDescription(): string {
    return 'Draws a polygon based on input points';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputPointsName, new ArrayType(), [
        [0, 0],
        [100, 100],
        [100, 200],
      ]),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType()),
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
    const graphics: PIXI.Graphics = new PIXI.Graphics();
    const selectedColor: TRgba = new ColorType().parse(
      inputObject[inputColorName],
    );
    graphics.beginFill(selectedColor.hexNumber());
    graphics.alpha = selectedColor.a;

    const points: [number, number][] = inputObject[inputPointsName];
    graphics.drawPolygon(points.map((p) => new PIXI.Point(p[0], p[1])));
    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

export class Extract_Image_From_Graphics extends PPNode {
  public getName(): string {
    return 'Get image from graphic';
  }

  public getDescription(): string {
    return 'Create image from a graphic and save it';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, outputPixiName, new DeferredPixiType()),
      new Socket(
        SOCKET_TYPE.IN,
        outputTypeyName,
        new EnumType(IMAGE_TYPES),
        IMAGE_TYPES[0].text,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        outputQualityName,
        new NumberType(false, 0, 1),
        0.92,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        imageExport,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'saveImage'),
        0,
        false,
      ),
      new Socket(SOCKET_TYPE.OUT, outputImageName, new ImageType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const newContainer = new PIXI.Container();
    inputObject[outputPixiName](newContainer, {});
    this.addChild(newContainer);
    const base64out = await (
      PPGraph.currentGraph.app.renderer as PIXI.Renderer
    ).extract.base64(
      newContainer,
      inputObject[outputTypeyName],
      inputObject[outputQualityName],
    );
    outputObject[outputImageName] = base64out;
    this.removeChild(newContainer);
  }

  saveImage = async () => {
    const base64 = this.getOutputData(outputImageName);
    saveBase64AsImage(base64, this.name);
  };
}

export class Extract_PixelArray_From_Graphics extends PPNode {
  public getName(): string {
    return 'Get pixel array from graphic';
  }

  public getDescription(): string {
    return 'Get the color and grayscale values from a graphic';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, outputPixiName, new DeferredPixiType()),
      new Socket(SOCKET_TYPE.OUT, outputPixelArray, new ArrayType()),
      new Socket(
        SOCKET_TYPE.OUT,
        outputGrayscaleArray,
        new ArrayType(),
        undefined,
        false,
      ),
      new Socket(SOCKET_TYPE.OUT, inputWidthName, new NumberType()),
      new Socket(SOCKET_TYPE.OUT, inputHeightName, new NumberType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>,
  ): Promise<void> {
    const newContainer = new PIXI.Graphics();
    inputObject[outputPixiName](newContainer, {});
    this.addChild(newContainer);

    const rgbaArray =
      PPGraph.currentGraph.app.renderer.extract.pixels(newContainer); // returns double the size
    const imageWidth = Math.floor(newContainer.width);
    const imageHeight = Math.floor(newContainer.height);

    // Initialize an empty array to store RGBA objects
    const pixelArray = [];
    const grayScaleArray = [];

    // Populate the two-dimensional array with RGBA values
    for (let y = 0; y < imageHeight; y++) {
      const row = [];
      const rowG = [];
      for (let x = 0; x < imageWidth; x++) {
        const startIndex = (y * 2 * imageWidth + x) * 8; // 4 channels * 2 as pixels() returns a double size image
        const r = rgbaArray[startIndex];
        const g = rgbaArray[startIndex + 1];
        const b = rgbaArray[startIndex + 2];
        const a = rgbaArray[startIndex + 3] / 255.0;
        const gray = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
        const rgbaPixel = {
          r,
          g,
          b,
          a,
          gray,
        };
        row.push(rgbaPixel);
        rowG.push(gray);
      }
      pixelArray.push(row);
      grayScaleArray.push(rowG);
    }

    outputObject[outputPixelArray] = pixelArray;
    outputObject[outputGrayscaleArray] = grayScaleArray;
    outputObject[inputWidthName] = imageWidth;
    outputObject[inputHeightName] = imageHeight;

    this.removeChild(newContainer);
  }
}

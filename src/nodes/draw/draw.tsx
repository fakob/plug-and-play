/* eslint-disable @typescript-eslint/no-empty-function */
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  DEFAULT_IMAGE,
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
import { TwoDVectorType } from '../datatypes/twoDVectorType';
import { BooleanType } from '../datatypes/booleanType';
import { ArrayType } from '../datatypes/arrayType';
import { TriggerType } from '../datatypes/triggerType';
import { StringType } from '../datatypes/stringType';
import { ImageType } from '../datatypes/imageType';
import {
  getSuffix,
  parseValueAndAttachWarnings,
  saveBase64AsImage,
} from '../../utils/utils';
import { TRgba } from '../../utils/interfaces';
import { drawDottedLine, removeAndDestroyChild } from '../../pixi/utils-pixi';
import {
  DRAW_Base,
  DRAW_Interactive_Base,
  injectedDataName,
  objectsInteractive,
  outputMultiplierIndex,
  outputMultiplierInjected,
  outputMultiplierPointerDown,
  outputPixiName,
} from './abstract';
import { DynamicInputNodeFunctions } from '../abstract/DynamicInputNode';
import DRAW_Get_Bounds from './drawMeta';

const availableShapes: EnumStructure = [
  {
    text: 'Circle',
  },
  {
    text: 'Ellipse',
  },
  {
    text: 'Rectangle',
  },
  {
    text: 'Rounded Rectangle',
  },
];

const inputShapeName = 'Shape';
const inputColorName = 'Color';
const inputSizeName = 'Size';
const inputBorderName = 'Border';
const outputImageName = 'Image';
const outputQualityName = 'Quality';
const outputTypeyName = 'Type';
const inputReverseName = 'Reverse Direction';

const inputDottedName = 'Dotted';
const inputDottedIntervalName = 'Dot Interval';

const inputCombineArray = 'GraphicsArray';

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
const useBoundingBoxSpacingName = 'Adjacent Placing';

const inputImageName = 'Image';
const imageExport = 'Save image';

const inputPointsName = 'Points';

const outputPixelArray = 'Color array';

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
    const injectedData = node.getInputData(injectedDataName);
    if (injectedData.length > 0) {
      node.setOutputData(outputMultiplierInjected, injectedData[index]);
    }
    node.setOutputData(outputMultiplierPointerDown, true);
    // tell all children when something is pressed
    node.executeChildren();
    console.log(
      `Pressed ${index}: ${shallowContainer.x}, ${shallowContainer.y}`,
    );

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
    const width = inputObject[inputWidthName];
    const height = inputObject[inputHeightName];
    if (Number.isFinite(width) && Number.isFinite(height)) {
      const graphics: PIXI.Graphics = new PIXI.Graphics();
      const selectedColor = parseValueAndAttachWarnings(
        this,
        new ColorType(),
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
    if (typeof inputObject[inputGraphicsName] === 'function') {
      inputObject[inputGraphicsName](container, executions);
    }
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
    const selectedColor = parseValueAndAttachWarnings(
      this,
      new ColorType(),
      inputObject[inputColorName],
    );
    basicText.style.fill = selectedColor.hex();

    container.addChild(basicText);
  }
}

const graphicsPositionName = 'Position';

export class DRAW_Combine extends DRAW_Base {
  public getName(): string {
    return 'Combine manually';
  }

  public getDescription(): string {
    return 'Combine and position objects relative to each other';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputReverseName, new BooleanType()),
    ].concat(super.getDefaultIO());
  }

  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number },
  ): void {
    const graphicsKeys = Object.keys(inputObject).filter((key) =>
      key.startsWith(outputPixiName),
    );
    const positionKeys = Object.keys(inputObject).filter((key) =>
      key.startsWith(graphicsPositionName),
    );
    graphicsKeys.sort();
    positionKeys.sort();

    if (inputObject[inputReverseName]) {
      graphicsKeys.reverse();
      positionKeys.reverse();
    }

    graphicsKeys.forEach((graphicsKey, index) => {
      const positionKey = positionKeys[index];
      if (inputObject[positionKey]) {
        const position = new PIXI.Point(
          inputObject[positionKey].x,
          inputObject[positionKey].y,
        );
        inputObject[graphicsKey](container, executions, position);
      }
    });
  }

  public getSocketForNewConnection = (socket: Socket): Socket => {
    return DynamicInputNodeFunctions.getSocketForNewConnection(
      socket,
      this,
      true,
    );
  };

  public async inputPlugged() {
    this.adaptInputs();
  }

  public async inputUnplugged() {
    this.adaptInputs();
  }

  protected adaptInputs(): void {
    const sockets = this.getAllNonDefaultInputSockets();
    const offsetSockets = sockets.filter(
      (socket) => socket.dataType instanceof TwoDVectorType,
    );
    sockets.forEach((socket) => {
      const suffix = getSuffix(socket.name, outputPixiName);
      if (socket.dataType instanceof DeferredPixiType) {
        if (socket.hasLink()) {
          const hasOffset = offsetSockets.some(
            (offsetSocket) =>
              getSuffix(offsetSocket.name, graphicsPositionName) === suffix,
          );
          if (!hasOffset) {
            const offsetName = `${graphicsPositionName}${suffix === '' ? '' : ' ' + suffix}`;
            this.addInput(offsetName, new TwoDVectorType());
          }
        } else {
          const orphanOffset = offsetSockets.find(
            (offsetSocket) =>
              getSuffix(offsetSocket.name, graphicsPositionName) === suffix,
          );
          this.removeSocket(socket);
          this.removeSocket(orphanOffset);
        }
      }
    });
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
      new Socket(
        SOCKET_TYPE.IN,
        useBoundingBoxSpacingName,
        new BooleanType(),
        true,
      ),
      new Socket(SOCKET_TYPE.IN, drawingOrder, new BooleanType(), true),
      new Socket(
        SOCKET_TYPE.IN,
        spacingXName,
        new NumberType(true, 0, 2000),
        0,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        spacingYName,
        new NumberType(true, 0, 2000),
        0,
      ),
    ].concat(super.getDefaultIO());
  }

  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number },
  ): void {
    const graphicsArray = inputObject[inputCombineArray];
    const changeDrawingOrder = inputObject[drawingOrder];
    const spacingSize =
      graphicsArray.length && inputObject[useBoundingBoxSpacingName]
        ? DRAW_Get_Bounds.getDrawingBounds(
            graphicsArray[0],
            inputObject[spacingXName],
            inputObject[spacingYName],
          )
        : new PIXI.Rectangle(
            0,
            0,
            inputObject[spacingXName],
            inputObject[spacingYName],
          );

    for (let i = graphicsArray.length - 1; i >= 0; i--) {
      const r = Math.floor(i / inputObject[numberPerColumnRow]);
      const s = i % inputObject[numberPerColumnRow];
      const x = changeDrawingOrder ? s : r;
      const y = changeDrawingOrder ? r : s;
      const shallowContainer = new PIXI.Container();
      if (typeof graphicsArray[i] == 'function') {
        graphicsArray[i](
          shallowContainer,
          executions,
          new PIXI.Point(x * spacingSize.width, y * spacingSize.height),
        );
      }
      if (inputObject[objectsInteractive]) {
        addShallowContainerEventListeners(
          shallowContainer,
          this,
          i,
          executions,
        );
      }
      container.addChild(shallowContainer);
    }
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
    const total = inputObject[totalNumberName];
    const changeDrawingOrder = inputObject[drawingOrder];

    for (let i = total - 1; i >= 0; i--) {
      const r = Math.floor(i / inputObject[numberPerColumnRow]);
      const s = i % inputObject[numberPerColumnRow];
      const x = changeDrawingOrder ? s : r;
      const y = changeDrawingOrder ? r : s;

      const shallowContainer = new PIXI.Container();
      if (typeof inputObject[inputGraphicsName] === 'function') {
        inputObject[inputGraphicsName](
          shallowContainer,
          executions,
          new PIXI.Point(
            x * inputObject[spacingXName],
            y * inputObject[spacingYName],
          ),
        );
      }

      addShallowContainerEventListeners(shallowContainer, this, i, executions);

      container.addChild(shallowContainer);
    }
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
    inputObject[inputPointsName].forEach((points, i) => {
      const x = points[0];
      const y = points[1];
      const shallowContainer = new PIXI.Container();
      if (inputObject[inputGraphicsName])
        inputObject[inputGraphicsName](
          shallowContainer,
          executions,
          new PIXI.Point(x, y),
        );

      addShallowContainerEventListeners(shallowContainer, this, i, executions);

      container.addChild(shallowContainer);
    });
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
    const image = PIXI.Texture.from(
      inputObject[inputImageName] || DEFAULT_IMAGE,
    );
    const sprite = new PIXI.Sprite(image);
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
        [100, 50],
        [0, 100],
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
    const graphics: PIXI.Graphics = new PIXI.Graphics();
    const selectedColor = parseValueAndAttachWarnings(
      this,
      new ColorType(),
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
        [100, 50],
        [0, 100],
      ]),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType()),
    ].concat(super.getDefaultIO());
  }

  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    executions: { string: number },
  ): void {
    const graphics: PIXI.Graphics = new PIXI.Graphics();
    const selectedColor = parseValueAndAttachWarnings(
      this,
      new ColorType(),
      inputObject[inputColorName],
    );
    graphics.beginFill(selectedColor.hexNumber());
    graphics.alpha = selectedColor.a;

    const points: [number, number][] = inputObject[inputPointsName];
    graphics.drawPolygon(points.map((p) => new PIXI.Point(p[0], p[1])));
    container.addChild(graphics);
  }
}

export class Extract_Image_From_Graphics extends PPNode {
  public getName(): string {
    return 'Get image from graphic';
  }

  public getDescription(): string {
    return 'Get image from a graphic and save it';
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
    removeAndDestroyChild(this, newContainer);
  }

  saveImage = async () => {
    const base64 = this.getOutputData(outputImageName);
    await saveBase64AsImage(base64, this.name);
  };
}

export class Extract_PixelArray_From_Graphics extends PPNode {
  public getName(): string {
    return 'Get pixel array from graphic';
  }

  public getDescription(): string {
    return 'Get all color values of a graphic as a 1-dimensional array';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, outputPixiName, new DeferredPixiType()),
      new Socket(SOCKET_TYPE.OUT, outputPixelArray, new ArrayType()),
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

    const imageWidth = Math.floor(newContainer.width);
    const imageHeight = Math.floor(newContainer.height);

    // temporarily change resolution so the extraction is not double size
    PPGraph.currentGraph.app.renderer.resolution = 1;
    const rgbaArray =
      PPGraph.currentGraph.app.renderer.extract.pixels(newContainer); // returns double the size
    PPGraph.currentGraph.app.renderer.resolution = 2;

    const pixelArray = [];
    for (let i = 0; i < rgbaArray.length; i += 4) {
      const rgbaObject = {
        r: rgbaArray[i],
        g: rgbaArray[i + 1],
        b: rgbaArray[i + 2],
        a: rgbaArray[i + 3] / 255.0,
      };
      pixelArray.push(rgbaObject);
    }

    outputObject[outputPixelArray] = pixelArray;
    outputObject[inputWidthName] = imageWidth;
    outputObject[inputHeightName] = imageHeight;

    removeAndDestroyChild(this, newContainer);
  }
}

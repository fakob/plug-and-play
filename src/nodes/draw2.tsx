/* eslint-disable @typescript-eslint/no-empty-function */
import { DisplayObject } from 'pixi.js';
import { PureNode } from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import {
  NOTE_LINEHEIGHT_FACTOR,
  PIXI_PIVOT_OPTIONS,
  SOCKET_TYPE,
} from '../utils/constants';
import { DeferredPixiType } from './datatypes/deferredPixiType';
import { EnumStructure, EnumType } from './datatypes/enumType';
import * as PIXI from 'pixi.js';
import { ColorType } from './datatypes/colorType';
import { NumberType } from './datatypes/numberType';
import { BooleanType } from './datatypes/booleanType';
import { ArrayType } from './datatypes/arrayType';
import { StringType } from './datatypes/stringType';
import { ImageType } from './datatypes/imageType';
import { TRgba } from '../utils/interfaces';

export const availableShapes: EnumStructure = [
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
];

const inputXName = 'Offset X';
const inputYName = 'Offset Y';
const scaleXName = 'Scale X';
const scaleYName = 'Scale Y';
const inputRotationName = 'Rotation';
const inputPivotName = 'Pivot';

const inputShapeName = 'Shape';
const inputColorName = 'Color';
const inputSizeName = 'Size';
const inputBorderName = 'Border';
const outputPixiName = 'Graphics';

const inputCombine1Name = 'Foreground';
const inputCombine2Name = 'Background';
const outputMultiplierIndex = 'LatestPressedIndex';
const outputMultiplierInjected = 'LastPressedInjected';

const inputTextName = 'Text';
const inputLineHeightName = 'Line Height';
const inputWidthName = 'Width';

const inputGraphicsName = 'Graphics';
const multiplyXName = 'Num X';
const multiplyYName = 'Num Y';
const spacingXName = 'Spacing X';
const spacingYName = 'Spacing Y';
const injectedDataName = 'Injected Data';

const inputImageName = 'Image';

// a PIXI draw node is a pure node that also draws its graphics if graphics at the end
abstract class DRAW_Base extends PureNode {
  deferredGraphics: PIXI.Container;

  onNodeRemoved = (): void => {
    const canvas = this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container;

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
      new Socket(SOCKET_TYPE.OUT, outputPixiName, new DeferredPixiType()),
    ];
  }

  public async execute(): Promise<boolean> {
    const result: boolean = await super.execute();
    this.handleDrawing();
    return true;
  }

  // if you are a child you likely want to use this instead of normal execute
  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    injectedData: any
  ): void {}

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[outputPixiName] = (container, injectedData) =>
      this.drawOnContainer(inputObject, container, injectedData);
  }

  protected shouldDraw(): boolean {
    return !this.getOutputSocketByName(outputPixiName).hasLink();
  }

  handleDrawing(): void {
    const canvas = this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container;

    canvas.removeChild(this.deferredGraphics);
    if (this.shouldDraw()) {
      this.deferredGraphics = new PIXI.Container();
      this.deferredGraphics.x = this.x + 400;
      this.deferredGraphics.y = this.y;
      const data: (container: PIXI.Container) => void =
        this.getOutputSocketByName(outputPixiName).data;
      data(this.deferredGraphics);
      canvas.addChild(this.deferredGraphics);
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
    this.handleDrawing();
  }
  public outputUnplugged(): void {
    this.handleDrawing();
  }

  shouldExecuteOnMove(): boolean {
    return this.shouldDraw();
  }
}

export class DRAW_Shape extends DRAW_Base {
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
        inputSizeName,
        new NumberType(false, 1, 1000),
        200
      ),
      new Socket(SOCKET_TYPE.IN, inputBorderName, new BooleanType(), true),
    ].concat(super.getDefaultIO());
  }

  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    injectedData
  ): void {
    inputObject = { ...inputObject, ...injectedData };
    const graphics: PIXI.Graphics = new PIXI.Graphics();
    const selectedColor: TRgba = inputObject[inputColorName];
    const drawBorder = inputObject[inputBorderName];
    graphics.beginFill(selectedColor.hexNumber());
    graphics.lineStyle(
      drawBorder ? 3 : 0,
      selectedColor.multiply(0.7).hexNumber()
    );

    const shapeEnum = inputObject[inputShapeName];
    switch (shapeEnum) {
      case 'Circle': {
        graphics.drawCircle(0, 0, inputObject[inputSizeName] / 2);
        break;
      }
      case 'Rectangle': {
        graphics.drawRect(
          0,
          0,
          inputObject[inputSizeName] * 1.618,
          inputObject[inputSizeName]
        );
        break;
      }
      case 'Rounded Rectangle': {
        graphics.drawRoundedRect(
          0,
          0,
          inputObject[inputSizeName] * 1.618,
          inputObject[inputSizeName],
          inputObject[inputSizeName] * 0.1
        );
        break;
      }
    }
    this.positionAndScale(graphics, inputObject);
    container.addChild(graphics);
  }
}

export class DRAW_Text extends DRAW_Base {
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
    injectedData
  ): void {
    inputObject = { ...inputObject, ...injectedData };
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
    if (inputObject[inputWidthName] !== 0)
      basicText.style.fill = inputObject[inputColorName].hex();

    this.positionAndScale(basicText, inputObject);
    container.addChild(basicText);
  }
}

export class DRAW_Combine extends DRAW_Base {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputCombine1Name, new DeferredPixiType()),
      new Socket(SOCKET_TYPE.IN, inputCombine2Name, new DeferredPixiType()),
    ].concat(super.getDefaultIO());
  }
  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    injectedData
  ): void {
    const myContainer = new PIXI.Container();
    const array1Data =
      injectedData && injectedData.length > 0 ? injectedData[0] : {};
    const array2Data =
      injectedData && injectedData.length > 1 ? injectedData[1] : {};

    if (inputObject[inputCombine2Name])
      inputObject[inputCombine2Name](myContainer, array2Data);
    if (inputObject[inputCombine1Name])
      inputObject[inputCombine1Name](myContainer, array1Data);

    this.positionAndScale(myContainer, inputObject);

    myContainer.interactive = true;

    container.addChild(myContainer);
  }
}

export class DRAW_Multiplier extends DRAW_Base {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputGraphicsName, new DeferredPixiType()),
      new Socket(
        SOCKET_TYPE.IN,
        multiplyXName,
        new NumberType(true, 0, 100),
        2
      ),
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
      new Socket(SOCKET_TYPE.IN, injectedDataName, new ArrayType(), []),
      new Socket(SOCKET_TYPE.OUT, outputMultiplierIndex, new NumberType(true)),
      new Socket(SOCKET_TYPE.OUT, outputMultiplierInjected, new ArrayType()),
    ].concat(super.getDefaultIO());
  }
  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    injectedData: any
  ): void {
    inputObject = { ...inputObject, ...injectedData };
    const myContainer = new PIXI.Container();
    let injected = [];
    try {
      if (typeof inputObject[injectedDataName] == 'object') {
        injected = inputObject[injectedDataName];
      } else {
        injected = JSON.parse(inputObject[injectedDataName]);
      }
    } catch (e) {
      console.log('failed to parse injected data');
    }
    for (let x = 0; x < inputObject[multiplyXName]; x++) {
      for (let y = 0; y < inputObject[multiplyYName]; y++) {
        const currentIndex = x + inputObject[multiplyXName] * y;
        const currentInjectedData =
          injected.length > currentIndex ? injected[currentIndex] : [];

        const shallowContainer = new PIXI.Container();
        if (inputObject[inputGraphicsName])
          inputObject[inputGraphicsName](shallowContainer, currentInjectedData);
        shallowContainer.x = x * inputObject[spacingXName];
        shallowContainer.y = y * inputObject[spacingYName];

        shallowContainer.interactive = true;
        const alphaPre = shallowContainer.alpha;
        const scalePreX = shallowContainer.scale.x;
        const scalePreY = shallowContainer.scale.y;
        shallowContainer.on('pointerdown', (e) => {
          this.setOutputData(outputMultiplierIndex, currentIndex);
          this.setOutputData(outputMultiplierInjected, currentInjectedData);
          // tell all children when something is pressed
          this.executeChildren();
          console.log('pressed: ' + x + ' y: ' + y);
          shallowContainer.scale.x *= 0.97;
          shallowContainer.scale.y *= 0.97;
          shallowContainer.alpha = alphaPre * 0.8;
        });

        shallowContainer.on('pointerup', (e) => {
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
  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, inputImageName, new ImageType())].concat(
      super.getDefaultIO()
    );
  }

  protected drawOnContainer(
    inputObject: any,
    container: PIXI.Container,
    injectedData: any
  ): void {
    inputObject = { ...inputObject, ...injectedData };

    const image = PIXI.Texture.from(inputObject[inputImageName]);
    const sprite = new PIXI.Sprite(image);
    //sprite.width = 200;
    //sprite.height = 200;
    this.positionAndScale(sprite, inputObject);

    container.addChild(sprite);
  }
}

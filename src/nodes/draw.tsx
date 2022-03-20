/* eslint-disable @typescript-eslint/no-empty-function */
import { DisplayObject } from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode, { PureNode } from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import {
  COLOR_WHITE,
  NODE_TYPE_COLOR,
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
import { CustomArgs, TRgba } from '../utils/interfaces';
import { JSONType } from './datatypes/jsonType';

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
const outputMultiplierLatestIndex = 'LatestPressedIndex';
const outputMultiplierIndex = 'PressedIndex';
const outputMultiplierInjected = 'LastPressedInjected';
const outputMultiplierPointerDown = 'PointerDown';

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

const inputPointsName = 'Points';

// a PIXI draw node is a pure node that also draws its graphics if graphics at the end
abstract class DRAW_Base extends PPNode {
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
    const canvas = this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container;

    canvas.removeChild(this.deferredGraphics);
    if (this.shouldDraw()) {
      this.deferredGraphics = new PIXI.Container();
      this.deferredGraphics.x = this.x + 400;
      this.deferredGraphics.y = this.y;
      drawingFunction(this.deferredGraphics, {});
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
    this.executeOptimizedChain();
  }
  public outputUnplugged(): void {
    this.executeOptimizedChain();
  }

  shouldExecuteOnMove(): boolean {
    return this.shouldDraw();
  }
}
export class DRAW_Shape extends DRAW_Base {
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
        inputSizeName,
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
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.DRAW),
    });

    this.name = 'Draw text object';
    this.description = 'Draws a text';
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
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.DRAW),
    });

    this.name = 'Combine objects';
    this.description = 'Combines two drawn objects';
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

export class DRAW_Multiplier extends DRAW_Base {
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.DRAW),
    });

    this.name = 'Multiply object';
    this.description = 'Multiplies an object into a grid';
  }

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
      new Socket(
        SOCKET_TYPE.OUT,
        outputMultiplierLatestIndex,
        new NumberType(true)
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
    for (let x = 0; x < inputObject[multiplyXName]; x++) {
      for (let y = 0; y < inputObject[multiplyYName]; y++) {
        const currentIndex = x + inputObject[multiplyXName] * y;

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
          this.setOutputData(outputMultiplierLatestIndex, currentIndex);
          this.setOutputData(outputMultiplierIndex, currentIndex);
          this.setOutputData(outputMultiplierInjected, executions);
          this.setOutputData(outputMultiplierPointerDown, true);
          // tell all children when something is pressed
          this.executeChildren();
          console.log('pressed: ' + x + ' y: ' + y);
          shallowContainer.scale.x *= 0.97;
          shallowContainer.scale.y *= 0.97;
          shallowContainer.alpha = alphaPre * 0.8;
        });

        shallowContainer.on('pointerup', (e) => {
          this.setOutputData(outputMultiplierPointerDown, false);
          this.setOutputData(outputMultiplierIndex, undefined);
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
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.DRAW),
    });

    this.name = 'Draw image object';
    this.description = 'Draws an image object (jpg, png)';
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
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.DRAW),
    });

    this.name = 'Draw line';
    this.description = 'Draws a line specified by the input points';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputPointsName, new ArrayType(), [[0, 0]]),
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

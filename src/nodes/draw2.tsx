/* eslint-disable @typescript-eslint/no-empty-function */
import { DisplayObject, ObservablePoint } from 'pixi.js';
import PPNode, { PureNode } from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import {
  COLOR_DARK,
  NODE_TYPE_COLOR,
  NOTE_LINEHEIGHT_FACTOR,
  SOCKET_TYPE,
} from '../utils/constants';
import { DeferredPixiType } from './datatypes/deferredPixiType';
import { EnumStructure, EnumType } from './datatypes/enumType';
import * as PIXI from 'pixi.js';
import { ColorType } from './datatypes/colorType';
import { NumberType } from './datatypes/numberType';
import { BooleanType } from './datatypes/booleanType';
import { trgbaToColor } from '../pixi/utils-pixi';
import { ArrayType } from './datatypes/arrayType';
import { StringType } from './datatypes/stringType';
import { AnyType } from './datatypes/anyType';
import { JSONType } from './datatypes/jsonType';

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

const inputShapeName = 'Shape';
const inputColorName = 'Color';
const inputSizeName = 'Size';
const inputBorderName = 'Border';
const outputPixiName = 'Graphics';

const inputCombine1Name = 'Primary';
const inputCombine2Name = 'Secondary';
const outputMultiplierIndex = 'LatestPressedIndex';
const outputMultiplierInjected = 'LastPressedInjected';

const inputTextName = 'Text';
const inputLineHeightName = 'Line Height';

const inputGraphicsName = 'Graphics';
const multiplyXName = 'Num X';
const multiplyYName = 'Num Y';
const spacingXName = 'Spacing X';
const spacingYName = 'Spacing Y';
const injectedDataName = 'Injected Data';

// a PIXI draw node is a pure node that also draws its graphics if graphics at the end
export abstract class PIXIDrawNode extends PureNode {
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

  handleDrawing(): void {
    const canvas = this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container;

    canvas.removeChild(this.deferredGraphics);
    const shouldDraw = !this.getOutputSocketByName(outputPixiName).hasLink();
    if (shouldDraw) {
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
    toModify.setTransform(
      inputObject[inputXName],
      inputObject[inputYName],
      inputObject[scaleXName],
      inputObject[scaleYName],
      inputObject[inputRotationName]
    );

    //toModify.scale = new ObservablePoint(1, 1);
  }

  public outputPlugged(): void {
    this.handleDrawing();
  }
  public outputUnplugged(): void {
    this.handleDrawing();
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class PIXIShape extends PIXIDrawNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        inputShapeName,
        new EnumType(availableShapes),
        'Circle'
      ),
      new Socket(SOCKET_TYPE.IN, inputColorName, new ColorType(), COLOR_DARK),
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
    const selectedColor = PIXI.utils.string2hex(
      trgbaToColor(inputObject[inputColorName]).hex()
    );
    const drawBorder = inputObject[inputBorderName];
    graphics.beginFill(selectedColor);
    graphics.lineStyle(drawBorder ? 3 : 0, selectedColor << 1);

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

export class PIXIText2 extends PIXIDrawNode {
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
      lineJoin: 'round',
    });
    const basicText = new PIXI.Text(inputObject[inputTextName], textStyle);

    this.positionAndScale(basicText, inputObject);
    container.addChild(basicText);
  }
}

export class PIXICombiner extends PIXIDrawNode {
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

    inputObject[inputCombine2Name](myContainer, array2Data);
    inputObject[inputCombine1Name](myContainer, array1Data);

    this.positionAndScale(myContainer, inputObject);

    myContainer.interactive = true;
    myContainer.on('pointerdown', (e) => {
      console.log('im pressed');
    });
    container.addChild(myContainer);
  }
}

export class PIXIMultiplier2 extends PIXIDrawNode {
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
        shallowContainer.on('pointerdown', (e) => {
          this.setOutputData(outputMultiplierIndex, currentIndex);
          this.setOutputData(outputMultiplierInjected, currentInjectedData);
          // redraw me when someone presses something
          this.executeOptimizedChain();
          console.log('pressed: ' + x + ' y: ' + y);
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

/*
export class PIXIContainer extends PPNode {
  _containerRef: PIXI.Container[];
  canvas: PIXI.Container;
  executeOnClick: (index: number) => void;
  onClickHandler: (event?: PIXI.InteractionEvent) => void;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const customOnClickFunction = `(e) => {
  console.log("Clicked node:", this);
  console.log("Clicked index:", e.currentTarget.index);
  this.executeOnClick(e.currentTarget.index);
}`;

    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DRAW,
    });

    this.addOutput('container', new PixiType());
    this.addOutput('clickedTargetIndex', new NumberType());
    this.addOutput('clickedTargetArray', new ArrayType());

    // when true, group inputs and duplicate these containers
    // use this mode for custom click events
    // when false, all inputs are duplicated within one container
    this.addInput('mode', new BooleanType(), false, false);

    this.addInput('x', new NumberType(), 0, false);
    this.addInput('y', new NumberType(), 0, false);
    this.addInput('angle', new NumberType(true, -360, 360), 0, false);
    this.addInput('scale', new NumberType(), 1.0, false);
    this.addInput('onClick', new CodeType(), customOnClickFunction, false);
    this.addInput('input1', new PixiType());
    this.addInput('input2', new PixiType());
    this.addInput('input3', new PixiType());

    this.name = 'Container';
    this.description = 'General-purpose display object that holds children';

    this.onNodeAdded = () => {
      this.canvas = this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      const container = new PIXI.Container();
      this._containerRef = [this.canvas.addChild(container)];
      this._containerRef[0].name = `${this.id}-${0}`;
      this.onClickHandler = eval(customOnClickFunction);
      this._containerRef[0].on('pointerdown', this.onClickHandler);

      this.setOutputData('container', this._containerRef);
    };

    this.onExecute = async function (input) {
      const mode = input['mode'];
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const angle = [].concat(input['angle']);
      const scale = [].concat(input['scale']);
      const onClick = input['onClick'];
      const input1 = [].concat(input['input1']);
      const input2 = [].concat(input['input2']);
      const input3 = [].concat(input['input3']);

      if (mode) {
        const lengthOfLargestArray = Math.max(
          0,
          x.length,
          y.length,
          angle.length,
          scale.length,
          input1.length,
          input2.length,
          input3.length
        );

        if (lengthOfLargestArray !== this._containerRef.length) {
          for (let index = 0; index < this._containerRef.length; index++) {
            this._containerRef[index].destroy();
          }
          this._containerRef.splice(0, this._containerRef.length); // clear array without removing reference
        }

        for (let index = 0; index < lengthOfLargestArray; index++) {
          if (!this._containerRef[index]) {
            const container = new PIXI.Container();
            this._containerRef[index] = this.canvas.addChild(container);
            this.onClickHandler = eval(onClick);
            (this._containerRef[index] as PIXI.Container).on(
              'pointerdown',
              this.onClickHandler
            );
          } else {
            this._containerRef[index].removeChildren();
          }
          this._containerRef[index].name = `${this.id}-${index}`;

          const myX = +(x[index] ?? x[x.length - 1]);
          const myY = +(y[index] ?? y[y.length - 1]);
          const myAngle = +(angle[index] ?? angle[angle.length - 1]);
          const myInput1 = input1[index] ?? input1[input1.length - 1];
          const myInput2 = input2[index] ?? input2[input2.length - 1];
          const myInput3 = input3[index] ?? input3[input3.length - 1];

          myInput1 == undefined
            ? undefined
            : this._containerRef[index].addChild(myInput1);
          myInput2 == undefined
            ? undefined
            : this._containerRef[index].addChild(myInput2);
          myInput3 == undefined
            ? undefined
            : this._containerRef[index].addChild(myInput3);

          // if output is not connected, then draw it next to the node
          if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
            this._containerRef[index].x = myX;
            this._containerRef[index].y = myY;
          } else {
            this._containerRef[index].x = this.x + this.width + myX;
            this._containerRef[index].y = this.y + myY;
          }
          this._containerRef[index].index = index;
          this._containerRef[index].angle = myAngle;
          this._containerRef[index].buttonMode = true;
          this._containerRef[index].interactive = true;
          this._containerRef[index].scale.set(scale);
        }
      } else {
        for (let index = 0; index < this._containerRef.length; index++) {
          this._containerRef[index].destroy();
        }
        this._containerRef.splice(0, this._containerRef.length); // clear array without removing reference
        const container = new PIXI.Container();
        this._containerRef[0] = this.canvas.addChild(container);
        this._containerRef[0].name = `${this.id}`;

        const allInputs = [...input1, ...input2, ...input3];

        for (let index = 0; index < allInputs.length; index++) {
          if (allInputs[index]) {
            const allInputsRef = this._containerRef[0].addChild(
              allInputs[index]
            );
            this.onClickHandler = eval(onClick);
            (allInputsRef as PIXI.Container).on(
              'pointerdown',
              this.onClickHandler
            );
            allInputsRef.index = index;
            allInputsRef.buttonMode = true;
            allInputsRef.interactive = true;
          }
        }

        // if output is not connected, then draw it next to the node
        if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
          this._containerRef[0].x = +x[0];
          this._containerRef[0].y = +y[0];
        } else {
          this._containerRef[0].x = this.x + this.width + x[0];
          this._containerRef[0].y = this.y + y[0];
        }
        this._containerRef[0].angle = angle;
        this._containerRef[0].scale.set(scale);
      }
    };

    this.executeOnClick = (index: number): void => {
      this._containerRef[index].alpha =
        this._containerRef[index].alpha === 0.3 ? 1 : 0.3;
      this.setOutputData('clickedTargetIndex', index);
      const clickedTargetArray = this._containerRef.map((item) => {
        return item.alpha === 0.3;
      });
      this.setOutputData('clickedTargetArray', clickedTargetArray);
      this.executeOptimizedChain();
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._containerRef.length; index++) {
        this.canvas.removeChild(this._containerRef[index]);
      }
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class PIXIMultiplier extends PPNode {
  _inputContainerRef: PIXI.Container;
  _containerRef: PIXI.Container;
  createAndAddClone: (
    type: string,
    x: number,
    y: number,
    parentContainer: PIXI.Container,
    objectToClone: PIXI.Graphics | PIXI.Text,
    index: number,
    adjustArray?: any,
    testString?: string
  ) => PIXI.Graphics;
  createSubcontainerAndIterateOverChildren: (
    x: number,
    y: number,
    container: PIXI.Container,
    objectToClone: PIXI.Container,
    index: number,
    adjustArray?: any,
    testString?: string
  ) => PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DRAW,
    });

    this.addOutput('container', new PixiType());
    this.addInput('input', new PixiType());
    this.addInput('count', new NumberType(true, 0), 9, undefined);
    this.addInput('column', new NumberType(true, 0), 3, undefined);
    this.addInput('distance', new NumberType(), 10.0);
    this.addInput('scale', new NumberType(), 1.0);
    this.addInput('adjustArray', new ArrayType());

    this.name = 'GraphicsMultiplier';
    this.description = 'Multiplies the input graphics';

    this.onNodeAdded = () => {
      const inputContainer = new PIXI.Container();
      const container = new PIXI.Container();
      this._containerRef = (
        this.graph.viewport.getChildByName('backgroundCanvas') as PIXI.Container
      ).addChild(container);
      this._inputContainerRef = this._containerRef.addChild(inputContainer);
      this.setOutputData('container', this._containerRef);
      this._containerRef.name = this.id;
    };

    this.onExecute = async function (input) {
      let inputRef: PIXI.DisplayObject[] | PIXI.DisplayObject = input['input'];
      const count = input['count'];
      const column = input['column'];
      const distance = input['distance'];
      const scale = input['scale'];
      const adjustArray = input['adjustArray'];
      this._containerRef.removeChildren();
      this._inputContainerRef.removeChildren();
      // console.log(adjustArray);

      // if inputRef is array, wrap it into container
      if (inputRef && inputRef.constructor.name === 'Array') {
        this._inputContainerRef.addChild(...(inputRef as PIXI.DisplayObject[]));
        inputRef = this._inputContainerRef;
      }

      if (inputRef != undefined) {
        let x = 0;
        let y = 0;

        // if output is not connected, then draw it next to the node
        if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
          this._containerRef.x = 0;
          this._containerRef.y = 0;
          // this._containerRef.visible = false;
        } else {
          x = this.x + this.width;
          y = this.y;
          // this._containerRef.visible = true;
        }

        for (let indexCount = 0; indexCount < count; indexCount++) {
          let objectToPosition;
          if (inputRef.constructor.name === 'Container') {
            objectToPosition = this.createSubcontainerAndIterateOverChildren(
              x,
              y,
              this._containerRef,
              inputRef as PIXI.Container,
              indexCount,
              adjustArray?.[indexCount]?.container,
              `[${indexCount}].container`
            );
          } else {
            objectToPosition = this.createAndAddClone(
              inputRef.constructor.name,
              x,
              y,
              this._containerRef,
              inputRef as PIXI.Graphics,
              indexCount,
              adjustArray?.[indexCount],
              `[${indexCount}]`
            );
          }

          objectToPosition.x =
            x + (objectToPosition.width + distance) * (indexCount % column);
          objectToPosition.y =
            y +
            (objectToPosition.height + distance) *
              Math.floor(indexCount / column);
        }

        this._containerRef.scale.set(scale);
      }
    };

    this.onNodeRemoved = (): void => {
      (
        this.graph.viewport.getChildByName('backgroundCanvas') as PIXI.Graphics
      ).removeChild(this._containerRef);
    };

    this.createAndAddClone = (
      type: string,
      x: number,
      y: number,
      container: PIXI.Container,
      objectToClone: PIXI.Graphics | PIXI.Text,
      index: number,
      adjustArray?: any,
      testString?: string
    ): PIXI.Graphics => {
      let clone;
      switch (type) {
        case 'Graphics':
          clone = (objectToClone as PIXI.Graphics).clone();
          break;
        case 'Text':
          clone = new PIXI.Text(
            (objectToClone as PIXI.Text).text,
            (objectToClone as PIXI.Text).style
          );
          break;

        default:
          break;
      }
      console.log(adjustArray, clone, type);
      clone.name =
        container === this._containerRef
          ? `${this.id}-${index}`
          : `${container.name}-${index}`;
      clone.x = 0;
      clone.y = 0;
      if (adjustArray?.height !== undefined) {
        clone.height = adjustArray.height;
      }
      if (adjustArray?.width !== undefined) {
        clone.width = adjustArray.width;
      }
      if (adjustArray?.scale !== undefined) {
        clone.scale.x = adjustArray.scale;
      }
      return container.addChild(clone);
    };

    this.createSubcontainerAndIterateOverChildren = (
      x: number,
      y: number,
      container: PIXI.Container,
      objectToClone: PIXI.Container,
      index: number,
      adjustArray?: any,
      testString?: string
    ): PIXI.Container => {
      // console.log(adjustArray);
      const children = objectToClone.children;
      const subContainer = container.addChild(new PIXI.Container());
      subContainer.name =
        container === this._containerRef
          ? `${this.id}-subContainer-${index}`
          : `${subContainer.name}-subContainer-${index}`;
      for (
        let indexChildren = 0;
        indexChildren < children.length;
        indexChildren++
      ) {
        const element = children[indexChildren];
        if (element.constructor.name === 'Container') {
          this.createSubcontainerAndIterateOverChildren(
            x,
            y,
            subContainer,
            element as PIXI.Container,
            indexChildren,
            adjustArray?.[indexChildren]?.container,
            `${testString}[${indexChildren}].container`
          );
        } else if (element.constructor.name === 'Text') {
          this.createAndAddClone(
            'Text',
            x,
            y,
            subContainer,
            element as PIXI.Text,
            indexChildren,
            adjustArray?.[indexChildren],
            `${testString}[${indexChildren}]`
          );
        } else {
          this.createAndAddClone(
            'Graphics',
            x,
            y,
            subContainer,
            element as PIXI.Graphics,
            indexChildren,
            adjustArray?.[indexChildren],
            `${testString}[${indexChildren}]`
          );
        }
      }
      subContainer.x = 0;
      subContainer.y = 0;
      return container.addChild(subContainer);
    };
  }
}

export class Table extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  parsedData: any;
  update: () => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const isHybrid = true;

    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.TRANSFORM,
      nodeWidth,
      nodeHeight,
      minNodeWidth: nodeWidth / 2,
      minNodeHeight: nodeHeight / 2,
      isHybrid,
    });

    this.addOutput('selectedData', new StringType());
    this.addInput('reload', new TriggerType());
    this.addInput('data', new StringType(), customArgs?.data ?? '');

    this.name = 'Table';
    this.description = 'Adds a table';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('data') ?? '';
      this.parsedData = this.parseData(data);
      this.createContainerComponent(document, TableParent, {
        dataArray: this.parsedData,
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();
    };

    // when the Node is loaded, update the react component
    this.update = (): void => {
      const data = this.getInputData('data') ?? '';
      this.parsedData = this.parseData(data);
      this.renderReactComponent(TableParent, {
        dataArray: this.parsedData,
      });
      this.setOutputData('selectedData', this.parsedData);
    };

    const getCellRenderer = (key: number) => {
      return (row: number) => <BPCell>{`${this.parsedData[row][key]}`}</BPCell>;
    };

    const onSelection = (selectedRegions: IRegion[]): void => {
      const selectedData = selectedRegions.map((region) => {
        const regionData = [];
        const rowIndexStart = region.rows === undefined ? 0 : region.rows[0];
        const rowIndexEnd =
          region.rows === undefined
            ? this.parsedData.length - 1
            : region.rows[1];
        for (
          let rowIndex = rowIndexStart;
          rowIndex <= rowIndexEnd;
          rowIndex++
        ) {
          const rowData = [];
          const colIndexStart = region.cols === undefined ? 0 : region.cols[0];
          const colIndexEnd =
            region.cols === undefined
              ? this.parsedData[rowIndex].length - 1
              : region.cols[1];
          for (
            let colIndex = colIndexStart;
            colIndex <= colIndexEnd;
            colIndex++
          ) {
            rowData.push(this.parsedData[rowIndex][colIndex]);
          }
          regionData.push(rowData);
        }
        return regionData;
      });
      if (selectedRegions.length === 1) {
        this.setOutputData('selectedData', selectedData[0]);
      } else {
        this.setOutputData('selectedData', selectedData);
      }
      this.executeOptimizedChain();
    };

    // small presentational component
    const TableParent = (props) => {
      return props.dataArray.length > 0 ? (
        <BPTable numRows={props.dataArray.length} onSelection={onSelection}>
          {props.dataArray[0].map((col, index) => {
            return (
              <BPColumn name={col} cellRenderer={getCellRenderer(index)} />
            );
          })}
        </BPTable>
      ) : (
        <BPTable numRows={20}>
          <BPColumn />
          <BPColumn />
          <BPColumn />
        </BPTable>
      );
    };
  }

  parseData(data: string): any {
    const results = csvParser.parse(data, {});
    console.log(results);
    return results?.data;
  }

  trigger(): void {
    this.update();
  }
}
*/

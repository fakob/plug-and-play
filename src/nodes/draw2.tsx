import { DisplayObject } from 'pixi.js';
import PPNode, { PureNode } from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import { COLOR_DARK, NODE_TYPE_COLOR, SOCKET_TYPE } from '../utils/constants';
import { DeferredPixiType } from './datatypes/deferredPixiType';
import { EnumStructure, EnumType } from './datatypes/enumType';
import * as PIXI from 'pixi.js';
import { ColorType } from './datatypes/colorType';
import { NumberType } from './datatypes/numberType';
import { BooleanType } from './datatypes/booleanType';
import { trgbaToColor } from '../pixi/utils-pixi';

export const availableShapes: EnumStructure = [
  {
    text: 'Circle',
    value: 'Circle',
  },
  {
    text: 'Rectangle',
    value: 'Rectangle',
  },
];

const inputShapeName = 'Shape';
const inputColorName = 'Color';
const inputSizeName = 'Size';
const inputBorderName = 'Border';
const outputPixiName = 'Graphics';

const inputTextName = 'Text';

// assume you have output deferred renderings, add them
//function drawIfFinished(node: PPNode): void {}

// a PIXI draw node is a pure node that also draws its graphics if graphics at the end
export class PIXIDrawNode extends PureNode {
  deferredGraphics: DisplayObject;

  // you probably want to maintain this output in children
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.OUT, outputPixiName, new DeferredPixiType()),
    ];
  }

  public async execute(): Promise<void> {
    await super.execute();
    this.handleDrawing();
  }

  handleDrawing(): void {
    this.removeChild(this.deferredGraphics);
    // we draw if no dependents
    const shouldDraw: boolean =
      Object.keys(this.getDirectDependents()).length < 1;
    if (shouldDraw) {
      this.deferredGraphics = this.getOutputSocketByName(outputPixiName).data;
      this.deferredGraphics.x = 500;
      this.addChild(this.deferredGraphics);
    } else {
    }
  }
}

export class PIXIShape extends PIXIDrawNode {
  protected getDefaultIO(): Socket[] {
    return super
      .getDefaultIO()
      .concat([
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
      ]);
  }
  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    const graphics = new PIXI.Graphics();
    const selectedColor = PIXI.utils.string2hex(
      trgbaToColor(inputObject[inputColorName]).hex()
    );
    console.log('selectedColor: ' + JSON.stringify(selectedColor));
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
    }
    outputObject[outputPixiName] = graphics;
  }
}

export class PIXIText2 extends PIXIDrawNode {}

/*
export class PIXIText extends PPNode {
  _ref: PIXI.Text[];
  textStyle: PIXI.TextStyle;
  canvas: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const fillColor = COLOR_DARK;

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('text', new StringType(), 'Text');
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('width', new NumberType(), 100);
    this.addInput('angle', new NumberType(true, -360, 360), 0);
    this.addInput(
      'align',
      new EnumType(PIXI_TEXT_ALIGN_OPTIONS),
      'left',
      false
    );
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 'top left', false);
    this.addInput('size', new NumberType(true, 1), 24, undefined);
    this.addInput('color', new ColorType(), hexToTRgba(fillColor));

    this.name = 'Draw text';
    this.description = 'Draws a text';

    this.onNodeAdded = () => {
      this.textStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: this.getInputData('size'),
        lineHeight: this.getInputData('size') * NOTE_LINEHEIGHT_FACTOR,
        align: this.getInputData('align'),
        whiteSpace: 'pre-line',
        wordWrap: true,
        wordWrapWidth: this.getInputData('width'),
        lineJoin: 'round',
      });

      this.canvas = this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      const basicText = new PIXI.Text(
        this.getInputData('text'),
        this.textStyle
      );

      this._ref = [this.canvas.addChild(basicText)];
      this.setOutputData('graphics', this._ref);
    };

    this.onExecute = async function (input) {
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const width = [].concat(input['width']);
      const angle = [].concat(input['angle']);
      const text = [].concat(input['text']);
      const size = [].concat(input['size']);
      const color = [].concat(input['color']);
      const align = input['align'];
      const pivot = input['pivot'];
      const lengthOfLargestArray = Math.max(
        0,
        x.length,
        y.length,
        width.length,
        angle.length,
        text.length,
        size.length,
        color.length
      );

      for (let index = 0; index < this._ref.length; index++) {
        this._ref[index].destroy();
      }
      this._ref.splice(0, this._ref.length); // clear array without removing reference

      for (let index = 0; index < lengthOfLargestArray; index++) {
        // if output is not connected, then draw it next to the node
        const myX = +(x[index] ?? x[x.length - 1]);
        const myY = +(y[index] ?? y[y.length - 1]);
        const myWidth = +(width[index] ?? width[width.length - 1]);
        const myAngle = +(angle[index] ?? angle[angle.length - 1]);
        const mySize = +(size[index] ?? size[size.length - 1]);
        const myText = text[index] ?? text[text.length - 1];
        const myColor = trgbaToColor(color[index] ?? color[color.length - 1]);
        const PIXIText = new PIXI.Text(myText, {
          ...this.textStyle,
          fontSize: mySize,
          lineHeight: mySize * NOTE_LINEHEIGHT_FACTOR,
          fill: PIXI.utils.string2hex(myColor.hex()),
          wordWrapWidth: myWidth,
          align: align,
        });
        this._ref[index] = this.canvas.addChild(PIXIText);
        this._ref[index].name = `${this.id}-${index}`;

        const pivotPoint =
          PIXI_PIVOT_OPTIONS.find((item) => item.text === pivot)?.value ??
          PIXI_PIVOT_OPTIONS[0].value; // use first entry if not found

        // set pivot point and rotate
        (this._ref[index] as PIXI.Text).pivot.x =
          pivotPoint.x * this._ref[index].width;
        (this._ref[index] as PIXI.Text).pivot.y =
          pivotPoint.y * this._ref[index].height;
        (this._ref[index] as PIXI.Text).angle = myAngle;

        if ((this as PPNode).getOutputSocketByName('graphics')?.hasLink()) {
          this._ref[index].x = myX;
          this._ref[index].y = myY;
        } else {
          this._ref[index].x = this.x + this.width + myX;
          this._ref[index].y = this.y + myY;
        }
      }
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._ref.length; index++) {
        this.canvas.removeChild(this._ref[index]);
      }
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class PIXIRect extends PPNode {
  _ref: PIXI.Graphics[];
  canvas: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const rectWidth = 100;
    const rectHeight = 100;
    const fillColor = COLOR[1];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('angle', new NumberType(true, -360, 360), 0);
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 'top left', false);
    this.addInput(
      'width',
      new NumberType(),
      customArgs?.width ?? rectWidth,
      false
    );
    this.addInput(
      'height',
      new NumberType(),
      customArgs?.height ?? rectHeight,
      false
    );
    this.addInput('color', new ColorType(), hexToTRgba(fillColor));

    this.name = 'Draw rectangle';
    this.description = 'Draws a rectangle';

    this.onNodeAdded = () => {
      this.canvas = this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      const graphics = new PIXI.Graphics();
      this._ref = [this.canvas.addChild(graphics)];

      this.setOutputData('graphics', this._ref);
    };

    this.onExecute = async function (input) {
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const angle = [].concat(input['angle']);
      const width = [].concat(input['width']);
      const height = [].concat(input['height']);
      const color = [].concat(input['color']);
      const pivot = input['pivot'];
      const lengthOfLargestArray = Math.max(
        0,
        x.length,
        y.length,
        angle.length,
        width.length,
        height.length,
        color.length
      );

      if (lengthOfLargestArray !== this._ref.length) {
        for (let index = 0; index < this._ref.length; index++) {
          this._ref[index].destroy();
        }
        this._ref.splice(0, this._ref.length); // clear array without removing reference
      }
      for (let index = 0; index < lengthOfLargestArray; index++) {
        if (!this._ref[index]) {
          const graphics = new PIXI.Graphics();
          this._ref[index] = this.canvas.addChild(graphics);
        } else {
          this._ref[index].clear();
        }
        this._ref[index].name = `${this.id}-${index}`;

        // if output is not connected, then draw it next to the node
        const myX = +(x[index] ?? x[x.length - 1]);
        const myY = +(y[index] ?? y[y.length - 1]);
        const myAngle = +(angle[index] ?? angle[angle.length - 1]);
        const myWidth = +(width[index] ?? width[width.length - 1]);
        const myHeight = +(height[index] ?? height[height.length - 1]);
        const myColor = trgbaToColor(color[index] ?? color[color.length - 1]);

        this._ref[index].beginFill(
          PIXI.utils.string2hex(myColor.hex()),
          myColor.alpha()
        );
        const pivotPoint =
          PIXI_PIVOT_OPTIONS.find((item) => item.text === pivot)?.value ??
          PIXI_PIVOT_OPTIONS[0].value; // use first entry if not found

        // set pivot point and rotate
        (this._ref[index] as PIXI.Graphics).pivot.x = pivotPoint.x * myWidth;
        (this._ref[index] as PIXI.Graphics).pivot.y = pivotPoint.y * myHeight;
        (this._ref[index] as PIXI.Graphics).angle = myAngle;

        if ((this as PPNode).getOutputSocketByName('graphics')?.hasLink()) {
          this._ref[index].drawRect(myX, myY, myWidth, myHeight);
        } else {
          this._ref[index].drawRect(
            this.x + this.width + myX,
            this.y + myY,
            myWidth,
            myHeight
          );
        }
        this._ref[index].endFill();
      }
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._ref.length; index++) {
        this.canvas.removeChild(this._ref[index]);
      }
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class PIXICircle extends PPNode {
  _ref: PIXI.Graphics[];
  canvas: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const radius = 50;
    const fillColor = COLOR[8];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 'top left', false);
    this.addInput(
      'radius',
      new NumberType(),
      customArgs?.radius ?? radius,
      false
    );
    this.addInput('color', new ColorType(), hexToTRgba(fillColor));

    this.name = 'Draw circle';
    this.description = 'Draws a circle';

    this.onNodeAdded = () => {
      this.canvas = this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      const graphics = new PIXI.Graphics();
      this._ref = [this.canvas.addChild(graphics)];
      this.setOutputData('graphics', this._ref);
    };

    this.onExecute = async function (input) {
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const radius = [].concat(input['radius']);
      const color = [].concat(input['color']);
      const pivot = input['pivot'];
      const lengthOfLargestArray = Math.max(
        0,
        x.length,
        y.length,
        radius.length,
        color.length
      );

      if (lengthOfLargestArray !== this._ref.length) {
        for (let index = 0; index < this._ref.length; index++) {
          this._ref[index].destroy();
        }
        this._ref.splice(0, this._ref.length); // clear array without removing reference
      }
      for (let index = 0; index < lengthOfLargestArray; index++) {
        if (!this._ref[index]) {
          const graphics = new PIXI.Graphics();
          this._ref[index] = this.canvas.addChild(graphics);
        } else {
          this._ref[index].clear();
        }
        this._ref[index].name = `${this.id}-${index}`;

        // if output is not connected, then draw it next to the node
        const myX = +(x[index] ?? x[x.length - 1]);
        const myY = +(y[index] ?? y[y.length - 1]);
        const myRadius = +(radius[index] ?? radius[radius.length - 1]);
        const myColor = trgbaToColor(color[index] ?? color[color.length - 1]);

        this._ref[index].beginFill(
          PIXI.utils.string2hex(myColor.hex()),
          myColor.alpha()
        );
        const pivotPoint =
          PIXI_PIVOT_OPTIONS.find((item) => item.text === pivot)?.value ??
          PIXI_PIVOT_OPTIONS[0].value; // use first entry if not found

        // set pivot point
        (this._ref[index] as PIXI.Graphics).pivot.x =
          pivotPoint.x * myRadius * 2;
        (this._ref[index] as PIXI.Graphics).pivot.y =
          pivotPoint.y * myRadius * 2;
        if ((this as PPNode).getOutputSocketByName('graphics')?.hasLink()) {
          this._ref[index].drawCircle(myX + myRadius, myY + myRadius, myRadius);
        } else {
          this._ref[index].drawCircle(
            this.x + this.width + myX + myRadius,
            this.y + myY + myRadius,
            myRadius
          );
        }
        this._ref[index].endFill();
      }
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._ref.length; index++) {
        this.canvas.removeChild(this._ref[index]);
      }
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

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

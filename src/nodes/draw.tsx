import * as PIXI from 'pixi.js';
import React from 'react';
import Color from 'color';
import {
  IRegion,
  Table as BPTable,
  Column as BPColumn,
  Cell as BPCell,
} from '@blueprintjs/table';
import * as csvParser from 'papaparse';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs, SerializedNode } from '../utils/interfaces';
import {
  COLOR,
  DATATYPE,
  NODE_TYPE_COLOR,
  NODE_OUTLINE_DISTANCE,
  NODE_WIDTH,
  NOTE_FONTSIZE,
  NOTE_LINEHEIGHT_FACTOR,
  NOTE_MARGIN_STRING,
  NOTE_PADDING,
  NOTE_TEXTURE,
  PIXI_PIVOT_OPTIONS,
  SOCKET_WIDTH,
} from '../utils/constants';
import { hexToTRgba, trgbaToColor } from '../pixi/utils-pixi';
import textFit from '../pixi/textFit';
import { AnyType } from './datatypes/anyType';
import { NumberType } from './datatypes/numberType';
import { EnumType } from './datatypes/enumType';
import { ColorType } from './datatypes/colorType';
import { PixiType } from './datatypes/pixiType';
import { BooleanType } from './datatypes/booleanType';
import { StringType } from './datatypes/stringType';
import { ArrayType } from './datatypes/arrayType';
import { TriggerType } from './datatypes/triggerType';

export class PIXIText extends PPNode {
  _ref: PIXI.Text[];
  textStyle: PIXI.TextStyle;
  canvas: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const fillColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 0, false);
    this.addInput('text', new StringType(), 'Text');
    this.addInput('size', new NumberType(true, 1), 24, undefined);
    this.addInput('color', new ColorType(), hexToTRgba(fillColor));

    this.name = 'Draw text';
    this.description = 'Draws a text';

    this.onNodeAdded = () => {
      this.textStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: this.getInputData('size'),
        lineHeight: this.getInputData('size') * NOTE_LINEHEIGHT_FACTOR,
        align: 'center',
        whiteSpace: 'pre-line',
        wordWrap: true,
        wordWrapWidth: NODE_WIDTH - NOTE_PADDING,
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
      const text = [].concat(input['text']);
      const size = [].concat(input['size']);
      const color = [].concat(input['color']);
      const pivot = input['pivot'];
      const lengthOfLargestArray = Math.max(
        0,
        x.length,
        y.length,
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
        const myX = x[index] ?? x[x.length - 1];
        const myY = y[index] ?? y[y.length - 1];
        const myText = text[index] ?? text[text.length - 1];
        const mySize = size[index] ?? size[size.length - 1];
        const myColor = trgbaToColor(color[index] ?? color[color.length - 1]);

        const PIXIText = new PIXI.Text(myText, {
          ...this.textStyle,
          fontSize: mySize,
          lineHeight: mySize * NOTE_LINEHEIGHT_FACTOR,
          fill: PIXI.utils.string2hex(myColor.hex()),
        });
        this._ref[index] = this.canvas.addChild(PIXIText);
        this._ref[index].name = `${this.id}-${index}`;

        const pivotPoint =
          PIXI_PIVOT_OPTIONS.find((item) => item.text === pivot)?.value ??
          PIXI_PIVOT_OPTIONS[0].value; // use first entry if not found

        // set pivot point
        (this._ref[index] as PIXI.Text).pivot.x =
          pivotPoint.x * this._ref[index].width;
        (this._ref[index] as PIXI.Text).pivot.y =
          pivotPoint.y * this._ref[index].height;

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
    const fillColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 0, false);
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
      const width = [].concat(input['width']);
      const height = [].concat(input['height']);
      const color = [].concat(input['color']);
      const pivot = input['pivot'];
      const lengthOfLargestArray = Math.max(
        0,
        x.length,
        y.length,
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
        const myX = x[index] ?? x[x.length - 1];
        const myY = y[index] ?? y[y.length - 1];
        const myWidth = width[index] ?? width[width.length - 1];
        const myHeight = height[index] ?? height[height.length - 1];
        const myColor = trgbaToColor(color[index] ?? color[color.length - 1]);

        this._ref[index].beginFill(
          PIXI.utils.string2hex(myColor.hex()),
          myColor.alpha()
        );
        const pivotPoint =
          PIXI_PIVOT_OPTIONS.find((item) => item.text === pivot)?.value ??
          PIXI_PIVOT_OPTIONS[0].value; // use first entry if not found

        // set pivot point
        (this._ref[index] as PIXI.Graphics).pivot.x = pivotPoint.x * myWidth;
        (this._ref[index] as PIXI.Graphics).pivot.y = pivotPoint.y * myHeight;

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
    const fillColor = COLOR[7];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('graphics', new AnyType());
    this.addInput('x', new NumberType(), 0);
    this.addInput('y', new NumberType(), 0);
    this.addInput('pivot', new EnumType(PIXI_PIVOT_OPTIONS), 0, false);
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
        const myX = x[index] ?? x[x.length - 1];
        const myY = y[index] ?? y[y.length - 1];
        const myRadius = radius[index] ?? radius[radius.length - 1];
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

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DRAW,
    });

    this.addOutput('container', new PixiType());
    this.addInput('mode', new BooleanType(), false, false);
    this.addInput('x', new NumberType());
    this.addInput('y', new NumberType());
    this.addInput('scale', new NumberType(), 1.0);
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

      this.setOutputData('container', this._containerRef);
    };

    this.onExecute = async function (input) {
      const mode = input['mode'];
      const x = [].concat(input['x']);
      const y = [].concat(input['y']);
      const scale = [].concat(input['scale']);
      const input1 = [].concat(input['input1']);
      const input2 = [].concat(input['input2']);
      const input3 = [].concat(input['input3']);

      if (mode) {
        const lengthOfLargestArray = Math.max(
          0,
          x.length,
          y.length,
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
          } else {
            this._containerRef[index].removeChildren();
          }
          this._containerRef[index].name = `${this.id}-${index}`;

          const myX = x[index] ?? x[x.length - 1];
          const myY = y[index] ?? y[y.length - 1];
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
            this._containerRef[0].addChild(allInputs[index]);
          }
        }

        // if output is not connected, then draw it next to the node
        if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
          this._containerRef[0].x = x[0];
          this._containerRef[0].y = y[0];
        } else {
          this._containerRef[0].x = this.x + this.width + x[0];
          this._containerRef[0].y = this.y + y[0];
        }
        this._containerRef[0].scale.set(scale);
      }
    };

    this.onNodeRemoved = (): void => {
      for (let index = 0; index < this._containerRef.length; index++) {
        this.canvas.removeChild(this._containerRef[index]);
      }
    };
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
      if (inputRef.constructor.name === 'Array') {
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

export class Note extends PPNode {
  _rectRef: PIXI.Sprite;
  _textInputRef: PIXI.Text;
  note: PIXI.Sprite;
  basicText: PIXI.Text;
  createInputElement;
  currentInput: HTMLDivElement;
  setCleanAndDisplayText: (input: HTMLDivElement) => void;
  setCleanText: (text: string) => void;
  onViewportMove: (event: PIXI.InteractionEvent) => void;
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);
    this.addOutput('textOutput', new StringType());
    this.addOutput('fontSize', new NumberType(), false);
    this.addInput('textInput', new StringType(), 'type...');
    this.addInput('fontSize', new NumberType(), NOTE_FONTSIZE, false);

    this.name = 'Note';
    this.description = 'Adds a note';

    const textFitOptions = {
      multiLine: true,
      maxFontSize: 60,
      // alignVertWithFlexbox: true,
    };

    this.onNodeAdded = () => {
      this.note = PIXI.Sprite.from(NOTE_TEXTURE);
      this.note.x = SOCKET_WIDTH / 2;
      this.note.y = NODE_OUTLINE_DISTANCE;
      this.note.width = NODE_WIDTH;
      this.note.height = NODE_WIDTH;

      this.currentInput = null;

      this.basicText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: NOTE_FONTSIZE,
        lineHeight: NOTE_FONTSIZE * NOTE_LINEHEIGHT_FACTOR,
        align: 'center',
        whiteSpace: 'pre-line',
        wordWrap: true,
        wordWrapWidth: NODE_WIDTH - NOTE_PADDING,
        lineJoin: 'round',
      });
      this.basicText.anchor.set(0.5, 0.5);
      this.basicText.x = (SOCKET_WIDTH + NODE_WIDTH) / 2;
      this.basicText.y = (NODE_OUTLINE_DISTANCE + NODE_WIDTH) / 2;

      // update shape after adding
      this.drawNodeShape();
    };

    //
    this.onViewportMove = function (): void {
      // console.log('onViewportMove', event);
      const screenPoint = this.graph.viewport.toScreen(this.x, this.y);
      this.currentInput.style.transform = `scale(${this.graph.viewport.scale.x}`;
      this.currentInput.style.left = `${screenPoint.x}px`;
      this.currentInput.style.top = `${screenPoint.y}px`;
    };
    this.onViewportMoveHandler = this.onViewportMove.bind(this);

    this.onDrawNodeShape = function () {
      this._BackgroundRef.visible = false;
      this._NodeNameRef.visible = false;

      (this._rectRef as any) = (this as PIXI.Container).addChild(this.note);
      this._rectRef.alpha = 1;
      this._rectRef.tint;

      this._textInputRef = (this as PIXI.Container).addChild(this.basicText);
    };

    this.createInputElement = () => {
      // create html input element
      this.currentInput = document.createElement('div');
      this.currentInput.id = 'Input';
      this.currentInput.contentEditable = 'true';
      this.currentInput.innerHTML = this.inputSocketArray[0].data;
      this._textInputRef.visible = false;
      this.currentInput.style.fontFamily = 'Arial';
      // this.currentInput.style.fontStyle = 'italic';
      // this.currentInput.style.fontWeight = 'bold';
      this.currentInput.style.fontSize = `${this._textInputRef.style.fontSize}`;
      this.currentInput.style.lineHeight = `${NOTE_LINEHEIGHT_FACTOR}`;
      this.currentInput.style.textAlign = 'center';
      this.currentInput.style.margin = NOTE_MARGIN_STRING;
      this.currentInput.style.padding = `${NOTE_PADDING}px`;
      this.currentInput.style.position = 'absolute';
      this.currentInput.style.background = 'transparent';
      this.currentInput.style.border = '0 none';
      this.currentInput.style.transformOrigin = 'top left';
      this.currentInput.style.transform = `translate(50%, 50%)`;
      this.currentInput.style.transform = `scale(${this.graph.viewport.scale.x}`;
      this.currentInput.style.outline = '1px dashed black';
      const screenPoint = this.graph.viewport.toScreen(this.x, this.y);
      this.currentInput.style.left = `${screenPoint.x}px`;
      this.currentInput.style.top = `${screenPoint.y}px`;
      this.currentInput.style.width = `${NODE_WIDTH}px`;
      this.currentInput.style.height = `${NODE_WIDTH - NOTE_PADDING}px`;
      // this.currentInput.style.display = 'none';
      this.currentInput.style.resize = 'none';
      this.currentInput.style.overflowY = 'scroll';
      setTimeout(() => {
        // run textfit once so span in div is already added
        // and caret does not jump after first edit
        textFit(this.currentInput, textFitOptions);

        // set caret to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(this.currentInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        // set focus
        this.currentInput.focus();
        console.log(this.currentInput);
      }, 100);

      this.currentInput.dispatchEvent(new Event('input'));

      // add event handlers
      this.currentInput.addEventListener('blur', (e) => {
        console.log('blur', e);
        this.graph.viewport.removeListener('moved', this.onViewportMoveHandler);
        this.currentInput.dispatchEvent(new Event('input'));
        this.setCleanAndDisplayText(this.currentInput);
        this.currentInput.remove();
        this._textInputRef.visible = true;
      });

      this.currentInput.addEventListener('input', (e) => {
        // console.log('input', e);
        // run textFit to recalculate the font size
        textFit(this.currentInput, textFitOptions);
      });

      this.graph.viewport.on('moved', (this as any).onViewportMoveHandler);

      document.body.appendChild(this.currentInput);
      console.log(this.currentInput);
    };

    this.setCleanAndDisplayText = (input: HTMLDivElement) => {
      // get font size of editable div
      const style = window.getComputedStyle(input.children[0], null);

      const newText = input.textContent;
      const newFontSize = Math.min(
        parseInt(style.fontSize, 10),
        this.getInputData('fontSize')
      );
      const newFontSizeString = `${newFontSize}px`;
      const newLineHeight = newFontSize * NOTE_LINEHEIGHT_FACTOR;

      this._textInputRef.style.fontSize = newFontSizeString;
      this._textInputRef.style.lineHeight = newLineHeight;
      this._textInputRef.text = input.textContent;

      const textInput = this.getInputSocketByName('textInput');
      textInput.data = newText;
      this.setOutputData('textOutput', newText);

      const fontSizeInput = this.getInputSocketByName('fontSize');
      fontSizeInput.data = newFontSize;
      this.setOutputData('fontSize', newFontSize);
    };

    this.setCleanText = (text: string) => {
      this.inputSocketArray[0].data = text;
      this.setOutputData('textOutput', text);
    };

    this.onConfigure = (node_info: SerializedNode) => {
      console.log('onConfigure on Note:', node_info);
      this.createInputElement();
      this.currentInput.dispatchEvent(new Event('input'));
      this.currentInput.dispatchEvent(new Event('blur'));
    };

    this.onNodeDoubleClick = () => {
      console.log('_onDoubleClick on Note:', this);
      this.createInputElement();
    };

    this.onExecute = async (input, output) => {
      const inputText = input['input'];
      this._textInputRef.text = inputText;
      this.setOutputData('textOutput', inputText);
    };
  }
}

/*export class Image extends PPNode {
  _imageRef: PIXI.Sprite;
  _texture: PIXI.Texture;
  _loader: PIXI.Loader;
  adjustImageAndNodeSize: (baseTexture: PIXI.BaseTexture) => void;

  // uses customArgs?.objectURL as texture
  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const isHybrid = true;

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      isHybrid,
    });

    // this.addOutput('image', DATATYPE.PIXI);
    this.addOutput('width', DATATYPE.NUMBER);
    this.addOutput('height', DATATYPE.NUMBER);
    // this.addInput('reload', DATATYPE.TRIGGER);
    this.addInput('base64', DATATYPE.STRING, customArgs?.base64, false);
    console.log(customArgs);
    console.log(customArgs.base64);
    console.log(typeof customArgs.base64);

    this.name = 'Image';
    this.description = 'Adds an image';

    // when texture is loaded get width and height
    // and set proper aspect ratio
    this.adjustImageAndNodeSize = (baseTexture) => {
      console.log('textureLoaded');

      // get width and height
      const { width, height } = baseTexture;

      // calculate drawing width and height
      const aspectRatio = width / height;
      let newNodeWidth = nodeWidth;
      let newNodeHeight = nodeHeight;
      if (aspectRatio > 1) {
        newNodeHeight = newNodeHeight / aspectRatio;
      } else {
        newNodeWidth = newNodeWidth * aspectRatio;
      }
      console.log(newNodeWidth, newNodeHeight);

      // set imageRef and node to new size
      this._imageRef.x = SOCKET_WIDTH / 2;
      this._imageRef.y = NODE_OUTLINE_DISTANCE;
      this._imageRef.width = newNodeWidth;
      this._imageRef.height = newNodeHeight;
      this.resizeNode(newNodeWidth, newNodeHeight);

      // output width and height of image
      this.setOutputData('width', width);
      this.setOutputData('height', height);
    };

    this._loader = new PIXI.Loader(); // PixiJS exposes a premade instance for you to use.
    this._loader.onComplete.add((loader, resources) => {
      console.log(loader, resources);
      const sprite = PIXI.Sprite.from(resources[this.id].texture);
      (this._imageRef as any) = (this as PIXI.Container).addChild(sprite);
      console.log(
        resources[this.id].texture.height,
        resources[this.id].texture.width
      );
      console.log(sprite.height, sprite.width);
      this.adjustImageAndNodeSize(resources[this.id].texture.baseTexture);
    });

    this.onNodeAdded = () => {
      const base64 = this.getInputData('base64');
      if (this._loader.resources[this.id] === undefined && base64 !== '') {
        this._loader.add(this.id, base64);
        this._loader.load();
      }
    };

    // when the Node is loaded, load the base64 image and adjust the size
    this.onConfigure = (): void => {
      if (this._loader.resources[this.id] === undefined) {
        const base64 = this.getInputData('base64');
        if (base64 !== undefined) {
          this._loader.add(this.id, base64);
          this._loader.load();
        }
      } else {
        const sprite = PIXI.Sprite.from(
          this._loader.resources[this.id]?.texture
        );
        (this._imageRef as any) = (this as PIXI.Container).addChild(sprite);
        this.adjustImageAndNodeSize(
          this._loader.resources[this.id].texture.baseTexture
        );
      }
    };
  }

  // trigger(): void {
  //   const url: string = this.getInputData('url');
  //   // if url is set then get image
  //   if (url !== '') {
  //     // const objectURL = URL.createObjectURL(url);
  //     const newTexture = PIXI.Texture.from(url);
  //     this._imageRef.texture = newTexture;
  //     this._imageRefClone.texture = newTexture;
  //   }
  //   const { width, height } = this._imageRef.texture.orig;
  //   this.setOutputData('image', this._imageRefClone);
  //   this.setOutputData('width', width);
  //   this.setOutputData('height', height);
  // }
}*/

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
      this.setOutputData('selectedData', selectedData);
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

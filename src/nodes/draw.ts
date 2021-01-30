import * as PIXI from 'pixi.js';
// import * as TextInput from 'pixi-text-input';
import PPGraph from '../GraphClass';
import PPNode from '../NodeClass';
import { rgbToHex } from '../utils-pixi';
import { convertToArray, getElement } from '../utils';
import {
  INPUTTYPE,
  OUTPUTTYPE,
  NOTE_TEXTURE,
  NODE_WIDTH,
  NODE_OUTLINE_DISTANCE,
  INPUTSOCKET_WIDTH,
} from '../constants';

const TextInput = require('pixi-text-input');
// console.log(TextInput);

export class DrawRect extends PPNode {
  _x: number;
  _y: number;
  _width: number;
  _height: number;
  _color: number;
  _rectRef: PIXI.Graphics;

  constructor(
    name: string,
    graph: PPGraph,
    customId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    color?: number[]
  ) {
    super(name, graph, customId);

    this.addInput('x', INPUTTYPE.NUMBER);
    this.addInput('y', INPUTTYPE.NUMBER);
    this.addInput('width', INPUTTYPE.NUMBER);
    this.addInput('height', INPUTTYPE.NUMBER);
    this.addInput('color', 'color');

    this.name = 'Draw Rect';
    this.description = 'Draws a rectangle';

    const rect = new PIXI.Graphics();
    this._rectRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container).addChild(rect);
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    let convertedColor;
    if (color === undefined) {
      convertedColor = PIXI.utils.string2hex('#00FF00');
    } else {
      convertedColor = PIXI.utils.string2hex(rgbToHex(color));
    }
    this._rectRef.beginFill(convertedColor, 0.5);
    this._rectRef.drawRect(this._x, this._y, this._width, this._height);
    this._rectRef.endFill();

    this.onExecute = function () {
      const x = this.getInputData(0) || 0;
      const y = this.getInputData(1) || 0;
      const width = this.getInputData(2) || 100;
      const height = this.getInputData(3) || 100;
      const color = (this.getInputData(4) as number[]) || [255, 0, 0, 0.5];
      this._rectRef.clear();

      const xArray = convertToArray(x);
      this._rectRef.beginFill(PIXI.utils.string2hex(rgbToHex(color)), color[3]);
      xArray.forEach((xValue: number, index: number) => {
        const yValue = getElement(y, index);
        const widthValue = getElement(width, index);
        const heightValue = getElement(height, index);
        this._rectRef.drawRect(
          this.x + this.width + xValue,
          this.y + yValue - heightValue + this.height,
          widthValue,
          heightValue
        );
        this._rectRef.moveTo(xValue + 2);
      });
      this._rectRef.endFill();
      // this.setOutputData(1, Date.now());
    };
  }
}

export class Rect extends PPNode {
  _x: number;
  _y: number;
  _width: number;
  _height: number;
  _color: number;
  _rectRef: PIXI.Graphics;

  constructor(
    name: string,
    graph: PPGraph,
    customId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    color?: number[]
  ) {
    super(name, graph, customId);

    this.addOutput('rect', OUTPUTTYPE.PIXI);
    this.addInput('x', INPUTTYPE.NUMBER);
    this.addInput('y', INPUTTYPE.NUMBER);
    this.addInput('width', INPUTTYPE.NUMBER);
    this.addInput('height', INPUTTYPE.NUMBER);
    this.addInput('color', 'color');

    this.name = 'Create Rect';
    this.description = 'Creates a rectangle';

    const rect = new PIXI.Graphics();
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    let convertedColor;
    if (color === undefined) {
      convertedColor = PIXI.utils.string2hex('#00FF00');
    } else {
      convertedColor = PIXI.utils.string2hex(rgbToHex(color));
    }
    this._rectRef = rect;
    this._rectRef.beginFill(convertedColor, 0.5);
    this._rectRef.drawRect(this._x, this._y, this._width, this._height);
    this._rectRef.endFill();

    this.onExecute = function () {
      const x = this.getInputData(0) || 0;
      const y = this.getInputData(1) || 0;
      const width = this.getInputData(2) || 100;
      const height = this.getInputData(3) || 100;
      const color = (this.getInputData(4) as number[]) || [255, 0, 0, 0.5];
      this._rectRef.clear();

      const xArray = convertToArray(x);
      this._rectRef.beginFill(PIXI.utils.string2hex(rgbToHex(color)), color[3]);
      xArray.forEach((xValue: number, index: number) => {
        const yValue = getElement(y, index);
        const widthValue = getElement(width, index);
        const heightValue = getElement(height, index);
        this._rectRef.drawRect(
          xValue,
          yValue - heightValue,
          widthValue,
          heightValue
        );
        this._rectRef.moveTo(xValue + 2);
      });
      this._rectRef.endFill();
      this.setOutputData(0, this._rectRef);
    };
  }
}

export class Container extends PPNode {
  _containerRef: PIXI.Container;

  constructor(name: string, graph: PPGraph, customId: string) {
    super(name, graph, customId);

    this.addInput('input1', INPUTTYPE.PIXI);
    this.addInput('input2', INPUTTYPE.PIXI);
    this.addInput('input3', INPUTTYPE.PIXI);
    // this.addInput('color', 'color');

    this.name = 'Container';
    this.description = 'General-purpose display object that holds children';

    const container = new PIXI.Container();
    this._containerRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container).addChild(container);

    this.onExecute = function () {
      const input1 = this.getInputData(0);
      const input2 = this.getInputData(1);
      const input3 = this.getInputData(2);
      console.log(input1, input2, input3);
      console.log(this._containerRef);
      this._containerRef.removeChildren;

      this._containerRef.addChild(input1);
      input1 === null ? undefined : this._containerRef.addChild(input1);
      input2 === null ? undefined : this._containerRef.addChild(input2);
      input3 === null ? undefined : this._containerRef.addChild(input3);
      this._containerRef.x = this.x + this.width;
      this._containerRef.y = this.y;
    };
  }
}

export class Note extends PPNode {
  _rectRef: PIXI.Sprite;
  _textInputRef: PIXI.Text;

  constructor(name: string, graph: PPGraph, customId: string) {
    super(name, graph, customId);
    this.addOutput('output', OUTPUTTYPE.STRING);
    this.addInput('input', INPUTTYPE.STRING);

    this.name = 'Note';
    this.description = 'Adds a note';
    const note = PIXI.Sprite.from(NOTE_TEXTURE);
    note.x = NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH / 2;
    note.width = NODE_WIDTH;
    note.height = NODE_WIDTH;

    const basicText = new PIXI.Text('Basic text in pixi', {
      fontFamily: 'Arial',
      fontSize: 36,
      fontStyle: 'italic',
      fontWeight: 'bold',
      wordWrap: true,
      wordWrapWidth: 440,
      lineJoin: 'round',
    });
    basicText.x = NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH;
    basicText.y = NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH;

    // const input = new (PIXI as any).TextInput({
    //   input: {
    //     fontFamily: 'Arial',
    //     fontSize: '25px',
    //     multiline: true,
    //     width: `${NODE_WIDTH - NODE_OUTLINE_DISTANCE * 2}px`,
    //     height: `${NODE_WIDTH - NODE_OUTLINE_DISTANCE * 2}px`,
    //   },
    //   box: {},
    //   // box: { fill: 0xeeeeee },
    // });
    // input.x = NODE_OUTLINE_DISTANCE + INPUTSOCKET_WIDTH;
    // input.y = NODE_OUTLINE_DISTANCE;
    // input.placeholder = 'Enter your Text...';
    // input.substituteText = true;
    // input.focus();

    // this._rectRef.on('pointerdown', this.trigger.bind(this));

    this.drawShape = function () {
      this._BackgroundRef.visible = false;
      this._NodeNameRef.visible = false;
      // this._rectRef.clear();

      (this._rectRef as any) = (this as PIXI.Container).addChild(note);
      this._rectRef.alpha = 1;
      this._rectRef.tint;
      // this._rectRef.buttonMode = true;
      // this._rectRef.interactive = true;

      this._textInputRef = (this as PIXI.Container).addChild(basicText);
      this._textInputRef.width = NODE_WIDTH - NODE_OUTLINE_DISTANCE * 2;
      // this._textInputRef.height  = NODE_WIDTH - NODE_OUTLINE_DISTANCE * 2;
      // (this._textInputRef as any) = (this as PIXI.Container).addChild(input);
    };

    this.onExecute = function () {
      const inputText = this.getInputData(0);
      this._textInputRef.text = inputText;
      this.setOutputData(0, inputText);
    };

    // update shape after initializing
    this.drawNodeShape(false);
  }

  trigger(): void {
    console.log('Triggered node: ', this.name);
    this.outputSocketArray[0].links.forEach((link) => {
      (link.target.parent as any).trigger();
    });
  }

  onButtonOver(): void {
    this._rectRef.cursor = 'hover';
  }
}

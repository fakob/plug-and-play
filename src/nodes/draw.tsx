import * as PIXI from 'pixi.js';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  Table as BPTable,
  Column as BPColumn,
  Cell as BPCell,
} from '@blueprintjs/table';
import * as csvParser from 'papaparse';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs, SerializedNode } from '../utils/interfaces';
import textFit from '../pixi/textFit';
import { rgbToHex } from '../pixi/utils-pixi';
import { convertToArray, getElement } from '../utils/utils';
import {
  DATATYPE,
  EMPTY_TEXTURE,
  NODE_HEADER_HEIGHT,
  NODE_OUTLINE_DISTANCE,
  NODE_WIDTH,
  NOTE_FONTSIZE,
  NOTE_LINEHEIGHT_FACTOR,
  NOTE_MARGIN_STRING,
  NOTE_PADDING,
  NOTE_TEXTURE,
  SOCKET_WIDTH,
} from '../utils/constants';

export class DrawRect extends PPNode {
  _color: number;
  _rectRef: PIXI.Graphics;

  // uses customArgs?.color as defaultColor
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);
    let convertedColor;

    if (customArgs?.color === undefined) {
      convertedColor = PIXI.utils.string2hex('#00FF00');
    } else {
      convertedColor = PIXI.utils.string2hex(rgbToHex(customArgs?.color));
    }

    this.addInput('x', DATATYPE.NUMBER, 0);
    this.addInput('y', DATATYPE.NUMBER, 0);
    this.addInput('width', DATATYPE.NUMBER, 50);
    this.addInput('height', DATATYPE.NUMBER, 100);
    this.addInput('color', DATATYPE.COLOR, convertedColor);

    this.name = 'Draw Rect';
    this.description = 'Draws a rectangle';

    const rect = new PIXI.Graphics();
    this._rectRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container).addChild(rect);

    this._rectRef.beginFill(convertedColor, 0.5);
    this._rectRef.drawRect(this.x, this.y, this.width, this.height);
    this._rectRef.endFill();

    this.onExecute = function (input, output) {
      const x = input['x'] || 0;
      const y = input['y'] || 0;
      const width = input['width'] || 100;
      const height = input['height'] || 100;
      const color = (input['color'] as number[]) || [255, 0, 0, 0.5];
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
    };
  }
}

export class Rect extends PPNode {
  _color: number;
  _rectRef: PIXI.Graphics;

  // uses customArgs?.color as defaultColor
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);

    let convertedColor;
    if (customArgs?.color === undefined) {
      convertedColor = PIXI.utils.string2hex('#00FF00');
    } else {
      convertedColor = PIXI.utils.string2hex(rgbToHex(customArgs?.color));
    }

    this.addOutput('rect', DATATYPE.PIXI);
    this.addInput('x', DATATYPE.NUMBER, 0);
    this.addInput('y', DATATYPE.NUMBER, 0);
    this.addInput('width', DATATYPE.NUMBER, 50);
    this.addInput('height', DATATYPE.NUMBER, 100);
    this.addInput('color', DATATYPE.COLOR, convertedColor);

    this.name = 'Create Rect';
    this.description = 'Creates a rectangle';

    const rect = new PIXI.Graphics();
    this._rectRef = rect;
    this._rectRef.beginFill(convertedColor, 0.5);
    this._rectRef.drawRect(this.x, this.y, this.width, this.height);
    this._rectRef.endFill();

    this.onExecute = function (input, output) {
      const x = input['x'] || 0;
      const y = input['y'] || 0;
      const width = input['width'] || 100;
      const height = input['height'] || 100;
      const color = input['color'] || [255, 0, 0, 0.5];
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
      this.setOutputData('rect', this._rectRef);
    };
  }
}

export class Container extends PPNode {
  _containerRef: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);
    this.addInput('x', DATATYPE.NUMBER);
    this.addInput('y', DATATYPE.NUMBER);
    this.addInput('scale', DATATYPE.NUMBER, 1.0);
    this.addInput('input1', DATATYPE.PIXI);
    this.addInput('input2', DATATYPE.PIXI);
    this.addInput('input3', DATATYPE.PIXI);

    this.name = 'Container';
    this.description = 'General-purpose display object that holds children';

    const container = new PIXI.Container();
    this._containerRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container).addChild(container);

    this.onExecute = function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const scale = input['scale'];
      const input1 = input['input1'];
      const input2 = input['input2'];
      const input3 = input['input3'];
      console.log(input1, input2, input3);
      console.log(this._containerRef);
      this._containerRef.removeChildren;

      input1 === undefined ? undefined : this._containerRef.addChild(input1);
      input2 === undefined ? undefined : this._containerRef.addChild(input2);
      input3 === undefined ? undefined : this._containerRef.addChild(input3);
      this._containerRef.x = this.x + this.width + x;
      this._containerRef.y = this.y + y;
      this._containerRef.scale.set(scale);
    };
  }
}

export class Note extends PPNode {
  _rectRef: PIXI.Sprite;
  _textInputRef: PIXI.Text;
  createInputElement;
  currentInput: HTMLDivElement;
  setCleanAndDisplayText: (input: HTMLDivElement) => void;
  setCleanText: (text: string) => void;
  onViewportMove: (event: PIXI.InteractionEvent) => void;
  onViewportMoveHandler: (event?: PIXI.InteractionEvent) => void;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, customArgs);
    this.addOutput('textOutput', DATATYPE.STRING);
    this.addOutput('fontSize', DATATYPE.NUMBER, false);
    this.addInput('textInput', DATATYPE.STRING, 'type...');
    this.addInput('fontSize', DATATYPE.NUMBER, NOTE_FONTSIZE, false);

    this.name = 'Note';
    this.description = 'Adds a note';
    const note = PIXI.Sprite.from(NOTE_TEXTURE);
    note.x = SOCKET_WIDTH / 2;
    note.y = NODE_OUTLINE_DISTANCE;
    note.width = NODE_WIDTH;
    note.height = NODE_WIDTH;

    this.currentInput = null;

    const textFitOptions = {
      multiLine: true,
      maxFontSize: 60,
      // alignVertWithFlexbox: true,
    };

    //
    this.onViewportMove = function (event: PIXI.InteractionEvent): void {
      // console.log('onViewportMove', event);
      const screenPoint = this.graph.viewport.toScreen(this.x, this.y);
      this.currentInput.style.transform = `scale(${this.graph.viewport.scale.x}`;
      this.currentInput.style.left = `${screenPoint.x}px`;
      this.currentInput.style.top = `${screenPoint.y}px`;
    };
    this.onViewportMoveHandler = this.onViewportMove.bind(this);

    const basicText = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: NOTE_FONTSIZE,
      lineHeight: NOTE_FONTSIZE * NOTE_LINEHEIGHT_FACTOR,
      align: 'center',
      whiteSpace: 'pre-line',
      wordWrap: true,
      wordWrapWidth: NODE_WIDTH - NOTE_PADDING,
      lineJoin: 'round',
    });
    basicText.anchor.set(0.5, 0.5);
    basicText.x = (SOCKET_WIDTH + NODE_WIDTH) / 2;
    basicText.y = (NODE_OUTLINE_DISTANCE + NODE_WIDTH) / 2;

    this.onDrawNodeShape = function () {
      this._BackgroundRef.visible = false;
      this._NodeNameRef.visible = false;

      (this._rectRef as any) = (this as PIXI.Container).addChild(note);
      this._rectRef.alpha = 1;
      this._rectRef.tint;

      this._textInputRef = (this as PIXI.Container).addChild(basicText);
    };

    this.createInputElement = () => {
      // create html input element
      this.currentInput = document.createElement('div');
      this.currentInput.id = 'NoteInput';
      this.currentInput.contentEditable = 'true';
      this.currentInput.innerHTML = this.inputSocketArray[0].data;
      this._textInputRef.visible = false;
      this.currentInput.style.fontFamily = 'Arial';
      // this.currentInput.style.fontStyle = 'italic';
      // this.currentInput.style.fontWeight = 'bold';
      this.currentInput.style.fontSize = this._textInputRef.style.fontSize;
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

    this.onExecute = (input, output) => {
      const inputText = input['input'];
      this._textInputRef.text = inputText;
      this.setOutputData('textOutput', inputText);
    };

    // update shape after initializing
    this.drawNodeShape(false);
  }
}

export class PPImage extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;

  // uses customArgs?.objectURL as texture
  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    super(name, graph, customArgs);
    this.addOutput('image', DATATYPE.PIXI);
    this.addOutput('width', DATATYPE.NUMBER);
    this.addOutput('height', DATATYPE.NUMBER);
    this.addInput('reload', DATATYPE.TRIGGER);
    this.addInput('url', DATATYPE.STRING);

    this.name = 'Image';
    this.description = 'Adds an image';

    const image = PIXI.Sprite.from(customArgs?.objectURL || EMPTY_TEXTURE);
    image.x = SOCKET_WIDTH / 2;
    image.y = NODE_OUTLINE_DISTANCE;
    image.width = NODE_WIDTH;
    image.height = NODE_WIDTH;

    this._imageRefClone = PIXI.Sprite.from(
      customArgs?.objectURL || EMPTY_TEXTURE
    );

    this.onDrawNodeShape = function () {
      this._BackgroundRef.visible = false;
      this._NodeNameRef.visible = false;

      (this._imageRef as any) = (this as PIXI.Container).addChild(image);
      this._imageRef.alpha = 1;
      this._imageRef.tint;
    };

    // update shape after initializing
    this.drawNodeShape(false);
  }

  trigger(): void {
    const url: string = this.getInputData('url');
    // if url is set then get image
    if (url !== '') {
      // const objectURL = URL.createObjectURL(url);
      const newTexture = PIXI.Texture.from(url);
      this._imageRef.texture = newTexture;
      this._imageRefClone.texture = newTexture;
    }
    const { width, height } = this._imageRef.texture.orig;
    this.setOutputData('image', this._imageRefClone);
    this.setOutputData('width', width);
    this.setOutputData('height', height);
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
      nodeWidth,
      nodeHeight,
      isHybrid,
    });
    this.addOutput('selectedData', DATATYPE.STRING);
    this.addInput('reload', DATATYPE.TRIGGER);
    this.addInput('data', DATATYPE.STRING, customArgs?.data ?? '');

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

    // small presentational component
    const TableParent = () => {
      return this.parsedData.length > 0 ? (
        <BPTable numRows={this.parsedData.length}>
          {this.parsedData[0].map((col, index) => {
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

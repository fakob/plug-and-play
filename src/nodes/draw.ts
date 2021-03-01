import * as PIXI from 'pixi.js';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import PPGraph from '../GraphClass';
import PPNode from '../NodeClass';
import { SerializedNode } from '../interfaces';
import textFit from '../pixi/textFit';
import { rgbToHex, getTextWithLineBreaks } from '../pixi/utils-pixi';
import { convertToArray, getElement, mapRange } from '../utils';
import {
  EMPTY_TEXTURE,
  INPUTTYPE,
  OUTPUTTYPE,
  NOTE_PADDING,
  NOTE_TEXTURE,
  NODE_WIDTH,
  NODE_OUTLINE_DISTANCE,
  INPUTSOCKET_WIDTH,
} from '../constants';

const ffmpeg = createFFmpeg({
  log: true,
  corePath: './node_modules/@ffmpeg/core/dist/ffmpeg-core.js',
});

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
    this.addInput('x', INPUTTYPE.NUMBER);
    this.addInput('y', INPUTTYPE.NUMBER);
    this.addInput('scale', INPUTTYPE.NUMBER, 1.0);
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
      const x = this.getInputData(0);
      const y = this.getInputData(1);
      const scale = this.getInputData(2);
      const input1 = this.getInputData(3);
      const input2 = this.getInputData(4);
      const input3 = this.getInputData(5);
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

  constructor(name: string, graph: PPGraph, customId: string) {
    super(name, graph, customId);
    this.addOutput('output', OUTPUTTYPE.STRING);
    this.addInput('input', INPUTTYPE.STRING, 'type...');

    this.name = 'Note';
    this.description = 'Adds a note';
    const note = PIXI.Sprite.from(NOTE_TEXTURE);
    note.x = INPUTSOCKET_WIDTH / 2;
    note.y = NODE_OUTLINE_DISTANCE;
    note.width = NODE_WIDTH;
    note.height = NODE_WIDTH;

    this.currentInput = null;

    const textFitOptions = {
      multiLine: true,
      maxFontSize: 50,
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
      fontSize: 36,
      // fontStyle: 'italic',
      // fontWeight: 'bold',
      align: 'center',
      whiteSpace: 'pre-line',
      wordWrap: true,
      wordWrapWidth: NODE_WIDTH - NOTE_PADDING,
      lineJoin: 'round',
    });
    basicText.anchor.set(0.5, 0.5);
    basicText.x = (INPUTSOCKET_WIDTH + NODE_WIDTH) / 2;
    basicText.y = (NODE_OUTLINE_DISTANCE + NODE_WIDTH) / 2;

    this.drawShape = function () {
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
      this.currentInput.innerHTML = this.inputSocketArray[0].defaultValue;
      this._textInputRef.visible = false;
      this.currentInput.style.fontFamily = 'Arial';
      // this.currentInput.style.fontStyle = 'italic';
      // this.currentInput.style.fontWeight = 'bold';
      this.currentInput.style.fontSize = this._textInputRef.style.fontSize;
      this.currentInput.style.textAlign = 'center';
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
      this.currentInput.style.width = `${
        NODE_WIDTH + INPUTSOCKET_WIDTH - NOTE_PADDING * 2
      }px`;
      this.currentInput.style.height = `${NODE_WIDTH - NOTE_PADDING * 2}px`;
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
      this._textInputRef.style.fontSize = style.fontSize;
      this._textInputRef.text = input.textContent;
      this.setCleanText(input.textContent);
    };

    this.setCleanText = (text: string) => {
      this.inputSocketArray[0].value = text;
      this.inputSocketArray[0].defaultValue = text;
      this.setOutputData(0, text);
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

    this.onExecute = () => {
      const inputText = this.getInputData(0);
      this._textInputRef.text = inputText;
      this.setOutputData(0, inputText);
    };

    // update shape after initializing
    this.drawNodeShape(false);
  }
}

export class PPImage extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;

  constructor(
    name: string,
    graph: PPGraph,
    customId: string,
    customArgsObject?: {
      objectURL: string;
    }
  ) {
    super(name, graph, customId);
    this.addOutput('image', OUTPUTTYPE.PIXI);
    this.addOutput('width', OUTPUTTYPE.NUMBER);
    this.addOutput('height', OUTPUTTYPE.NUMBER);
    this.addInput('Reload', INPUTTYPE.TRIGGER);
    this.addInput('url', INPUTTYPE.STRING);

    this.name = 'Image';
    this.description = 'Adds an image';

    const image = PIXI.Sprite.from(
      customArgsObject?.objectURL || EMPTY_TEXTURE
    );
    image.x = INPUTSOCKET_WIDTH / 2;
    image.y = NODE_OUTLINE_DISTANCE;
    image.width = NODE_WIDTH;
    image.height = NODE_WIDTH;

    this._imageRefClone = PIXI.Sprite.from(
      customArgsObject?.objectURL || EMPTY_TEXTURE
    );

    this.drawShape = function () {
      this._BackgroundRef.visible = false;
      this._NodeNameRef.visible = false;

      (this._imageRef as any) = (this as PIXI.Container).addChild(image);
      this._imageRef.alpha = 1;
      this._imageRef.tint;
    };

    // this.onConfigure = (node_info: SerializedNode) => {
    //   console.log('onConfigure on Note:', node_info);
    //   this.createInputElement();
    //   this.currentInput.dispatchEvent(new Event('input'));
    //   this.currentInput.dispatchEvent(new Event('blur'));
    // };

    // this.onNodeDoubleClick = () => {
    //   console.log('_onDoubleClick on Note:', this);
    //   this.createInputElement();
    // };

    // this.onExecute = () => {};

    // update shape after initializing
    this.drawNodeShape(false);
  }

  trigger(): void {
    const url: string = this.getInputData(1);
    // if url is set then get image
    if (url !== '') {
      // const objectURL = URL.createObjectURL(url);
      const newTexture = PIXI.Texture.from(url);
      this._imageRef.texture = newTexture;
      this._imageRefClone.texture = newTexture;
    }
    const { width, height } = this._imageRef.texture.orig;
    this.setOutputData(0, this._imageRefClone);
    this.setOutputData(1, width);
    this.setOutputData(2, height);
  }
}

export class PPVideo extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  _sourceURL: string;
  _thumbArray: {
    spriteRef: PIXI.Sprite;
    textureRef: PIXI.Texture;
  }[];

  constructor(
    name: string,
    graph: PPGraph,
    customId: string,
    customArgsObject?: {
      thumbURL: string;
      sourceURL: string;
    }
  ) {
    super(name, graph, customId);
    this.addOutput('image', OUTPUTTYPE.PIXI);
    this.addOutput('width', OUTPUTTYPE.NUMBER);
    this.addOutput('height', OUTPUTTYPE.NUMBER);
    this.addInput('Reload', INPUTTYPE.TRIGGER);
    this.addInput('url', INPUTTYPE.STRING);
    this.addInput('amountOfStills', INPUTTYPE.NUMBER);

    this.name = 'Video';
    this.description = 'Adds a video';
    this._sourceURL = customArgsObject?.sourceURL;

    const image = PIXI.Sprite.from(customArgsObject?.thumbURL || EMPTY_TEXTURE);
    image.x = INPUTSOCKET_WIDTH / 2;
    image.y = NODE_OUTLINE_DISTANCE;
    image.width = NODE_WIDTH;
    image.height = NODE_WIDTH;

    this._imageRefClone = PIXI.Sprite.from(
      customArgsObject?.thumbURL || EMPTY_TEXTURE
    );

    this.drawShape = function () {
      this._BackgroundRef.visible = false;
      this._NodeNameRef.visible = false;

      (this._imageRef as any) = (this as PIXI.Container).addChild(image);
      this._imageRef.alpha = 1;
      this._imageRef.tint;
    };

    // this.onConfigure = (node_info: SerializedNode) => {
    //   console.log('onConfigure on Note:', node_info);
    //   this.createInputElement();
    //   this.currentInput.dispatchEvent(new Event('input'));
    //   this.currentInput.dispatchEvent(new Event('blur'));
    // };

    // this.onNodeDoubleClick = () => {
    //   console.log('_onDoubleClick on Note:', this);
    //   this.createInputElement();
    // };

    // this.onExecute = () => {};

    // update shape after initializing
    this.drawNodeShape(false);
  }

  captureThumbs(amountOfStills: number): void {
    console.log(this._sourceURL);
    (async () => {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }
      ffmpeg.FS(
        'writeFile',
        'fetchedVideo.mp4',
        await fetchFile(this._sourceURL)
      );
      let duration: number;
      let ratio: number;
      ffmpeg.setProgress((info: any) => {
        console.log(info);
        if (info.duration != null) {
          duration += info.duration; // if I expect multiple durations, I can add them
        }
        if (info.time != null) {
          ratio = info.time / duration; // I can ignore `info.ratio` here, since I know it's wrong
        }
      });
      await ffmpeg.run(
        '-i', // input file url
        'fetchedVideo.mp4',
        '-f', // force input or output file format
        'null',
        'out'
      );
      console.log(duration, ratio);

      // const data = ffmpeg.FS('readFile', 'out');
      // console.log(amountOfStills, data);
      // const frameNumberArray = Array.from(
      //   Array(amountOfStills).keys()
      // ).map((x) => mapRange(x, 0, amountOfStills - 1, 0, frameCount - 1, true));
      // await ffmpeg.run(
      //   '-ss', // seek position (start)
      //   '00:00:00',
      //   '-i', // input file url
      //   'fetchedVideo.mp4',
      //   '-vf', // create video filtergraph
      //   'scale=-2:200', // scale w:h
      //   // '-c:v', // encoder
      //   // 'png'
      //   '-f', // force input or output file format
      //   'image2',
      //   '-vframes', // number of video frames to output
      //   '1',
      //   '-q:v', // quality video stream
      //   '10',
      //   'output.png'
      // );
      // const data = ffmpeg.FS('readFile', 'output.png');
      // const objectUrlFromStill = URL.createObjectURL(
      //   new Blob([data.buffer], { type: 'image/png' })
      // );
      // ffmpeg.FS('unlink', 'fetchedVideo.mp4');
      // console.log(objectUrlFromStill);
    })();
  }

  trigger(): void {
    const url: string = this.getInputData(1);
    const amountOfStills: number = this.getInputData(2);

    // if url is set then get image
    if (url !== '') {
      // const objectURL = URL.createObjectURL(url);
      const newTexture = PIXI.Texture.from(url);
      this._imageRef.texture = newTexture;
      this._imageRefClone.texture = newTexture;
    }

    this.captureThumbs(amountOfStills);

    const { width, height } = this._imageRef.texture.orig;
    this.setOutputData(0, this._imageRefClone);
    this.setOutputData(1, width);
    this.setOutputData(2, height);
  }
}

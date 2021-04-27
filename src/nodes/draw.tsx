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
import textFit from '../pixi/textFit';
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
  SOCKET_WIDTH,
} from '../utils/constants';

export class Circle extends PPNode {
  _circleRef: PIXI.Graphics;

  // uses customArgs?.color as defaultColor
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const radius = 50;
    const rectColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('circle', DATATYPE.PIXI);
    this.addInput('x', DATATYPE.NUMBER, 0);
    this.addInput('y', DATATYPE.NUMBER, 0);
    this.addInput(
      'radius',
      DATATYPE.NUMBER,
      customArgs?.radius ?? radius,
      false
    );

    this.addInput('color', DATATYPE.COLOR, Color(rectColor).array());

    this.name = 'Draw circle';
    this.description = 'Draws a circle';

    const rect = new PIXI.Graphics();
    this._circleRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Graphics).addChild(rect);
    this.setOutputData('circle', this._circleRef);

    this._circleRef.beginFill(PIXI.utils.string2hex(Color(rectColor).hex()), 1);
    this._circleRef.drawCircle(
      this.x + this.width + radius,
      this.y + radius,
      radius
    );
    this._circleRef.endFill();

    this.onExecute = function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const radius = input['radius'];
      const color = Color.rgb(input['color'] as number[]);

      this._circleRef.clear();
      this._circleRef.beginFill(
        PIXI.utils.string2hex(color.hex()),
        color.alpha()
      );

      // if output is not connected, then draw it next to the node
      if ((this as PPNode).getOutputSocketByName('circle')?.hasLink()) {
        this._circleRef.drawCircle(x + radius, y + radius, radius);
        this._circleRef.visible = false;
      } else {
        this._circleRef.drawCircle(
          this.x + this.width + radius + x,
          this.y + radius + y,
          radius
        );
        this._circleRef.visible = true;
      }
      this._circleRef.endFill();
    };

    this.onNodeRemoved = (): void => {
      (this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Graphics).removeChild(this._circleRef);
    };
  }
}

export class Rect extends PPNode {
  _rectRef: PIXI.Graphics;

  // uses customArgs?.color as defaultColor
  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;
    const rectWidth = 100;
    const rectHeight = 100;
    const rectColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.addOutput('rectangle', DATATYPE.PIXI);
    this.addInput('x', DATATYPE.NUMBER, 0);
    this.addInput('y', DATATYPE.NUMBER, 0);
    this.addInput(
      'width',
      DATATYPE.NUMBER,
      customArgs?.width ?? rectWidth,
      false
    );
    this.addInput(
      'height',
      DATATYPE.NUMBER,
      customArgs?.height ?? rectHeight,
      false
    );
    this.addInput('color', DATATYPE.COLOR, Color(rectColor).array());

    this.name = 'Draw rectangle';
    this.description = 'Draws a rectangle';

    const rect = new PIXI.Graphics();
    this._rectRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Graphics).addChild(rect);
    this.setOutputData('rectangle', this._rectRef);

    this._rectRef.beginFill(PIXI.utils.string2hex(Color(rectColor).hex()), 1);
    this._rectRef.drawRect(this.x + this.width, this.y, rectWidth, rectHeight);
    this._rectRef.endFill();

    this.onExecute = function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const width = input['width'];
      const height = input['height'];
      const color = Color.rgb(input['color'] as number[]);

      this._rectRef.clear();
      this._rectRef.beginFill(
        PIXI.utils.string2hex(color.hex()),
        color.alpha()
      );

      // if output is not connected, then draw it next to the node
      if ((this as PPNode).getOutputSocketByName('rectangle')?.hasLink()) {
        this._rectRef.drawRect(x, y, width, height);
        this._rectRef.visible = false;
      } else {
        this._rectRef.drawRect(
          this.x + this.width + x,
          this.y + y,
          width,
          height
        );
        this._rectRef.visible = true;
      }
      this._rectRef.endFill();
      // output['rectangle'] = this._rectRef;
    };

    this.onNodeRemoved = (): void => {
      (this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Graphics).removeChild(this._rectRef);
    };
  }
}

export class Container extends PPNode {
  _containerRef: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DRAW,
    });

    this.addOutput('container', DATATYPE.PIXI);
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
    this.setOutputData('container', this._containerRef);

    this.onExecute = function (input, output) {
      const x = input['x'];
      const y = input['y'];
      const scale = input['scale'];
      const input1 = input['input1'];
      const input2 = input['input2'];
      const input3 = input['input3'];
      // console.log(input1, input2, input3);
      // console.log(this._containerRef);
      this._containerRef.removeChildren();

      input1 == undefined ? undefined : this._containerRef.addChild(input1);
      input2 == undefined ? undefined : this._containerRef.addChild(input2);
      input3 == undefined ? undefined : this._containerRef.addChild(input3);

      // if output is not connected, then draw it next to the node
      if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
        this._containerRef.x = x;
        this._containerRef.y = y;
        this._containerRef.visible = false;
      } else {
        this._containerRef.x = this.x + this.width + x;
        this._containerRef.y = this.y + y;
        this._containerRef.visible = true;
      }
      this._containerRef.scale.set(scale);
    };

    this.onNodeRemoved = (): void => {
      (this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Graphics).removeChild(this._containerRef);
    };
  }
}

export class GraphicsMultiplier extends PPNode {
  _containerRef: PIXI.Container;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DRAW,
    });

    this.addOutput('container', DATATYPE.PIXI);
    this.addInput('input', DATATYPE.PIXI);
    this.addInput('count', DATATYPE.NUMBER, 9, undefined, {
      round: true,
      minValue: 0,
    });
    this.addInput('column', DATATYPE.NUMBER, 3, undefined, {
      round: true,
      minValue: 0,
    });
    this.addInput('distance', DATATYPE.NUMBER, 10.0);
    this.addInput('scale', DATATYPE.NUMBER, 1.0);
    this.addInput('adjustArray', DATATYPE.ARRAY);

    this.name = 'GraphicsMultiplier';
    this.description = 'Multiplies the input graphics';

    const container = new PIXI.Container();
    this._containerRef = (this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container).addChild(container);
    this.setOutputData('container', this._containerRef);
    this._containerRef.name = this.id;

    this.onExecute = function (input, output) {
      const input1: PIXI.DisplayObject = input['input'];
      const count = input['count'];
      const column = input['column'];
      const distance = input['distance'];
      const scale = input['scale'];
      const adjustArray = input['adjustArray'];
      this._containerRef.removeChildren();

      if (input1 != undefined) {
        let x = 0;
        let y = 0;

        // if output is not connected, then draw it next to the node
        if ((this as PPNode).getOutputSocketByName('container')?.hasLink()) {
          this._containerRef.x = 0;
          this._containerRef.y = 0;
          this._containerRef.visible = false;
        } else {
          x = this.x + this.width;
          y = this.y;
          this._containerRef.visible = true;
        }

        switch (input1.constructor.name) {
          case 'Graphics':
            for (let indexCount = 0; indexCount < count; indexCount++) {
              const clone = (input1 as PIXI.Graphics).clone();
              clone.name = `${this.id}-${indexCount}`;
              clone.x = x + (clone.width + distance) * (indexCount % column);
              clone.y =
                y + (clone.height + distance) * Math.floor(indexCount / column);
              if (adjustArray?.[indexCount]?.height !== undefined) {
                clone.height = adjustArray[indexCount].height;
              }
              if (adjustArray?.[indexCount]?.width !== undefined) {
                clone.width = adjustArray[indexCount].width;
              }
              this._containerRef.addChild(clone);
            }
            break;
          case 'Container':
            const children = (input1 as PIXI.Container).children;
            for (let indexCount = 0; indexCount < count; indexCount++) {
              const subContainer = this._containerRef.addChild(
                new PIXI.Container()
              );
              subContainer.name = `${this.id}-subContainer-${indexCount}`;
              for (
                let indexChildren = 0;
                indexChildren < children.length;
                indexChildren++
              ) {
                const element = children[indexChildren];
                const clone = (element as PIXI.Graphics).clone();
                clone.name = `${subContainer.name}-${indexChildren}`;
                clone.x = element.x;
                clone.y = element.y;
                subContainer.addChild(clone);
              }
              subContainer.x =
                x + (subContainer.width + distance) * (indexCount % column);
              subContainer.y =
                y +
                (subContainer.height + distance) *
                  Math.floor(indexCount / column);
              this._containerRef.addChild(subContainer);
            }
            break;

          default:
            break;
        }
        this._containerRef.scale.set(scale);
      }
    };

    this.onNodeRemoved = (): void => {
      (this.graph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Graphics).removeChild(this._containerRef);
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

export class Image extends PPNode {
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

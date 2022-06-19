import * as PIXI from 'pixi.js';
import Color from 'color';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import { CustomArgs, TRgba } from '../utils/interfaces';
import {
  COLOR,
  COLOR_WHITE_TEXT,
  NODE_MARGIN,
  NOTE_FONT,
  NOTE_FONTSIZE,
  NOTE_LINEHEIGHT_FACTOR,
  NOTE_MARGIN_STRING,
  NOTE_PADDING,
  NOTE_TEXTURE,
  SOCKET_TYPE,
  SOCKET_WIDTH,
} from '../utils/constants';
import textFit from '../pixi/textFit';
import { StringType } from './datatypes/stringType';
import { NumberType } from './datatypes/numberType';
import { ColorType } from './datatypes/colorType';

export class Label extends PPNode {
  _refText: PIXI.Text;
  _refTextStyle: PIXI.TextStyle;
  currentInput: HTMLDivElement;
  createInputElement: () => void;

  public getName(): string {
    return 'Label';
  }

  public getDescription(): string {
    return 'Adds a text label';
  }

  protected getDefaultIO(): PPSocket[] {
    const nodeWidth = 128;
    const fontSize = 32;
    const fillColor = COLOR[5];

    return [
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new StringType(), false),
      new PPSocket(SOCKET_TYPE.IN, 'Input', new StringType(), '', false),
      new PPSocket(
        SOCKET_TYPE.IN,
        'fontSize',
        new NumberType(true, 1),
        fontSize,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'backgroundColor',
        new ColorType(),
        TRgba.fromString(fillColor),
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        'min-width',
        new NumberType(true, 1),
        nodeWidth,
        false
      ),
    ].concat(super.getDefaultIO());
  }

  getColor(): TRgba {
    return this.getInputData('backgroundColor');
  }

  constructor(name: string, customArgs?: CustomArgs) {
    const nodeWidth = 128;

    super(name, {
      ...customArgs,
      nodeWidth,
      roundedCorners: false,
    });

    const canvas = PPGraph.currentGraph.viewport.getChildByName(
      'foregroundCanvas'
    ) as PIXI.Container;
    this._refTextStyle = new PIXI.TextStyle();
    const basicText = new PIXI.Text('', this._refTextStyle);
    this._refText = canvas.addChild(basicText);
    this._refText.visible = false;

    // when the Node is added, focus it so one can start writing
    this.onNodeAdded = () => {
      this.currentInput = null;
      this.createInputElement();
    };

    // when the Node has been configured, remove focus
    this.onConfigure = () => {
      this.currentInput.remove();
      this._refText.visible = true;
    };

    this.createInputElement = () => {
      // create html input element
      const screenPoint = PPGraph.currentGraph.viewport.toScreen(
        this.x,
        this.y
      );
      const text = this.getInputData('Input');
      const fontSize = this.getInputData('fontSize');
      const color = this.getInputData('backgroundColor');
      const marginLeftRight = fontSize / 1.5;
      const marginTopBottom = fontSize / 2;

      this.currentInput = document.createElement('div');
      this.currentInput.id = 'Input';
      this.currentInput.contentEditable = 'true';
      this.currentInput.innerText = text;

      const style = {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize * (NOTE_LINEHEIGHT_FACTOR + 0.022)}px`, // 0.022 corrects difference between div and PIXI.Text
        textAlign: 'left',
        margin: NOTE_MARGIN_STRING,
        color: color.isDark() ? TRgba.white().hex() : TRgba.black().hex(),
        padding: `${marginTopBottom}px ${marginLeftRight}px`,
        position: 'absolute',
        background: 'transparent',
        border: '0 none',
        transformOrigin: 'top left',
        transform: `scale(${PPGraph.currentGraph.viewport.scale.x}`,
        outline: '0px dashed black',
        left: `${screenPoint.x}px`,
        top: `${screenPoint.y}px`,
        width: `${this.nodeWidth}px`,
        height: `${this.nodeHeight}px`,
      };
      Object.assign(this.currentInput.style, style);

      setTimeout(() => {
        // set caret to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(this.currentInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        // set focus
        this.currentInput.focus();
      }, 100);

      // add event handlers
      this.currentInput.addEventListener('blur', (e) => {
        console.log('blur', e);
        this.currentInput.remove();
        this._refText.visible = true;
        this.doubleClicked = false;
        this.executeOptimizedChain();
      });

      this.currentInput.addEventListener('input', (e) => {
        let text = (e as any).target.innerText;
        this._refText.text = text;
        const minWidth = this.getInputData('min-width');
        const textMetrics = PIXI.TextMetrics.measureText(
          text,
          this._refTextStyle
        );

        // correct for issue in chrome where pressing enter would add 2 line breaks
        // so I check for 2 empty line breaks at the end and delete one
        let textMetricsHeight = textMetrics.height;
        const length = textMetrics.lines.length;
        if (
          textMetrics.lines[length - 1] === '' &&
          textMetrics.lines[length - 2] === ''
        ) {
          text = textMetrics.text.substr(0, textMetrics.text.length - 2);
          this._refText.text = text;
          textMetricsHeight = textMetrics.lineHeight * (length - 1);
        }

        const newWidth = textMetrics.width + marginLeftRight * 2;
        const newHeight = textMetricsHeight * NOTE_LINEHEIGHT_FACTOR;
        this.currentInput.style.width = `${newWidth}px`;
        this.currentInput.style.height = `${newHeight + marginTopBottom * 2}px`;

        this.resizeNode(
          Math.max(minWidth, newWidth),
          newHeight + marginTopBottom
        );

        this.setInputData('Input', text);
        this.executeOptimizedChain();
      });

      document.body.appendChild(this.currentInput);
    };

    this.onNodeDoubleClick = () => {
      this._refText.visible = false;
      this.createInputElement();
    };

    this.onExecute = async (input, output) => {
      const text = String(input['Input']);
      const fontSize = input['fontSize'];
      const minWidth = input['min-width'];
      const color: TRgba = input['backgroundColor'];

      const marginTopBottom = fontSize / 2;
      const marginLeftRight = fontSize / 1.5;

      this._refTextStyle.fontSize = fontSize;
      this._refTextStyle.lineHeight = fontSize * NOTE_LINEHEIGHT_FACTOR;
      this._refTextStyle.fill = color.isDark()
        ? TRgba.white().hex()
        : TRgba.black().hex();

      const textMetrics = PIXI.TextMetrics.measureText(
        text,
        this._refTextStyle
      );

      this.resizeNode(
        Math.max(minWidth, textMetrics.width + marginLeftRight * 2),
        textMetrics.height + marginTopBottom * 2
      );
      output['Output'] = text;

      this._refText.text = text;
      this._refText.x = this.x + NODE_MARGIN + marginLeftRight;
      this._refText.y = this.y + marginTopBottom;
    };

    // scale input if node is scaled
    this.onNodeDragOrViewportMove = () => {
      if (this.currentInput != null) {
        const screenPoint = PPGraph.currentGraph.viewport.toScreen(
          this.x,
          this.y
        );
        this.currentInput.style.transform = `scale(${PPGraph.currentGraph.viewport.scale.x}`;
        this.currentInput.style.left = `${screenPoint.x}px`;
        this.currentInput.style.top = `${screenPoint.y}px`;
      }
    };

    this.onNodeRemoved = () => {
      this._refText.destroy();
    };
  }

  getShowLabels(): boolean {
    return false;
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class Note extends PPNode {
  _spriteRef: PIXI.Sprite;
  _bitmapTextRef: PIXI.BitmapText;
  _maskRef: PIXI.Graphics;
  currentInput: HTMLDivElement;
  fontSize: number;
  createInputElement: (temporary?: boolean) => void;
  setCleanAndDisplayText: (input: HTMLDivElement) => void;

  getShowLabels(): boolean {
    return false;
  }

  getOpacity(): number {
    return 0;
  }

  constructor(name: string, customArgs?: CustomArgs) {
    const baseWidth = 160;
    const baseHeight = 160;
    const defaultColor = COLOR_WHITE_TEXT;
    const baseFontSize = 60;
    const maxFontSize = 1200;

    // to compensate for that the note texture includes a drop shadow at the bottom
    const verticalTextureOffset = 0.92;

    super(name, {
      ...customArgs,
      nodeWidth: baseWidth,
      nodeHeight: baseHeight,
      minNodeHeight: baseHeight,
      roundedCorners: false,
    });

    this.currentInput = null;
    this.fontSize = baseFontSize;

    const textFitOptions = {
      multiLine: true,
      maxFontSize: maxFontSize,
    };

    this.onNodeAdded = () => {
      const loader = new PIXI.Loader();
      loader.add('NoteFont', NOTE_FONT).load(() => {
        const nodeWidth = this.nodeWidth ?? baseWidth;
        const nodeHeight = this.nodeHeight ?? baseHeight;

        this._NodeNameRef.visible = false;

        this._spriteRef = PIXI.Sprite.from(NOTE_TEXTURE);
        this._spriteRef.x = SOCKET_WIDTH / 2;
        this._spriteRef.y = 0;
        this._spriteRef.width = nodeWidth;
        this._spriteRef.height = nodeHeight;
        (this as PIXI.Container).addChild(this._spriteRef);
        this._spriteRef.alpha = 1;
        this._spriteRef.tint = PIXI.utils.string2hex(Color(defaultColor).hex());

        this._maskRef = new PIXI.Graphics();
        this._maskRef.beginFill(0xffffff);
        this._maskRef.drawRect(
          this._spriteRef.x,
          this._spriteRef.y,
          this._spriteRef.width,
          this._spriteRef.height
        );
        this._maskRef.endFill();
        (this as PIXI.Container).addChild(this._maskRef);

        // create and position PIXI.Text
        this._bitmapTextRef = new PIXI.BitmapText(this.getInputData('Input'), {
          fontName: 'Arial',
          fontSize: NOTE_FONTSIZE,
          align: 'center',
          maxWidth: nodeWidth - NOTE_PADDING * 2,
        });
        (this._bitmapTextRef.anchor as PIXI.Point) = new PIXI.Point(0.5, 0.5);
        this._bitmapTextRef.x = (SOCKET_WIDTH + nodeWidth) / 2;
        this._bitmapTextRef.y = (nodeHeight * verticalTextureOffset) / 2;
        (this as PIXI.Container).addChild(this._bitmapTextRef);
        this._bitmapTextRef.mask = this._maskRef;

        this.onNodeResized();
        this.executeOptimizedChain();
      });
    };

    this.createInputElement = (temporary = false) => {
      const nodeWidth = this.nodeWidth ?? baseWidth;
      const nodeHeight = this.nodeHeight ?? baseHeight;
      // create html input element
      this._bitmapTextRef.visible = false;
      const screenPoint = PPGraph.currentGraph.viewport.toScreen(
        this.x,
        this.y
      );

      this.currentInput = document.createElement('div');
      this.currentInput.id = 'Input';
      this.currentInput.contentEditable = 'true';
      this.currentInput.innerHTML = this.inputSocketArray[0].data;

      const style = {
        fontFamily: 'Arial',
        fontSize: `${this.fontSize}px`,
        lineHeight: `${NOTE_LINEHEIGHT_FACTOR}`,
        textAlign: 'center',
        margin: NOTE_MARGIN_STRING,
        padding: `${NOTE_PADDING}px`,
        position: 'absolute',
        background: 'transparent',
        border: '0 none',
        transformOrigin: 'top left',
        transform: `scale(${PPGraph.currentGraph.viewport.scale.x}`,
        outline: '0px dashed black',
        left: `${screenPoint.x}px`,
        top: `${screenPoint.y}px`,
        width: `${nodeWidth}px`,
        height: `${nodeHeight * verticalTextureOffset}px`,
        resize: 'none',
        overflowY: 'scroll',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        flexDirection: 'column',
      };
      Object.assign(this.currentInput.style, style);

      if (!temporary) {
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
      }

      this.currentInput.dispatchEvent(new Event('input'));

      // add event handlers
      this.currentInput.addEventListener('blur', (e) => {
        console.log('blur', e);
        this.currentInput.dispatchEvent(new Event('input'));
        this.setCleanAndDisplayText(this.currentInput);
        this.currentInput.remove();
        this._bitmapTextRef.visible = true;
        this.doubleClicked = false;
        this.executeOptimizedChain();
      });

      this.currentInput.addEventListener('input', () => {
        // run textFit to recalculate the font size
        textFit(this.currentInput, textFitOptions);
      });

      document.body.appendChild(this.currentInput);
    };

    this.setCleanAndDisplayText = (input: HTMLDivElement) => {
      const nodeWidth = this.nodeWidth ?? baseWidth;
      const nodeHeight = this.nodeHeight ?? baseHeight;

      // get font size of editable div
      const style = window.getComputedStyle(input.children[0], null);
      const newText = input.textContent;
      const newFontSize = parseInt(style.getPropertyValue('font-size'), 10);

      this._bitmapTextRef.fontSize = newFontSize;
      this._bitmapTextRef.text = input.textContent;
      this._bitmapTextRef.x = (SOCKET_WIDTH + nodeWidth) / 2;
      this._bitmapTextRef.y = (nodeHeight * verticalTextureOffset) / 2;

      this.setInputData('Input', newText);

      this.fontSize = newFontSize;
      this.executeOptimizedChain();
    };

    // scale input if node is scaled
    this.onNodeResize = (newWidth, newHeight) => {
      this.nodeWidth = newWidth;
      this.nodeHeight = newHeight;
      if (this._spriteRef !== undefined) {
        this._spriteRef.width = newWidth;
        this._spriteRef.height = newHeight;
        this._bitmapTextRef.maxWidth = newWidth - NOTE_PADDING * 2;
        this._bitmapTextRef.x = (SOCKET_WIDTH + newWidth) / 2;
        this._bitmapTextRef.y = (newHeight * verticalTextureOffset) / 2;
        this._maskRef.x = this._spriteRef.x;
        this._maskRef.y = this._spriteRef.y;
        this._maskRef.width = newWidth;
        this._maskRef.height = newHeight;
      }
      if (this.currentInput !== null) {
        this.currentInput.style.width = `${newWidth}px`;
        this.currentInput.style.height = `${
          newHeight * verticalTextureOffset
        }px`;
      }
    };

    this.onNodeResized = () => {
      if (this._bitmapTextRef !== undefined) {
        this._bitmapTextRef.visible = false;
        this.createInputElement(true);
        this.currentInput.dispatchEvent(new Event('input'));
        this.setCleanAndDisplayText(this.currentInput);
        this.currentInput.remove();
        this._bitmapTextRef.visible = true;
      }
    };

    this.onNodeDoubleClick = () => {
      console.log('onNodeDoubleClick:', this.id);
      this.createInputElement();
    };

    // scale input if node is scaled
    this.onNodeDragOrViewportMove = () => {
      if (this.currentInput !== null) {
        const screenPoint = PPGraph.currentGraph.viewport.toScreen(
          this.x,
          this.y
        );
        this.currentInput.style.transform = `scale(${PPGraph.currentGraph.viewport.scale.x}`;
        this.currentInput.style.left = `${screenPoint.x}px`;
        this.currentInput.style.top = `${screenPoint.y}px`;
      }
    };

    this.onExecute = async (input, output) => {
      if (!this.doubleClicked) {
        const nodeWidth = this.nodeWidth ?? baseWidth;
        const nodeHeight = this.nodeHeight ?? baseHeight;
        const data = input['Input'];
        if (this._bitmapTextRef) {
          this._bitmapTextRef.text = data;
          while (
            (this._bitmapTextRef.width > nodeWidth - NOTE_PADDING * 2 ||
              this._bitmapTextRef.height > nodeHeight - NOTE_PADDING * 2) &&
            this._bitmapTextRef.fontSize > 8
          ) {
            this._bitmapTextRef.fontSize -= 2;
          }
          this.fontSize = this._bitmapTextRef.fontSize;
          this._bitmapTextRef.text = data;
          output['Output'] = data;
        }
      }
    };
  }

  public getName(): string {
    return 'Note';
  }

  public getDescription(): string {
    return 'Adds a note';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new StringType(), false),
      new PPSocket(
        SOCKET_TYPE.IN,
        'Input',
        new StringType(),
        'Write away...',
        false
      ),
    ].concat(super.getDefaultIO());
  }
}

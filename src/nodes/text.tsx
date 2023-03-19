import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import { CustomArgs, TNodeSource, TRgba } from '../utils/interfaces';
import {
  NODE_MARGIN,
  NODE_SOURCE,
  NODE_TYPE_COLOR,
  NOTE_LINEHEIGHT_FACTOR,
  NOTE_MARGIN_STRING,
  SOCKET_TYPE,
} from '../utils/constants';
import { StringType } from './datatypes/stringType';
import { NumberType } from './datatypes/numberType';
import { ColorType } from './datatypes/colorType';

export class Label extends PPNode {
  _refText: PIXI.Text;
  _refTextStyle: PIXI.TextStyle;
  currentInput: HTMLDivElement;
  initialData: any;

  constructor(name: string, customArgs?: CustomArgs) {
    const nodeWidth = 128;

    super(name, {
      ...customArgs,
      nodeWidth,
    });

    this.initialData = customArgs?.initialData;

    this._refTextStyle = new PIXI.TextStyle();
    const basicText = new PIXI.Text('', this._refTextStyle);
    this._refText = this.addChild(basicText);
    this._refText.visible = false;
  }

  public getIsPresentationalNode(): boolean {
    return true;
  }

  getShowLabels(): boolean {
    return false;
  }

  getRoundedCorners(): boolean {
    return false;
  }

  getPreferredInputSocketName(): string {
    return 'Input';
  }

  public getName(): string {
    return 'Label';
  }

  public getDescription(): string {
    return 'Adds a text label';
  }

  protected getDefaultIO(): PPSocket[] {
    const nodeWidth = 128;
    const fontSize = 32;
    const fillColor = NODE_TYPE_COLOR.OUTPUT;

    return [
      new PPSocket(SOCKET_TYPE.OUT, 'Output', new StringType(), false),
      new PPSocket(SOCKET_TYPE.IN, 'Input', new StringType(), '', true),
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

  public onNodeAdded = (source?: TNodeSource) => {
    if (this.initialData) {
      this.setInputData('Input', this.initialData);
    }

    // if the Node is newly added, focus it so one can start writing
    if (source === NODE_SOURCE.NEW) {
      this.currentInput = null;
      this.createInputElement();
    } else {
      this._refText.visible = true;
    }

    super.onNodeAdded(source);
  };

  public createInputElement = () => {
    // create html input element
    const screenPoint = PPGraph.currentGraph.viewport.toScreen(this.x, this.y);
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
      transform: `scale(${PPGraph.currentGraph.viewportScaleX}`,
      outline: '0px dashed black',
      left: `${screenPoint.x}px`,
      top: `${screenPoint.y}px`,
      width: `${this.nodeWidth}px`,
      height: `${this.nodeHeight}px`,
    };
    Object.assign(this.currentInput.style, style);

    // TODO get rid of this, very bad
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

      this.resizeAndDraw(
        Math.max(minWidth, newWidth),
        newHeight + marginTopBottom
      );

      this.setInputData('Input', text);
      this.executeOptimizedChain();
    });

    document.body.appendChild(this.currentInput);
  };

  public onNodeDoubleClick = () => {
    this._refText.visible = false;
    this.createInputElement();
  };

  public onExecute = async (input, output) => {
    const text = String(input['Input']);
    const fontSize = Math.max(1, input['fontSize']);
    const minWidth = Math.max(1, input['min-width']);
    const color: TRgba = input['backgroundColor'];

    const marginTopBottom = fontSize / 2;
    const marginLeftRight = fontSize / 1.5;

    this._refTextStyle.fontSize = fontSize;
    this._refTextStyle.lineHeight = fontSize * NOTE_LINEHEIGHT_FACTOR;
    this._refTextStyle.fill = color.isDark()
      ? TRgba.white().hex()
      : TRgba.black().hex();

    const textMetrics = PIXI.TextMetrics.measureText(text, this._refTextStyle);

    this.resizeAndDraw(
      Math.max(minWidth, textMetrics.width + marginLeftRight * 2),
      textMetrics.height + marginTopBottom * 2
    );
    output['Output'] = text;

    this._refText.text = text;
    this._refText.x = NODE_MARGIN + marginLeftRight;
    this._refText.y = marginTopBottom;

    // TODO remove this insane hack
    setTimeout(() => {
      (this._refText.alpha = this.alpha), (this._refText.skew = this?.skew);
    }, 110);
  };

  // scale input if node is scaled
  public onNodeDragOrViewportMove = () => {
    if (this.currentInput != null) {
      const screenPoint = PPGraph.currentGraph.viewport.toScreen(
        this.x,
        this.y
      );
      this.currentInput.style.transform = `scale(${PPGraph.currentGraph.viewportScaleX}`;
      this.currentInput.style.left = `${screenPoint.x}px`;
      this.currentInput.style.top = `${screenPoint.y}px`;
    }
  };

  public onNodeRemoved = () => {
    this._refText.destroy();
  };

  public getShrinkOnSocketRemove(): boolean {
    return false;
  }
}

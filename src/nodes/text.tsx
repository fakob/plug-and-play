import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import { CustomArgs, TNodeSource, TRgba } from '../utils/interfaces';
import {
  NODE_SOURCE,
  NODE_TYPE_COLOR,
  NOTE_LINEHEIGHT_FACTOR,
  SOCKET_TYPE,
} from '../utils/constants';
import { convertToString, updateDataIfDefault } from '../utils/utils';
import { ActionHandler } from '../utils/actionHandler';
import { StringType } from './datatypes/stringType';
import { NumberType } from './datatypes/numberType';
import { ColorType } from './datatypes/colorType';

const LABEL_MAX_STRING_LENGTH = 10000;

const backgroundColorName = 'backgroundColor';
const inputSocketName = 'Input';
const outputSocketName = 'Output';
const fontSizeSocketName = 'fontSize';
const widthSocketName = 'Width';
const labelDefaultText = '';
const defaultNodeWidth = 128;

export class Label extends PPNode {
  PIXIText: PIXI.Text;
  PIXITextStyle: PIXI.TextStyle;
  HTMLTextComponent: HTMLDivElement;
  initialData: any;

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.initialData = customArgs?.initialData;

    this.PIXITextStyle = new PIXI.TextStyle();
    this.PIXITextStyle.breakWords = true;
    const basicText = new PIXI.Text(labelDefaultText, this.PIXITextStyle);
    this.PIXIText = this.addChild(basicText);
    this.PIXIVisible();
  }

  public getName(): string {
    return 'Label';
  }

  public getDescription(): string {
    return 'Adds a text label';
  }

  public getTags(): string[] {
    return ['Widget'].concat(super.getTags());
  }

  public getDefaultNodeWidth(): number {
    return defaultNodeWidth;
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
    return inputSocketName;
  }

  protected getDefaultIO(): PPSocket[] {
    const fontSize = 32;
    const fillColor = NODE_TYPE_COLOR.OUTPUT;

    return [
      new PPSocket(SOCKET_TYPE.OUT, outputSocketName, new StringType(), false),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketName,
        new StringType(),
        labelDefaultText,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        fontSizeSocketName,
        new NumberType(true, 1),
        fontSize,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        widthSocketName,
        new NumberType(true, 0, defaultNodeWidth * 10),
        undefined,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        backgroundColorName,
        new ColorType(),
        TRgba.fromString(fillColor),
        false
      ),
    ].concat(super.getDefaultIO());
  }

  getColor(): TRgba {
    return (
      this.getInputData(backgroundColorName) ||
      TRgba.fromString(NODE_TYPE_COLOR.DEFAULT)
    );
  }

  public onNodeAdded = (source?: TNodeSource) => {
    if (source === NODE_SOURCE.NEW) {
      this.HTMLVisible();
    }
    super.onNodeAdded(source);
  };

  public HTMLVisible() {
    this.PIXIText.visible = false;
    this.createInputElement();
    this.HTMLTextComponent.focus();

    // select all content
    window.getSelection().selectAllChildren(this.HTMLTextComponent);
  }

  public PIXIVisible() {
    this.PIXIText.visible = true;
    if (this.HTMLTextComponent) {
      this.HTMLTextComponent.hidden = true;
    }
    this.executeOptimizedChain();
  }

  public onNodeDoubleClick = () => {
    this.HTMLVisible();
  };

  public onViewportPointerUp(): void {
    super.onViewportPointerUp();
    this.PIXIVisible();
  }

  protected async onExecute(input, output): Promise<void> {
    let text = String(input[inputSocketName]);
    text =
      text.length > LABEL_MAX_STRING_LENGTH
        ? text.substring(0, LABEL_MAX_STRING_LENGTH) + '...'
        : text;

    const fontSize = Math.max(1, input[fontSizeSocketName]);
    const color: TRgba = input[backgroundColorName];

    this.PIXITextStyle.fontSize = fontSize;
    this.PIXITextStyle.lineHeight = fontSize * NOTE_LINEHEIGHT_FACTOR;
    this.PIXITextStyle.fill = color.isDark()
      ? TRgba.white().hex()
      : TRgba.black().hex();

    this.measureThenResizeAndDrawLabel(text);

    output[outputSocketName] = text;

    this.PIXIText.text = text;
    this.PIXIText.x = this.getMarginLeftRight();
    this.PIXIText.y = this.getMarginTopBottom();
  }

  private getMarginTopBottom(): number {
    const fontSize = this.getInputData(fontSizeSocketName);
    return fontSize / 2;
  }

  private getMarginLeftRight(): number {
    const fontSize = this.getInputData(fontSizeSocketName);
    return fontSize / 1.5;
  }

  private getHTMLComponentLeft(): number {
    return this.x + this.getMarginLeftRight();
  }
  private getHTMLComponentTop(): number {
    return this.y + this.getMarginTopBottom() + 1; // magic number 💀
  }

  private getInputWidth(): number {
    return Math.max(this.getMinNodeWidth(), this.getInputData(widthSocketName));
  }

  private useInputWidth(): boolean {
    return Boolean(this.getInputData(widthSocketName));
  }

  private setPixiTextStyleWidth(): void {
    if (this.useInputWidth()) {
      this.PIXITextStyle.wordWrap = true;
      this.PIXITextStyle.wordWrapWidth = this.getInputWidth();
    } else {
      this.PIXITextStyle.wordWrap = false;
    }
  }

  private resizeAndDrawLabel(width, height): void {
    this.resizeAndDraw(
      Math.max(
        this.getMinNodeWidth(),
        (this.useInputWidth() ? this.getInputWidth() : width) +
          this.getMarginLeftRight() * 2
      ),
      height + this.getMarginTopBottom() * 2
    );
  }

  private measureThenResizeAndDrawLabel = (text) => {
    this.setPixiTextStyleWidth();
    const textMetrics = PIXI.TextMetrics.measureText(text, this.PIXITextStyle);
    this.resizeAndDrawLabel(textMetrics.width, textMetrics.height);
    return textMetrics;
  };

  public onBeingScaled = (newWidth) => {
    const innerWidth = newWidth - this.getMarginLeftRight() * 2;
    this.setInputData(widthSocketName, innerWidth);
    this.measureThenResizeAndDrawLabel(this.getInputData(inputSocketName));
  };

  public resetSize(): void {
    this.setInputData(widthSocketName, 0);
    this.measureThenResizeAndDrawLabel(this.getInputData(inputSocketName));
  }

  public createInputElement = () => {
    // create html input element
    const htmlComponentId = `Label-${inputSocketName}`;
    const text = this.getInputData(inputSocketName);
    const fontSize = this.getInputData(fontSizeSocketName);
    const color = this.getInputData(backgroundColorName);
    const screenPoint = PPGraph.currentGraph.viewport.toScreen(
      this.getHTMLComponentLeft(),
      this.getHTMLComponentTop()
    );

    const existingElement = document.getElementById(
      htmlComponentId
    ) as HTMLDivElement;

    this.HTMLTextComponent = document.createElement('div');
    this.HTMLTextComponent.id = htmlComponentId;
    this.HTMLTextComponent.contentEditable = 'true';
    this.HTMLTextComponent.innerText = text;

    const style = {
      fontFamily: 'Arial',
      fontSize: `${fontSize}px`,
      lineHeight: `${fontSize * NOTE_LINEHEIGHT_FACTOR}px`,
      letterSpacing: '0px',
      textAlign: 'left',
      color: color.isDark() ? TRgba.white().hex() : TRgba.black().hex(),
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
      overflowWrap: 'anywhere',
    };
    Object.assign(this.HTMLTextComponent.style, style);

    // add event handlers
    this.HTMLTextComponent.addEventListener('blur', (e) => {
      this.PIXIVisible();
    });

    this.HTMLTextComponent.addEventListener('input', (e) => {
      const text = (e as any).target.innerText;
      this.PIXIText.text = text;

      const textMetrics = this.measureThenResizeAndDrawLabel(text);

      this.HTMLTextComponent.style.width = `${Math.max(
        20, // a small minimum width so the blinking cursor is visible
        textMetrics.width
      )}px`;
      this.HTMLTextComponent.style.height = `${textMetrics.height}px`;

      const id = this.id;
      const applyFunction = (newText) => {
        const node = ActionHandler.getSafeNode(id);
        node.setInputData(inputSocketName, newText);
        node.executeOptimizedChain();
      };

      ActionHandler.interfaceApplyValueFunction(
        this.id,
        this.getInputData(inputSocketName),
        text,
        applyFunction
      );
    });

    if (existingElement) {
      existingElement.replaceWith(this.HTMLTextComponent);
    } else {
      document.body.appendChild(this.HTMLTextComponent);
    }
  };

  // scale input if node is scaled
  public onNodeDragOrViewportMove = () => {
    if (this.HTMLTextComponent != null) {
      const screenPoint = PPGraph.currentGraph.viewport.toScreen(
        this.getHTMLComponentLeft(),
        this.getHTMLComponentTop()
      );
      this.HTMLTextComponent.style.transform = `scale(${PPGraph.currentGraph.viewportScaleX}`;
      this.HTMLTextComponent.style.left = `${screenPoint.x}px`;
      this.HTMLTextComponent.style.top = `${screenPoint.y}px`;
    }
  };

  public onNodeRemoved = () => {
    this.PIXIText.destroy();
  };

  public getShrinkOnSocketRemove(): boolean {
    return false;
  }

  public outputPlugged(): void {
    const dataToUpdate = convertToString(
      this.getSocketByName(outputSocketName).links[0].getTarget().defaultData
    );
    updateDataIfDefault(this, inputSocketName, labelDefaultText, dataToUpdate);
    super.outputPlugged();
  }
}

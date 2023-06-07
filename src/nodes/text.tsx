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
import { StringType } from './datatypes/stringType';
import { NumberType } from './datatypes/numberType';
import { ColorType } from './datatypes/colorType';
import { ActionHandler } from '../utils/actionHandler';

const backgroundColorName = 'backgroundColor';
const inputSocketName = 'Input';
const outputSocketName = 'Output';
const fontSizeSocketName = 'fontSize';
const labelDefaultText = '';

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
    return 128;
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
    //this.HTMLTextComponent.hidden = false;
    this.HTMLTextComponent.focus();
  }
  public PIXIVisible() {
    this.PIXIText.visible = true;
    if (this.HTMLTextComponent) {
      this.HTMLTextComponent.hidden = true;
    }
    this.executeOptimizedChain();
  }

  onPointerClick(event: PIXI.FederatedPointerEvent): void {
    this.HTMLVisible();
  }

  protected async onExecute(input, output): Promise<void> {
    const text = String(input[inputSocketName]);
    const fontSize = Math.max(1, input[fontSizeSocketName]);
    //const minWidth = Math.max(1, input['min-width']);
    const color: TRgba = input[backgroundColorName];

    this.PIXITextStyle.fontSize = fontSize;
    this.PIXITextStyle.lineHeight = fontSize * NOTE_LINEHEIGHT_FACTOR;
    this.PIXITextStyle.fill = color.isDark()
      ? TRgba.white().hex()
      : TRgba.black().hex();

    const textMetrics = PIXI.TextMetrics.measureText(text, this.PIXITextStyle);

    this.resizeAndDraw(
      Math.max(
        this.getMinNodeWidth(),
        textMetrics.width + this.getMarginLeftRight() * 2
      ),
      textMetrics.height + this.getMarginTopBottom() * 2
    );
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

  public createInputElement = () => {
    // create html input element
    const text = this.getInputData(inputSocketName);
    const fontSize = this.getInputData(fontSizeSocketName);
    const color = this.getInputData(backgroundColorName);
    const screenPoint = PPGraph.currentGraph.viewport.toScreen(
      this.getHTMLComponentLeft(),
      this.getHTMLComponentTop()
    );

    this.HTMLTextComponent = document.createElement('div');
    this.HTMLTextComponent.id = inputSocketName;
    this.HTMLTextComponent.contentEditable = 'true';
    this.HTMLTextComponent.innerText = text;

    const style = {
      fontFamily: 'Arial',
      fontSize: `${fontSize}px`,
      lineHeight: `${fontSize * (NOTE_LINEHEIGHT_FACTOR + 0.025)}px`, // corrects difference between div and PIXI.Text
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
    };
    Object.assign(this.HTMLTextComponent.style, style);

    // add event handlers
    this.HTMLTextComponent.addEventListener('blur', (e) => {
      this.PIXIVisible();
    });

    this.HTMLTextComponent.addEventListener('input', (e) => {
      const text = (e as any).target.innerText;
      this.PIXIText.text = text;
      const minWidth = this.width;
      const textMetrics = PIXI.TextMetrics.measureText(
        text,
        this.PIXITextStyle
      );

      const textMetricsHeight = textMetrics.height;

      const newWidth = textMetrics.width + this.getMarginLeftRight() * 2;
      const newHeight = textMetricsHeight * NOTE_LINEHEIGHT_FACTOR;
      this.HTMLTextComponent.style.width = `${newWidth}px`;
      this.HTMLTextComponent.style.height = `${
        newHeight + this.getMarginTopBottom() * 2
      }px`;

      this.resizeAndDraw(
        Math.max(minWidth, newWidth),
        newHeight + this.getMarginTopBottom()
      );

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

    document.body.appendChild(this.HTMLTextComponent);
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
    const links = this.getSocketByName(outputSocketName).links;
    const target = links[0].getTarget();
    if (
      links.length === 1 &&
      target.dataType.constructor === new StringType().constructor &&
      labelDefaultText === this.getInputData(inputSocketName)
    ) {
      this.setInputData(inputSocketName, target.defaultData);
      this.executeOptimizedChain();
    }
    super.outputPlugged();
  }
}

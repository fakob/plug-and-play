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
    const basicText = new PIXI.Text('', this.PIXITextStyle);
    this.PIXIText = this.addChild(basicText);
    this.PIXIVisible();
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
    return 'Input';
  }

  public getName(): string {
    return 'Label';
  }

  public getDescription(): string {
    return 'Adds a text label';
  }

  protected getDefaultIO(): PPSocket[] {
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
    ].concat(super.getDefaultIO());
  }

  getColor(): TRgba {
    return (
      this.getInputData('backgroundColor') ||
      TRgba.fromString(NODE_TYPE_COLOR.DEFAULT)
    );
  }

  public onNodeAdded = (source?: TNodeSource) => {
    if (this.initialData) {
      this.setInputData('Input', this.initialData);
    }
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
      document.body.removeChild(this.HTMLTextComponent);
      //this.HTMLTextComponent.hidden = true;
    }
    this.executeOptimizedChain();
  }

  onPointerClick(event: PIXI.FederatedPointerEvent): void {
    this.HTMLVisible();
  }

  protected async onExecute(input, output): Promise<void> {
    const text = String(input['Input']);
    const fontSize = Math.max(1, input['fontSize']);
    //const minWidth = Math.max(1, input['min-width']);
    const color: TRgba = input['backgroundColor'];

    const marginTopBottom = fontSize / 2;
    const marginLeftRight = fontSize / 1.5;

    this.PIXITextStyle.fontSize = fontSize;
    this.PIXITextStyle.lineHeight = fontSize * NOTE_LINEHEIGHT_FACTOR;
    this.PIXITextStyle.fill = color.isDark()
      ? TRgba.white().hex()
      : TRgba.black().hex();

    const textMetrics = PIXI.TextMetrics.measureText(text, this.PIXITextStyle);

    this.resizeAndDraw(
      Math.max(this.getMinNodeWidth(), textMetrics.width + marginLeftRight * 2),
      textMetrics.height + marginTopBottom * 2
    );
    output['Output'] = text;

    this.PIXIText.text = text;
    this.PIXIText.x = NODE_MARGIN + marginLeftRight;
    this.PIXIText.y = marginTopBottom;
  }

  public createInputElement = () => {
    // create html input element
    const screenPoint = PPGraph.currentGraph.viewport.toScreen(this.x, this.y);
    const text = this.getInputData('Input');
    const fontSize = this.getInputData('fontSize');
    const color = this.getInputData('backgroundColor');
    const marginTopBottom = fontSize / 2;
    const marginLeftRight = fontSize / 1.2;

    this.HTMLTextComponent = document.createElement('div');
    this.HTMLTextComponent.id = 'Input';
    this.HTMLTextComponent.contentEditable = 'true';
    this.HTMLTextComponent.innerText = text;

    const style = {
      fontFamily: 'Arial',
      fontSize: `${fontSize}px`,
      //lineHeight: `${fontSize * (NOTE_LINEHEIGHT_FACTOR + 0.022)}px`, // 0.022 corrects difference between div and PIXI.Text
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

      const newWidth = textMetrics.width + marginLeftRight * 2;
      const newHeight = textMetricsHeight * NOTE_LINEHEIGHT_FACTOR;
      this.HTMLTextComponent.style.width = `${newWidth}px`;
      this.HTMLTextComponent.style.height = `${
        newHeight + marginTopBottom * 2
      }px`;

      this.resizeAndDraw(
        Math.max(minWidth, newWidth),
        newHeight + marginTopBottom
      );

      this.setInputData('Input', text);
      this.executeOptimizedChain();
    });

    document.body.appendChild(this.HTMLTextComponent);
  };

  // scale input if node is scaled
  public onNodeDragOrViewportMove = () => {
    if (this.HTMLTextComponent != null) {
      const screenPoint = PPGraph.currentGraph.viewport.toScreen(
        this.x,
        this.y
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
}

/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import { Button, Slider } from '@pixi/ui';

import Socket from '../../classes/SocketClass';
import { Widget_Base2 } from './abstract';
import {
  NODE_MARGIN,
  RANDOMMAINCOLOR,
  SOCKET_TYPE,
} from '../../utils/constants';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { BooleanType } from '../datatypes/booleanType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';
import { ColorType } from '../datatypes/colorType';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';

const selectedName = 'Initial selection';
const initialValueName = 'Initial value';
const minValueName = 'Min';
const roundName = 'Round';
const stepSizeName = 'Step size';
const maxValueName = 'Max';
const offValueName = 'Off';
const onValueName = 'On';
const labelName = 'Label';
const optionsName = 'Options';
const selectedOptionName = 'Selected option';
const multiSelectName = 'Select multiple';
const outName = 'Out';

const margin = 4;

const defaultOptions = ['Option1', 'Option2', 'Option3'];

// const fillColorDarkHex = TRgba.fromString(Color(RANDOMMAINCOLOR).darken(0.85).hex());
const fillColorDarkHex = TRgba.fromString(RANDOMMAINCOLOR).darken(0.5).hex();
const fillColorHex = TRgba.fromString(RANDOMMAINCOLOR).hex();
const contrastColorHex = TRgba.fromString(RANDOMMAINCOLOR)
  .getContrastTextColor()
  .hex();

export class WidgetButton extends Widget_Base2 {
  _refLabel: PIXI.Text;
  _refTextStyle: PIXI.TextStyle;
  _refWidget: Button;
  _refGraphics: PIXI.Graphics;

  private labelTextStyle = new PIXI.TextStyle({
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.45,
    fill: contrastColorHex,
    align: 'center',
    wordWrap: true,
  });

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(SOCKET_TYPE.IN, labelName, new StringType(), 'Button', false),
      new Socket(SOCKET_TYPE.OUT, outName, new AnyType()),
    ];
  }

  public getName(): string {
    return 'Button2';
  }

  public getDescription(): string {
    return 'Adds a button to trigger values';
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  handleOnPointerDown = () => {
    this.onWidgetTrigger();

    this._refWidget.view.scale.x = 0.99;
    this._refWidget.view.scale.y = 0.99;
    this._refWidget.view.alpha = 0.8;
    const inputData = this.getInputData(onValueName);
    this.setOutputData(outName, inputData);
    this.executeChildren();
  };

  handleOnPointerUp = () => {
    this._refWidget.view.scale.x = 1;
    this._refWidget.view.scale.y = 1;
    this._refWidget.view.alpha = 1;
    const inputData = this.getInputData(offValueName);
    this.setOutputData(outName, inputData);
    this.executeChildren();
  };

  public onWidgetTrigger = () => {
    console.log('onWidgetTrigger');
    this.executeOptimizedChain();
  };

  public onNodeAdded = (source?: TNodeSource) => {
    this._refGraphics = new PIXI.Graphics()
      .beginFill(fillColorHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 8 * margin,
        16
      );
    this._refWidget = new Button(this._refGraphics);

    this._refGraphics.pivot.x = 0;
    this._refGraphics.pivot.y = 0;
    this._refWidget.view.x = NODE_MARGIN + 4 * margin;
    this._refWidget.view.y = 4 * margin;
    this._refWidget.onDown.connect(this.handleOnPointerDown);
    this._refWidget.onUp.connect(this.handleOnPointerUp);
    this.addChild(this._refWidget.view);

    this._refTextStyle = this.labelTextStyle;
    this._refLabel = new PIXI.Text(
      String(this.getInputData(labelName)).toUpperCase(),
      this._refTextStyle
    );
    this._refLabel.anchor.x = 0.5;
    this._refLabel.anchor.y = 0.5;
    this._refLabel.style.wordWrapWidth = this.nodeWidth - 10 * margin;
    this._refLabel.x = NODE_MARGIN + this.nodeWidth / 2;
    this._refLabel.y = this.nodeHeight / 2;
    this._refLabel.eventMode = 'none';
    this.addChild(this._refLabel);

    super.onNodeAdded(source);
  };

  public onNodeResize = (newWidth, newHeight) => {
    this._refGraphics.clear();
    this._refGraphics
      .beginFill(fillColorHex)
      .drawRoundedRect(0, 0, newWidth - 8 * margin, newHeight - 8 * margin, 16);
    this._refWidget.view.width = newWidth - 8 * margin;
    this._refWidget.view.height = newHeight - 8 * margin;
    this._refLabel.x = NODE_MARGIN + newWidth / 2;
    this._refLabel.y = newHeight / 2;
    this._refLabel.style.wordWrapWidth = newWidth - 10 * margin;
  };

  public onExecute = async (input, output) => {
    const text = String(input[labelName]).toUpperCase();
    this._refLabel.text = text;
  };
}

export class WidgetSlider2 extends Widget_Base2 {
  _refLabel: PIXI.Text;
  _refTextStyle: PIXI.TextStyle;
  _refWidget: Slider;
  _refBg: PIXI.Graphics;
  _refFill: PIXI.Graphics;
  _refSlider: PIXI.Graphics;

  private labelTextStyle = new PIXI.TextStyle({
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.45,
    fill: contrastColorHex,
    // fill: TRgba.white().hex(),
    align: 'center',
    wordWrap: true,
  });

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, initialValueName, new NumberType(), 0, false),
      new Socket(SOCKET_TYPE.IN, minValueName, new NumberType(), 0, false),
      new Socket(SOCKET_TYPE.IN, maxValueName, new NumberType(), 100, false),
      new Socket(SOCKET_TYPE.IN, roundName, new BooleanType(), 100, false),
      new Socket(SOCKET_TYPE.IN, stepSizeName, new NumberType(), 0.01, false),
      new Socket(SOCKET_TYPE.IN, labelName, new StringType(), 'Slider', false),
      new Socket(SOCKET_TYPE.OUT, outName, new NumberType()),
    ];
  }

  public getName(): string {
    return 'Slider2';
  }

  public getDescription(): string {
    return 'Adds a button to trigger values';
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  handleOnChange = (value) => {
    console.log(value);
    this._refLabel.text = `${String(this.getInputData(labelName)).toUpperCase()}
${value}`;
    this.setInputData(initialValueName, value);
    this.setOutputData(outName, value);
    this.executeChildren();
  };

  public onWidgetTrigger = () => {
    console.log('onWidgetTrigger');
    this.executeOptimizedChain();
  };

  public onNodeAdded = (source?: TNodeSource) => {
    this._refBg = new PIXI.Graphics()
      .beginFill(fillColorDarkHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 8 * margin,
        16
      );

    this._refFill = new PIXI.Graphics()
      .beginFill(fillColorHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 8 * margin,
        16
      );

    this._refSlider = new PIXI.Graphics();

    // Component usage
    this._refWidget = new Slider({
      bg: this._refBg,
      fill: this._refFill,
      slider: this._refSlider,
      min: this.getInputData(minValueName),
      max: this.getInputData(maxValueName),
      value: this.getInputData(initialValueName),
      valueTextStyle: this.labelTextStyle,
      showValue: false,
    });

    this._refWidget.x = NODE_MARGIN + 4 * margin;
    this._refWidget.y = 4 * margin;
    this._refWidget.onUpdate.connect(this.handleOnChange);

    this.addChild(this._refWidget);

    this._refTextStyle = this.labelTextStyle;
    this._refLabel = new PIXI.Text(
      String(this.getInputData(labelName)).toUpperCase(),
      this._refTextStyle
    );
    this._refLabel.text = `${String(this.getInputData(labelName)).toUpperCase()}
${String(this.getInputData(initialValueName))}`;
    this._refLabel.anchor.x = 0.5;
    this._refLabel.anchor.y = 0.5;
    this._refLabel.style.wordWrapWidth = this.nodeWidth - 10 * margin;
    this._refLabel.x = NODE_MARGIN + this.nodeWidth / 2;
    this._refLabel.y = this.nodeHeight / 2;
    this._refLabel.eventMode = 'none';
    this.addChild(this._refLabel);

    super.onNodeAdded(source);
  };

  public onNodeResize = (newWidth, newHeight) => {
    this._refWidget.progress = this.getInputData(initialValueName);
    this._refBg.clear();
    this._refBg
      .beginFill(fillColorDarkHex)
      .drawRoundedRect(0, 0, newWidth - 8 * margin, newHeight - 8 * margin, 16);

    this._refFill.clear();
    this._refFill
      .beginFill(fillColorHex)
      .drawRoundedRect(0, 0, newWidth - 8 * margin, newHeight - 8 * margin, 16);

    this._refLabel.x = NODE_MARGIN + newWidth / 2;
    this._refLabel.y = newHeight / 2;
    this._refLabel.style.wordWrapWidth = newWidth - 10 * margin;
  };

  public onExecute = async (input, output) => {
    const text = String(input[labelName]).toUpperCase();
    this._refLabel.text = text;
  };
}

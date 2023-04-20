/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import { Button } from '@pixi/ui';

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

export class WidgetButton extends Widget_Base2 {
  _refText: PIXI.Text;
  _refTextStyle: PIXI.TextStyle;
  _refButton: Button;
  _refGraphics: PIXI.Graphics;

  private labelTextStyle = new PIXI.TextStyle({
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.45,
    fill: TRgba.fromString(RANDOMMAINCOLOR).getContrastTextColor().hex(),
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

    this._refButton.view.scale.x = 0.99;
    this._refButton.view.scale.y = 0.99;
    this._refButton.view.alpha = 0.8;
    const inputData = this.getInputData(onValueName);
    this.setOutputData(outName, inputData);
    this.executeChildren();
  };

  handleOnPointerUp = () => {
    this._refButton.view.scale.x = 1;
    this._refButton.view.scale.y = 1;
    this._refButton.view.alpha = 1;
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
      .beginFill(TRgba.fromString(RANDOMMAINCOLOR).hex())
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 8 * margin,
        16
      );
    this._refButton = new Button(this._refGraphics);

    this._refGraphics.pivot.x = 0;
    this._refGraphics.pivot.y = 0;
    this._refButton.view.x = NODE_MARGIN + 4 * margin;
    this._refButton.view.y = 4 * margin;
    this._refButton.onDown.connect(this.handleOnPointerDown);
    this._refButton.onUp.connect(this.handleOnPointerUp);
    this.addChild(this._refButton.view);

    this._refTextStyle = this.labelTextStyle;
    this._refText = new PIXI.Text(
      String(this.getInputData(labelName)).toUpperCase(),
      this._refTextStyle
    );
    this._refText.anchor.x = 0.5;
    this._refText.anchor.y = 0.5;
    this._refText.style.wordWrapWidth = this.nodeWidth - 10 * margin;
    this._refText.x = NODE_MARGIN + this.nodeWidth / 2;
    this._refText.y = this.nodeHeight / 2;
    this._refText.eventMode = 'none';
    this.addChild(this._refText);

    super.onNodeAdded(source);
  };

  public onNodeResize = (newWidth, newHeight) => {
    this._refGraphics.clear();
    this._refGraphics
      .beginFill(TRgba.fromString(RANDOMMAINCOLOR).hex())
      .drawRoundedRect(0, 0, newWidth - 8 * margin, newHeight - 8 * margin, 16);
    this._refButton.view.width = newWidth - 8 * margin;
    this._refButton.view.height = newHeight - 8 * margin;
    this._refText.x = NODE_MARGIN + newWidth / 2;
    this._refText.y = newHeight / 2;
    this._refText.style.wordWrapWidth = newWidth - 10 * margin;
  };

  public onExecute = async (input, output) => {
    const text = String(input[labelName]).toUpperCase();
    this._refText.text = text;
  };
}

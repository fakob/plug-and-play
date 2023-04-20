/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import { Button, ScrollBox } from '@pixi/ui';

import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { RANDOMMAINCOLOR, SOCKET_TYPE } from '../../utils/constants';
import { TNodeSource } from '../../utils/interfaces';
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

export class Button2 extends PPNode {
  // _refButton: Button;

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
    console.log('handleOnPointerDown');
    this.onWidgetTrigger();
    const inputData = this.getInputData(onValueName);
    this.setOutputData(outName, inputData);
    this.executeChildren();
  };

  handleOnPointerUp = () => {
    console.log('handleOnPointerUp');
    const inputData = this.getInputData(offValueName);
    this.setOutputData(outName, inputData);
    this.executeChildren();
  };

  public onWidgetTrigger = () => {
    console.log('onWidgetTrigger');
    this.executeOptimizedChain();
  };

  public onNodeAdded = (source?: TNodeSource) => {
    const button = new Button(
      new PIXI.Graphics()
        .beginFill(0xffffff)
        .drawRoundedRect(0, 0, this.nodeWidth, this.nodeHeight, 15)
    );

    button.onDown.connect(this.handleOnPointerDown);
    button.onUp.connect(this.handleOnPointerUp);
    this.addChild(button.view);

    super.onNodeAdded(source);
  };

  public onNodeRemoved = () => {
    // this._refButton.destroy();
  };
}

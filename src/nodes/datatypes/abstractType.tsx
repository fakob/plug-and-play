/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import { inspect } from 'util';
import Socket from '../../classes/SocketClass';
import { DefaultOutputWidget, CodeWidget } from '../../widgets';
import { TRgba } from '../../utils/interfaces';
import { SOCKET_COLOR_HEX, SOCKET_CORNERRADIUS, SOCKET_WIDTH } from '../../utils/constants';
import * as PIXI from 'pixi.js';

const widgetSize = {
  w: 2,
  h: 2,
  minW: 2,
  minH: 2,
};

export interface DataTypeProps {
  key: string;
  property: Socket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  randomMainColor: any;
  dataType: AbstractType;
}

export class AbstractType {
  drawValueSpecificGraphics(graphics: PIXI.Graphics, data: any) {

  }
  onDataSet(data: any, socket: Socket) {}

  // override any and all of these in child classes
  getName(): string {
    return this.constructor.name;
  }
  toString(data: any): string {
    return this.getComment(data);
  }

  // optional, used to give extra information that should be written at all times next to the sockets, keep it short
  getMetaText(data: any): string {
    return '';
  }

  getComment(data: any): string {
    if (data !== undefined) {
      return inspect(data, null, 1);
    }
    return 'null';
  }

  getInputWidget = (props: DataTypeProps): any => {
    props.dataType = this;
    return <CodeWidget {...props} />;
  };

  getOutputWidget = (props: DataTypeProps): any => {
    props.dataType = this;
    return <DefaultOutputWidget {...props} />;
  };

  getDefaultWidgetSize() {
    return widgetSize;
  }

  getInputWidgetSize(): any {
    return this.getDefaultWidgetSize();
  }

  getOutputWidgetSize(): any {
    return this.getDefaultWidgetSize();
  }

  getDefaultValue(): any {
    return {};
  }

  getColor(): TRgba {
    return TRgba.fromString(SOCKET_COLOR_HEX);
  }

  parse(data: any): any {
    //console.log("abstract parse");
    return data;
  }

  // these nodes need to cater for initialData to be a socket
  recommendedInputNodeWidgets(): string[] {
    return ['Constant', 'WidgetRadio'];
  }

  recommendedOutputNodeWidgets(): string[] {
    return [];
  }

  allowedAsInput(): boolean {
    return true;
  }

  allowedAsOutput(): boolean {
    return true;
  }

  allowedToAutomaticallyAdapt(): boolean {
    return true;
  }

  roundedCorners(): boolean {
    return true;
  }

  protected drawSocket(
    graphics: PIXI.Graphics,
    data: any
  ) {
    graphics.drawRoundedRect(
      0,
      0,
      SOCKET_WIDTH,
      SOCKET_WIDTH,
      !this.roundedCorners() ? 0 : SOCKET_CORNERRADIUS,
    );
  }

  public drawBox(socketRef: PIXI.Graphics,
    selectionBox: PIXI.Graphics,
    location: PIXI.Point,
    data: any)
    {
    socketRef.beginFill(this.getColor().hexNumber());
    socketRef.x = location.x;
    socketRef.y = location.y;
    socketRef.pivot = new PIXI.Point(SOCKET_WIDTH / 2, SOCKET_WIDTH / 2);
    this.drawSocket(socketRef, data);
    // add bigger invisible box underneath
    selectionBox.beginFill(this.getColor().hexNumber());
    selectionBox.alpha = 0.01;
    selectionBox.x = location.x;
    selectionBox.y = location.y;
    selectionBox.scale = new PIXI.Point(9, 2);
    selectionBox.pivot = new PIXI.Point(SOCKET_WIDTH / 2, SOCKET_WIDTH / 2);
    this.drawSocket(selectionBox, data);

    socketRef.endFill();
    socketRef.name = 'SocketRef';
    socketRef.eventMode = 'static';
    }
}

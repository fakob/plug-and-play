/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import { inspect } from 'util';
import Socket from '../../classes/SocketClass';
import { DefaultOutputWidget, CodeWidget } from '../../widgets';
import { TParseType, TRgba } from '../../utils/interfaces';
import {
  STATUS_SEVERITY,
  SOCKET_COLOR_HEX,
  SOCKET_CORNERRADIUS,
  SOCKET_WIDTH,
} from '../../utils/constants';
import * as PIXI from 'pixi.js';
import { PNPStatus } from '../../classes/ErrorClass';

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
  drawValueSpecificGraphics(graphics: PIXI.Graphics, data: any) {}
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

  parse(data: any): TParseType {
    return { value: data, warnings: [] };
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

  prepareDataForSaving(data: any) {
    return data;
  }

  // decides whether socket, if choosing datatype itself, agrees that this data is compatible, if not then datatype of socket might be changed (if using dynamic type)
  dataIsCompatible(data: any): boolean {
    return true;
  }

  prefersToChangeAwayFromThisType(): boolean {
    return false;
  }

  protected drawSocket(graphics: PIXI.Graphics) {
    graphics.drawRoundedRect(
      0,
      0,
      SOCKET_WIDTH,
      SOCKET_WIDTH,
      !this.roundedCorners() ? 0 : SOCKET_CORNERRADIUS,
    );
  }

  public drawBox(
    errorBox: PIXI.Graphics,
    socketRef: PIXI.Graphics,
    selectionBox: PIXI.Graphics,
    location: PIXI.Point,
    isInput: boolean,
    status: PNPStatus,
  ) {
    if (status.getSeverity() >= STATUS_SEVERITY.WARNING) {
      errorBox.beginFill(status.getColor().hex());
      const errorBoxWidth = SOCKET_WIDTH * 2 - SOCKET_WIDTH / 2;
      errorBox.drawRoundedRect(
        location.x +
          (isInput ? -errorBoxWidth - SOCKET_WIDTH / 4 : SOCKET_WIDTH / 4),
        -SOCKET_WIDTH / 4,
        errorBoxWidth,
        SOCKET_WIDTH + SOCKET_WIDTH / 2,
        0,
      );
      errorBox.endFill();
    }
    socketRef.beginFill(this.getColor().hexNumber());
    socketRef.x = location.x;
    socketRef.y = location.y;
    socketRef.pivot = new PIXI.Point(SOCKET_WIDTH / 2, SOCKET_WIDTH / 2);
    this.drawSocket(socketRef);
    // add bigger invisible box underneath
    selectionBox.beginFill(this.getColor().hexNumber());
    selectionBox.alpha = 0.01;
    selectionBox.x = location.x;
    selectionBox.y = location.y;
    selectionBox.scale = new PIXI.Point(9, 2);
    selectionBox.pivot = new PIXI.Point(SOCKET_WIDTH / 2, SOCKET_WIDTH / 2);
    this.drawSocket(selectionBox);

    socketRef.endFill();
    socketRef.name = 'SocketRef';
    socketRef.eventMode = 'static';
  }
}

/* eslint-disable @typescript-eslint/no-empty-function */
import { OptionsObject, SnackbarMessage } from 'notistack';

import * as PIXI from 'pixi.js';
import Socket from './classes/SocketClass';
import { v4 as uuid } from 'uuid';

export enum ListenEvent {
  SelectionChanged,
  SelectionDragging,
  ViewportDragging,
}

export default class InterfaceController {
  static listeners: Record<ListenEvent, Record<string, (data: any) => void>> = {
    0: {},
    1: {},
    2: {},
  }; // not sure why this one is so messed up

  // we use this listener structure here as there can be multiple listeners, not needed for everything (sometimes there is just one listener)
  static addListener(event: ListenEvent, func: (data: any) => void) {
    const newID = uuid();
    if (this.listeners[event] === undefined) {
      this.listeners[event] = {};
    }
    this.listeners[event][newID] = func;
    return newID;
  }
  static removeListener(id: string) {
    Object.values(InterfaceController.listeners).forEach(
      (currL) => delete currL[id]
    );
  }
  static notifyListeners(event: ListenEvent, data: any) {
    const specificListeners = this.listeners[event];
    if (specificListeners) {
      Object.values(specificListeners).forEach((listener) => listener(data));
    }
  }

  // these are single target
  static showSnackBar: (
    message: SnackbarMessage,
    options?: OptionsObject
  ) => void = () => {};

  static onRightClick: (
    event: PIXI.InteractionEvent,
    target: PIXI.DisplayObject
  ) => void = () => {}; // called when the graph is right clicked
  static onOpenNodeSearch: (pos: PIXI.Point) => void = () => {}; // called node search should be openend
  static onOpenSocketInspector: (pos: PIXI.Point, data: Socket) => void =
    () => {}; // called when socket inspector should be opened
  static onCloseSocketInspector: () => void; // called when socket inspector should be closed
}

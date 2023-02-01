/* eslint-disable @typescript-eslint/no-empty-function */
import { OptionsObject, SnackbarKey, SnackbarMessage } from 'notistack';

import * as PIXI from 'pixi.js';
import Socket from './classes/SocketClass';
import { v4 as uuid } from 'uuid';

export enum ListenEvent {
  SelectionChanged, // data = PPNode[]
  SelectionDragging, // data = Boolean
  ViewportDragging, // data = Boolean
  ViewportZoom, // data = Boolean
  GlobalPointerDown, // data = void TODO implement
  GlobalPointerUp, // data = event: PIXI.FederatedPointerEvent
  GraphChanged, // data = {id,name}
}

export default class InterfaceController {
  static listeners: Record<ListenEvent, Record<string, (data: any) => void>> = {
    0: {},
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
    6: {},
  }; // not sure why this one is so messed up and needs these defined by default, very annoying

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
      // remove potentially bad functions
      const badFunctions = Object.keys(specificListeners).filter(
        (key) => !specificListeners[key]
      );
      badFunctions.forEach((key) => specificListeners.delete(key));

      // execute
      Object.values(specificListeners).forEach((listener) => listener(data));
    }
  }

  // these are single target, move them up to be multi listener if multiple places needs to use them
  static showSnackBar: (
    message: SnackbarMessage,
    options?: OptionsObject
  ) => void = () => {};
  static hideSnackBar = (key: SnackbarKey) => {};

  static onRightClick: (
    event: PIXI.FederatedPointerEvent,
    target: PIXI.DisplayObject
  ) => void = () => {}; // called when the graph is right clicked
  static onOpenNodeSearch: (pos: PIXI.Point) => void = () => {}; // called node search should be openend
  static onOpenSocketInspector: (pos: PIXI.Point, data: Socket) => void =
    () => {}; // called when socket inspector should be opened
  static onCloseSocketInspector: () => void; // called when socket inspector should be closed
  static selectionRedrawn: (pos: PIXI.Point) => void = () => {};
}

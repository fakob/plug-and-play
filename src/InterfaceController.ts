/* eslint-disable @typescript-eslint/no-empty-function */
import { OptionsObject, SnackbarMessage } from 'notistack';
import PPNode from './classes/NodeClass';

import * as PIXI from 'pixi.js';
import Socket from './classes/SocketClass';
export default class InterfaceController {
  static onSelectionChanged = (nodes: PPNode[]) => {};
  static onSelectionDragging = (boolean) => {};
  static onViewportDragging = (boolean) => {};
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

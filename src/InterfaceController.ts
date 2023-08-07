/* eslint-disable @typescript-eslint/no-empty-function */
import { OptionsObject, SnackbarKey, SnackbarMessage } from 'notistack';

import * as PIXI from 'pixi.js';
import Socket from './classes/SocketClass';
import { v4 as uuid } from 'uuid';
import {
  isEventComingFromWithinTextInput,
  isEventComongFromWithinWidget,
  isMac,
} from './utils/utils';
import PPGraph from './classes/GraphClass';
import PPStorage from './PPStorage';
import { ActionHandler } from './utils/actionHandler';
import { zoomToFitNodes } from './pixi/utils-pixi';
import { Graph } from './utils/indexedDB';

export enum ListenEvent {
  SelectionChanged, // data = PPNode[]
  SelectionDragging, // data = Boolean
  ViewportDragging, // data = Boolean
  ViewportZoom, // data = Boolean
  GlobalPointerMove, // data = event: PIXI.FederatedPointerEvent
  GlobalPointerDown, // data = void TODO implement
  GlobalPointerUp, // data = event: PIXI.FederatedPointerEvent
  GraphChanged, // data = {id,name}
  ToggleInspectorWithFocus, // (data: Node, Filter or Socket) => void: called when inspector should be opened with focus
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
    7: {},
    8: {},
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
    target: PIXI.FederatedEventTarget
  ) => void = () => {}; // called when the graph is right clicked
  static onOpenSocketInspector: (pos: PIXI.Point, data: Socket) => void =
    () => {}; // called when socket inspector should be opened
  static onCloseSocketInspector: () => void; // called when socket inspector should be closed
  static selectionRedrawn: (pos: PIXI.Point) => void = () => {};

  // these were previously only in app.tsx and are still being set from there, but they can be accessed from anywhere
  static openNodeSearch: () => void = () => {};
  static toggleGraphSearchOpen: () => void = () => {};
  static toggleShowEdit: () => void = () => {};
  static toggleRightSideDrawer: () => void = () => {};
  static toggleShowComments: () => void = () => {};

  static setIsGraphSearchOpen: (open: boolean) => void = () => {};
  static setIsNodeSearchVisible: (open: boolean) => void = () => {};
  static setIsGraphContextMenuOpen: (open: boolean) => void = () => {};
  static setIsNodeContextMenuOpen: (open: boolean) => void = () => {};
  static setIsSocketContextMenuOpen: (open: boolean) => void = () => {};

  static setGraphToBeModified: (graph: Graph) => void = () => {};
  static setShowGraphEdit: (show: boolean) => void = () => {};
  static setShowGraphDelete: (show: boolean) => void = () => {};

  static setBackgroundColor: (number) => void = () => {};

  /////////////////////////////////////////////////////////////////////////////
  static isTypingInConsole = false;
  static consoleBeingTyped = '';

  static keysDown = (e: KeyboardEvent): void => {
    const modKey = isMac() ? e.metaKey : e.ctrlKey;
    const fromWidget = isEventComongFromWithinWidget(e);
    if (!isEventComingFromWithinTextInput(e)) {
      if (modKey) {
        if (!e.shiftKey) {
          switch (e.key.toLowerCase()) {
            case 'a':
              if (!fromWidget) {
                PPGraph.currentGraph.selection.selectAllNodes();
                e.preventDefault();
              }
              break;
            case 'f':
              this.openNodeSearch();
              e.preventDefault();
              break;
            case 'd':
              PPGraph.currentGraph.duplicateSelection();
              e.preventDefault();
              break;
            case 'o':
              this.toggleGraphSearchOpen();
              e.preventDefault();
              break;
            case 'e':
              this.toggleShowEdit();
              e.preventDefault();
              break;
            case '\\':
              this.toggleRightSideDrawer();
              e.preventDefault();
              break;
            case 'z':
              ActionHandler.undo();
              e.preventDefault();
              break;
          }
        } else if (e.shiftKey) {
          switch (e.key.toLowerCase()) {
            case 'a':
              PPGraph.currentGraph.selection.deselectAllNodes();
              e.preventDefault();
              break;
            case 'y':
              this.toggleShowComments();
              break;
            case 'x':
              PPGraph.currentGraph.showExecutionVisualisation =
                !PPGraph.currentGraph.showExecutionVisualisation;
              break;
            case 'z':
              ActionHandler.redo();
              break;
          }
        }
      } else if (e.shiftKey) {
        switch (e.code) {
          case 'Digit1':
            zoomToFitNodes();
            break;
          case 'Digit2':
            zoomToFitNodes(PPGraph.currentGraph.selection.selectedNodes);
            break;
        }
      } else if (e.altKey) {
        switch (e.code) {
          case 'KeyA':
            console.log('alt a');
            e.preventDefault();
            PPGraph.currentGraph.sendKeyEvent(e);
            break;
        }
      } else if (e.key == '§') {
        if (this.isTypingInConsole) {
          ConsoleController.executeCommand(this.consoleBeingTyped);
          console.log('Executing console command: ' + this.consoleBeingTyped);
          this.consoleBeingTyped = '';
        } else {
          console.log('Starting typing into console');
        }
        this.isTypingInConsole = !this.isTypingInConsole;
      } else if (this.isTypingInConsole) {
        this.consoleBeingTyped += e.key;
      }
    }
    if (modKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (e.shiftKey) {
        PPStorage.getInstance().saveNewGraph();
      } else {
        PPStorage.getInstance().saveGraphAction(false);
      }
    } else if (e.key === 'Escape') {
      InterfaceController.setIsGraphSearchOpen(false);
      this.setIsNodeSearchVisible(false);
      this.setIsGraphContextMenuOpen(false);
      this.setIsNodeContextMenuOpen(false);
      this.setIsSocketContextMenuOpen(false);
    }
  };
  static onOpenFileBrowser: () => void = () => {};
}
class ConsoleController {
  static executeCommand(command: string): void {
    switch (command.toLowerCase()) {
      case 'clear': {
        PPGraph.currentGraph.clear();
      }
      case 'resetbgcolor': {
      }
    }
  }
}

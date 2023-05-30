// This can be invoked at will, any action you do that you can describe a corresponding undo action can be sent in here and handled by undohandler

import Socket from '../classes/SocketClass';
import _ from 'lodash';

export interface Action {
  (): Promise<void>;
}
interface UndoAction {
  action: Action;
  undo: Action;
}

const MAX_STACK_SIZE = 100;

export class ActionHandler {
  static undoList: UndoAction[] = [];
  static redoList: UndoAction[] = [];
  static graphHasUnsavedChanges = false;

  // this stuff is for allowing undoing changing socket values via interface specifically, maybe a bit hacky...
  static lastDebounceSocket: Socket | undefined = undefined;
  static valueBeforeDebounce: any = undefined;
  static lastValueSet: any | undefined = undefined;
  static setValueDebouncer = _.debounce(() => {
    if (ActionHandler.lastDebounceSocket) {
      console.log('setting new debounce point');
      const socketRef = ActionHandler.lastDebounceSocket;
      const newData = JSON.parse(JSON.stringify(this.lastValueSet));
      const prevData = JSON.parse(JSON.stringify(this.valueBeforeDebounce));
      this.valueBeforeDebounce = undefined;
      ActionHandler.performAction(
        async () => {
          socketRef.data = newData;
        },
        async () => {
          socketRef.data = prevData;
        },
        false
      );
    }
  }, 100);

  // if you make an action through this and pass the inverse in as undo, it becomes part of the undo/redo stack, if your code is messy and you cant describe the main action as one thing, feel free to skip inital action
  static async performAction(
    action: Action,
    undo: Action,
    doPerformAction = true
  ) {
    if (doPerformAction) {
      await action();
    }
    this.undoList.push({ action: action, undo: undo });
    if (this.undoList.length > MAX_STACK_SIZE) {
      this.undoList.shift();
    }
    this.setUnsavedChange(true);
  }
  static async undo() {
    // move top of undo stack to top of redo stack
    const lastAction = this.undoList.pop();
    if (lastAction) {
      await lastAction.undo();
      this.redoList.push(lastAction);
      console.log('undo');
    } else {
      console.log('Not possible to undo, nothing in undo stack');
    }
  }
  static async redo() {
    const lastUndo = this.redoList.pop();
    if (lastUndo) {
      await lastUndo.action();
      this.undoList.push(lastUndo);
      console.log('redo');
    } else {
      console.log('Not possible to redo, nothing in redo stack');
    }
  }

  static interfaceSetValueOnSocket(socket: Socket, value: any) {
    if (!this.valueBeforeDebounce) {
      this.valueBeforeDebounce = socket.data;
    }
    this.lastDebounceSocket = socket;
    this.lastValueSet = value;
    socket.data = value;
    this.setValueDebouncer();
  }

  static setUnsavedChange(state: boolean): void {
    this.graphHasUnsavedChanges = state;
    if (this.graphHasUnsavedChanges) {
      window.addEventListener('beforeunload', this.onBeforeUnload, {
        capture: true,
      });
    } else {
      window.removeEventListener('beforeunload', this.onBeforeUnload, {
        capture: true,
      });
    }
  }

  static existsUnsavedChanges(): boolean {
    return this.graphHasUnsavedChanges;
  }

  // triggers native browser reload/close site dialog
  static onBeforeUnload(event: BeforeUnloadEvent): string {
    event.preventDefault();
    return (event.returnValue = '');
  }
}

// This can be invoked at will, any action you do that you can describe a corresponding undo action can be sent in here and handled by undohandler

export interface Action {
  (): Promise<void>;
}
interface UndoAction {
  action: Action;
  undo: Action;
}

export class ActionHandler {
  static undoList: UndoAction[] = [];
  static redoList: UndoAction[] = [];
  static graphHasUnsavedChanges = false;

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

  static setUnsavedChange(state: boolean): void {
    console.log('setUnsavedChanges:', state);
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

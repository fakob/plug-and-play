/* eslint-disable prettier/prettier */

// This can be invoked at will, any action you do that you can describe a corresponding undo action can be sent in here and handled by undohandler

export interface Action {
  (): Promise<void>;
}
interface UndoAction {
  action : Action,
  undo: Action,
}

export class ActionHandler {
  static undoList : UndoAction[] = [];
  static redoList : UndoAction[] =  [];
  static references: Record<number,any> = {};
  static referenceCounterIndex = 0;

  static performAction(action : Action, undo:Action){
    action();
    this.undoList.push({action:action, undo:undo});
  }
  static undo() {
    // move top of undo stack to top of redo stack
    const lastAction = this.undoList.pop();
    if (lastAction){
      lastAction.undo();
      this.redoList.push(lastAction);
      console.log("undo");
    } else{
      console.log("Not possible to undo, nothing in undo stack");
    }

  }
  static redo(){
    const lastUndo = this.redoList.pop();
    if (lastUndo){
      lastUndo.action();
      this.undoList.push(lastUndo);
      console.log("redo");
    } else{
      console.log("Not possible to redo, nothing in redo stack");
    }
  }
  static getNewReferencePoint() : number{
    return this.referenceCounterIndex++;
  }
}

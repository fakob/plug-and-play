// This can be invoked at will, any action you do that you can describe a corresponding undo action can be sent in here and handled by undohandler

import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import _ from 'lodash';
import { TSocketType } from './interfaces';
import InterfaceController from '../InterfaceController';

export interface Action {
  (): Promise<void>;
}
interface UndoAction {
  action: Action;
  undo: Action;
  label: string;
}

const MAX_STACK_SIZE = 100;

const SET_VALUE_DEBOUNCE_TIME = 200;

export class ActionHandler {
  static addIndex = 0;
  static removeIndex = 0;
  static undoList: UndoAction[] = [];
  static redoList: UndoAction[] = [];
  static graphHasUnsavedChanges = false;

  static lastApplyFunction: (value: any) => void;
  static lastIdentifier = '';
  static valueBeforeDebounce: any = undefined;
  static lastValueSet: any = undefined;
  // allows undo actions to keep data for later use
  static undoActionSavedData: Record<string, (value: any) => void> = {};

  // if you make an action through this and pass the inverse in as undo, it becomes part of the undo/redo stack, if your code is messy and you cant describe the main action as one thing, you can skip inital action
  static async performAction(
    action: Action,
    undo: Action,
    label: string,
    doPerformAction = true
  ) {
    this.addIndex++;
    this.redoList = [];
    if (doPerformAction) {
      await action();
    }
    this.undoList.push({ action: action, undo: undo, label: label });
    if (this.undoList.length > MAX_STACK_SIZE) {
      this.undoList.shift();
      delete this.undoActionSavedData[this.removeIndex]; // clear data the undo actions might have saved
      this.removeIndex++;
    }
    this.setUnsavedChange(true);
  }
  static async undo() {
    // move top of undo stack to top of redo stack
    const lastAction = this.undoList.pop();
    if (lastAction) {
      await lastAction.undo();
      this.redoList.push(lastAction);
      InterfaceController.showSnackBar('Undo: ' + lastAction.label);
    } else {
      InterfaceController.showSnackBar(
        'Not possible to undo, nothing in undo stack'
      );
    }
  }
  static async redo() {
    const lastUndo = this.redoList.pop();
    if (lastUndo) {
      await lastUndo.action();
      this.undoList.push(lastUndo);
      InterfaceController.showSnackBar('Redo: ' + lastUndo.label);
    } else {
      InterfaceController.showSnackBar(
        'Not possible to redo, nothing in redo stack'
      );
    }
  }

  static setValueSaveAction = _.debounce(() => {
    if (ActionHandler.lastIdentifier) {
      //console.log('setting new debounce point');

      // deep copy data so that it doesnt get replaced
      const newData = JSON.parse(JSON.stringify(this.lastValueSet));
      const prevData = JSON.parse(JSON.stringify(this.valueBeforeDebounce));
      const currIndex = this.addIndex;
      this.valueBeforeDebounce = undefined;
      if (newData !== prevData) {
        this.undoActionSavedData[currIndex] = this.lastApplyFunction;
        ActionHandler.performAction(
          async () => {
            this.undoActionSavedData[currIndex](newData);
          },
          async () => {
            this.undoActionSavedData[currIndex](prevData);
          },
          'Set Value',
          false
        );
      }
    }
  }, SET_VALUE_DEBOUNCE_TIME);

  // this function exists to allow you to set values and have them undo/redoable, it debounces so if you set many times in a row it will combine them into a single undo/redo action
  static interfaceApplyValueFunction(
    identifier: string,
    prevValue: any,
    newValue: any,
    applyFunction: (newValue: any) => void
  ) {
    if (!this.valueBeforeDebounce || identifier !== this.lastIdentifier) {
      this.valueBeforeDebounce = prevValue;
    }
    this.lastIdentifier = identifier;
    this.lastValueSet = newValue;
    this.lastApplyFunction = applyFunction;
    this.lastApplyFunction(newValue);
    this.setValueSaveAction();
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

  // use these instead of raw references in undo actions, they will work even if node is deleted and recreated through the undo stack
  static getSafeNode(id: string): PPNode {
    return PPGraph.currentGraph.getNodeById(id);
  }
  static getSafeSocket(
    nodeID: string,
    socketType: TSocketType,
    socketName: string
  ): Socket {
    return PPGraph.currentGraph
      .getNodeById(nodeID)
      .getSocketByNameAndType(socketName, socketType);
  }
}

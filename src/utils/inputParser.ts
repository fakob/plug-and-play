/* eslint-disable prettier/prettier */
import PPGraph from '../classes/GraphClass';
import { isEventComingFromWithinTextInput } from './utils';


// This class didnt really work out TODO deprecate entirely

abstract class Hotkey {
  protected getKeys(): string[] {
    return [];
  }
  protected execute(graph: PPGraph): void {
    return;
  }
  areKeysPressed(currPressed: string, allPressed: Set<string>) {
    return (
      this.getKeys().includes(currPressed) &&
      !this.getKeys().find((key) => !allPressed.has(key))
    );
  }

  // you can override this function if you want more custom behaviour
  potentiallyExecute(
    currPressed: KeyboardEvent,
    allPressed: Set<string>,
    graph: PPGraph
  ): boolean {
    // see if all keys are pressed and if one of the relevant keys was pressed now
    if (this.areKeysPressed(currPressed.key, allPressed)) {
      this.execute(graph);
      return true;
    } else {
      return false;
    }
  }
}

// delete behaviour is a little more specialized so overriding "potentiallyexecute"
class deleteNodeAction extends Hotkey {
  potentiallyExecute(currPressed, allPressed, graph): boolean {
    if (currPressed.key === 'Backspace' || currPressed.key === 'Delete') {
      if (!isEventComingFromWithinTextInput(currPressed)) {
        graph.action_DeleteSelectedNodes();
      }
      return true;
    }
    return false;
  }
}

// remember to add your hotkey to the list
const activeHotkeys: Hotkey[] = [
  // new createAddNodeAction(),
  new deleteNodeAction(),
];

export class InputParser {
  static keysPressed: Set<string> = new Set();

  static parseKeyDown(event: KeyboardEvent, graph: PPGraph): void {
    // console.log('parsed keykey: ' + JSON.stringify(event.key));
    this.keysPressed.add(event.key);
    activeHotkeys.forEach((hotkey) =>
      hotkey.potentiallyExecute(event, this.keysPressed, graph)
    );
  }

  // no action triggers on key up, so no graph passed
  static parseKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.key);
  }
}

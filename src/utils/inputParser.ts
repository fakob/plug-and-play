/* eslint-disable prettier/prettier */
import PPGraph from '../classes/GraphClass';

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

// you can create new hotkeys like this by extending hotkey and providing which keys are needed and then the function, this is the ideal and smallest case
class createAddNodeAction extends Hotkey {
  protected getKeys(): string[] {
    return ['m', 'Control'];
  }
  protected execute(graph: PPGraph): void {
    graph.createAndAddNode('MathAdd');
  }
}

// delete behaviour is a little more specialized so overriding "potentiallyexecute"
class deleteNodeAction extends Hotkey {
  potentiallyExecute(currPressed, allPressed, graph): boolean {
    if (currPressed.key === 'Backspace' || currPressed.key === 'Delete') {
      console.log(currPressed, currPressed.localName);
      if (
        currPressed.target.dataset.slateEditor === undefined &&
        currPressed.target.id !== 'NoteInput' &&
        currPressed.target.localName !== 'input' &&
        currPressed.target.localName !== 'textarea'
      ) {
        graph.deleteSelectedNodes();
      }
      return true;
    }
    return false;
  }
}

// remember to add your hotkey to the list
const activeHotkeys: Hotkey[] = [
  new createAddNodeAction(),
  new deleteNodeAction(),
];

export class InputParser {
  static keysPressed: Set<string> = new Set();

  static parseKeyDown(key: KeyboardEvent, graph: PPGraph): void {
    console.log('parsed keykey: ' + JSON.stringify(key.key));
    this.keysPressed.add(key.key);
    activeHotkeys.forEach((hotkey) =>
      hotkey.potentiallyExecute(key, this.keysPressed, graph)
    );
  }

  // no action triggers on key up, so no graph passed
  static parseKeyUp(key: KeyboardEvent): void {
    console.log('parsed keyup: ' + JSON.stringify(key.key));
    this.keysPressed.delete(key.key);
  }
}

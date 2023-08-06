// This allows for simpler communication with third party stuff like the cypress tests
// add more commands as you see fit
import PPGraph from './classes/GraphClass';

export default class ConsoleController {
  static executeCommand(command: string): void {
    switch (command.toLowerCase()) {
      case 'clear': {
        PPGraph.currentGraph.clear();
      }
    }
  }
}

import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { TriggerType } from '../datatypes/triggerType';

export class ArrayState extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'Input', new AnyType(), 'Example'),
      new Socket(SOCKET_TYPE.IN, 'Append', new TriggerType()),
      new Socket(SOCKET_TYPE.IN, 'Remove', new TriggerType()),
      new Socket(SOCKET_TYPE.IN, 'State', new ArrayType(), [], false),
      new Socket(SOCKET_TYPE.OUT, 'State', new ArrayType(), [], false),
    ];
  }

  protected onExecute = this.passThrough;

  append(): void {
    const state: any[] = this.getInputData('Input');
    state.push(this.getInputData('Input'));
    this.setInputData('Input', state);
  }

  remove(): void {
    const state: any[] = this.getInputData('Input');
    state.pop();
    this.setInputData('Input', state);
  }
}

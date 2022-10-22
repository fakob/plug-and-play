import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE, TRIGGER_TYPE_OPTIONS } from '../../utils/constants';
import { AbstractType } from '../datatypes/abstractType';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { NumberType } from '../datatypes/numberType';
import { TriggerType } from '../datatypes/triggerType';

abstract class StateNode extends PPNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        'Input',
        new AnyType(),
        this.getDefaultInput()
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Add',
        new TriggerType(TRIGGER_TYPE_OPTIONS[2].value, 'add')
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Remove',
        new TriggerType(TRIGGER_TYPE_OPTIONS[2].value, 'remove')
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Clear',
        new TriggerType(TRIGGER_TYPE_OPTIONS[2].value, 'clear')
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'State',
        this.getStateType(),
        this.getStateType().getDefaultValue(),
        false
      ),
      new Socket(
        SOCKET_TYPE.OUT,
        'State',
        this.getStateType(),
        this.getStateType().getDefaultValue(),
        true
      ),
    ];
  }

  protected onExecute = this.passThrough;
  protected clear(): void {
    this.setInputData('State', this.getStateType().getDefaultValue());
  }

  protected abstract getStateType(): AbstractType;
  protected abstract getDefaultInput(): any;
  protected abstract add(): void;
  protected abstract remove(): void;
}
export class ArrayState extends StateNode {
  protected add(): void {
    const state: any[] = this.getInputData('State');
    state.push(this.getInputData('Input'));
    this.setInputData('State', state);
    this.executeOptimizedChain();
  }

  protected remove(): void {
    const state: any[] = this.getInputData('State');
    state.pop();
    this.setInputData('State', state);
    this.executeOptimizedChain();
  }

  protected getStateType(): AbstractType {
    return new ArrayType();
  }
  protected getDefaultInput(): any {
    return 'Example';
  }
}

export class NumberState extends StateNode {
  protected getStateType(): AbstractType {
    return new NumberType();
  }
  protected remove(): void {
    this.setInputData(
      'State',
      this.getInputData('State') - this.getInputData('Input')
    );
    this.executeOptimizedChain();
  }
  protected add(): void {
    this.setInputData(
      'State',
      this.getInputData('State') + this.getInputData('Input')
    );
    this.executeOptimizedChain();
  }
  protected getDefaultInput(): any {
    return 1;
  }
}

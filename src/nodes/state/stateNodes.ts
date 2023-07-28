import { stat } from 'fs';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { SOCKET_TYPE, TRIGGER_TYPE_OPTIONS } from '../../utils/constants';
import { AbstractType } from '../datatypes/abstractType';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { JSONType } from '../datatypes/jsonType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';
import { TriggerType } from '../datatypes/triggerType';

abstract class StateNode extends PPNode {
  public getTags(): string[] {
    return ['State'].concat(super.getTags());
  }

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
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'add')
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Remove',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'remove')
      ),
      new Socket(
        SOCKET_TYPE.IN,
        'Clear',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'clear')
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
    this.executeOptimizedChain();
  }

  protected abstract getStateType(): AbstractType;
  protected abstract getDefaultInput(): any;
  protected abstract add(): void;
  protected abstract remove(): void;
}

export class ArrayState extends StateNode {
  public getName(): string {
    return 'Array state';
  }

  public getDescription(): string {
    return 'Store elements in an array';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'MaxSize', new NumberType(true), 0),
    ].concat(super.getDefaultIO());
  }

  protected add(): void {
    const state: any[] = this.getInputData('State');
    state.push(this.getInputData('Input'));
    const maxSize = this.getInputData('MaxSize');
    if (maxSize > 0 && maxSize < state.length) {
      state.splice(0, state.length - maxSize);
    }
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

export class ObjectState extends StateNode {
  public getName(): string {
    return 'Object state';
  }

  public getDescription(): string {
    return 'Store elements by key';
  }

  protected getDefaultIO(): Socket[] {
    return [new Socket(SOCKET_TYPE.IN, 'MaxSize', new NumberType(true), 0)]
      .concat(super.getDefaultIO())
      .concat([
        new Socket(SOCKET_TYPE.IN, 'Key', new StringType(), 'ExampleKey'),
      ]);
  }

  protected add(): void {
    const state = this.getInputData('State');
    const key = this.getInputData('Key');
    if (state[key] === undefined) {
      state[key] = [];
    }
    state[key].push(this.getInputData('Input'));
    const maxSize = this.getInputData('MaxSize');
    if (maxSize > 0 && maxSize < state[key].length) {
      state[key].splice(0, state[key].length - maxSize);
    }
    this.setInputData('State', state);
    this.executeOptimizedChain();
  }

  protected remove(): void {
    const state: any[] = this.getInputData('State');
    const key = this.getInputData('Key');
    if (state[key] !== undefined) {
      state[key].pop();
      this.setInputData('State', state);
    }
    this.executeOptimizedChain();
  }

  protected getStateType(): AbstractType {
    return new JSONType();
  }
  protected getDefaultInput(): any {
    return 'Example';
  }
}

export class NumberState extends StateNode {
  public getName(): string {
    return 'Number state';
  }

  public getDescription(): string {
    return 'Store a number and increment/decrement it';
  }

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

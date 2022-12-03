import debounce from 'lodash/debounce';

import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { WidgetButton } from '../widgets/widgetNodes';
import { ensureVisible } from '../../utils/utils';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { DynamicEnumType } from '../datatypes/dynamicEnumType';
import { NumberType } from '../datatypes/numberType';
import { BooleanType } from '../datatypes/booleanType';
import { TriggerType } from '../datatypes/triggerType';

export class Reroute extends PPNode {
  public getName(): string {
    return 'Reroute';
  }
  public getDescription(): string {
    return 'Reroute point';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'In', new AnyType()),
      new Socket(SOCKET_TYPE.OUT, 'Out', new AnyType()),
    ];
  }

  public getMinNodeWidth(): number {
    return 20;
  }
  public getMinNodeHeight(): number {
    return 3;
  }

  get headerHeight(): number {
    return -11;
  }

  public getDrawBackground(): boolean {
    return false;
  }

  public getShowLabels(): boolean {
    return false;
  }

  public getParallelInputsOutputs(): boolean {
    return true;
  }
  public getRoundedCorners(): boolean {
    return false;
  }
  protected getShouldShowHoverActions(): boolean {
    return false;
  }

  public getColor(): TRgba {
    return TRgba.white();
  }

  public drawBackground(): void {
    this._BackgroundRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity()
    );
    this._BackgroundRef.drawCircle(16, 0, 14.5);
    this._BackgroundRef.endFill();
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject['Out'] = inputObject['In'];
  }

  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return true;
  }
}

const selectNodeName = 'Select Node';

const getNodeArrayOptions = () => {
  return () => {
    const nodeArray = Object.values(PPGraph.currentGraph.nodes);
    const nodeArrayOptions = nodeArray.map((node) => {
      return {
        text: `${node.name} (${node.id})`,
        value: node.id,
      };
    });
    return nodeArrayOptions;
  };
};

export class JumpToNode extends WidgetButton {
  public getName(): string {
    return 'Jump to node';
  }
  public getDescription(): string {
    return 'Jump to a specific node in your playground';
  }

  onWidgetTrigger = () => {
    const nodeToJumpTo =
      PPGraph.currentGraph.nodes[this.getInputData(selectNodeName)];
    if (nodeToJumpTo) {
      ensureVisible([nodeToJumpTo]);
      setTimeout(() => {
        nodeToJumpTo.renderOutlineThrottled(100);
      }, 500);
    }
    this.executeOptimizedChain();
  };

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        selectNodeName,
        new DynamicEnumType(getNodeArrayOptions),
        undefined,
        false
      ),
    ].concat(super.getDefaultIO());
  }

  protected initializeType(socketName: string, datatype: any) {
    switch (socketName) {
      case selectNodeName:
        datatype.getOptions = getNodeArrayOptions;
        datatype.widgetTrigger = this.onWidgetTrigger;
    }
  }
}

export class ThrottleDebounce extends PPNode {
  passThroughDebounced;

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  public getName(): string {
    return 'Throttle/Debounce';
  }

  public getDescription(): string {
    return 'Limits how often the value is passed through';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'In', new AnyType()),
      new Socket(
        SOCKET_TYPE.IN,
        'Update',
        new TriggerType(
          TRIGGER_TYPE_OPTIONS[0].value,
          'updateDebounceFunction'
        ),
        undefined,
        false
      ),
      new Socket(SOCKET_TYPE.IN, 'Wait', new NumberType(), 1000, false),
      new Socket(
        SOCKET_TYPE.IN,
        'Max Wait',
        new NumberType(),
        undefined,
        false
      ),
      new Socket(SOCKET_TYPE.IN, 'Leading', new BooleanType(), false, false),
      new Socket(SOCKET_TYPE.IN, 'Trailing', new BooleanType(), true, false),
      new Socket(SOCKET_TYPE.OUT, 'Out', new AnyType()),
    ];
  }

  // when the Node is added, define debounced function
  public onNodeAdded = () => {
    super.onNodeAdded();
    this.updateDebounceFunction();
  };

  public updateDebounceFunction(): void {
    const passThrough = (input: unknown) => {
      return input;
    };

    this.passThroughDebounced?.cancel;
    this.passThroughDebounced = debounce(
      passThrough,
      this.getInputData('Wait'),
      {
        maxWait: this.getInputData('Max Wait'),
        leading: this.getInputData('Leading'),
        trailing: this.getInputData('Trailing'),
      }
    );
  }

  protected async onExecute(
    inputObject: any,
    outputObject: any
  ): Promise<void> {
    const input = inputObject['In'];
    outputObject['Out'] = this.passThroughDebounced(input);
  }
}

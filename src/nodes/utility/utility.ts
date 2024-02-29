import debounce from 'lodash/debounce';

import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { CustomFunction } from '../data/dataFunctions';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import { ensureVisible } from '../../pixi/utils-pixi';
import { AbstractType } from '../datatypes/abstractType';
import { AnyType } from '../datatypes/anyType';
import { BooleanType } from '../datatypes/booleanType';
import { DynamicEnumType } from '../datatypes/dynamicEnumType';
import { EnumType } from '../datatypes/enumType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';
import { TriggerType } from '../datatypes/triggerType';
import { WidgetButton } from '../widgets/widgetNodes';
import { JSONType } from '../datatypes/jsonType';

export class Reroute extends PPNode {
  public getName(): string {
    return 'Reroute';
  }

  public getDescription(): string {
    return 'Adds a node to reroute connections';
  }

  public getTags(): string[] {
    return ['Playground'].concat(super.getTags());
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
    this._BackgroundGraphicsRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity(),
    );
    this._BackgroundGraphicsRef.drawCircle(16, 0, 14.5);
    this._BackgroundGraphicsRef.endFill();
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>,
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
    return 'Adds a button which can be used to jump to another node';
  }

  public getTags(): string[] {
    return ['Playground'].concat(super.getTags());
  }

  onWidgetTrigger = () => {
    const nodeId = getNodeArrayOptions()().find(
      (option) => option.text === this.getInputData(selectNodeName),
    )?.value;
    const nodeToJumpTo = PPGraph.currentGraph.nodes[nodeId];
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
        new DynamicEnumType(getNodeArrayOptions, () => {}),
        undefined,
        false,
      ),
    ].concat(super.getDefaultIO());
  }
}

const dataToCopyName = 'Input';

export class WriteToClipboard extends PPNode {
  public getName(): string {
    return 'Write to clipboard';
  }

  public getDescription(): string {
    return 'Copies the input value to the clipboard';
  }

  public getTags(): string[] {
    return ['Playground'].concat(super.getTags());
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, false, 1000, this);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.TRIGGER,
        'Trigger',
        new TriggerType(TRIGGER_TYPE_OPTIONS[1].text),
        undefined,
        true,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        dataToCopyName,
        new StringType(),
        undefined,
        true,
      ),
    ].concat(super.getDefaultIO());
  }

  public socketShouldAutomaticallyAdapt(socket: Socket): boolean {
    return true;
  }

  protected async onExecute(inputObject: any): Promise<void> {
    const input = inputObject[dataToCopyName];
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard
        .write([
          new ClipboardItem({
            'text/plain': new Blob([input], {
              type: 'text/plain',
            }),
          }),
        ])
        .then(
          function () {
            /* clipboard successfully set */
          },
          function () {
            console.error('Writing to clipboard of this text failed:', input);
          },
        );
    }
  }
}

export class ThrottleDebounce extends PPNode {
  passThroughDebounced;

  public getName(): string {
    return 'Throttle/Debounce';
  }

  public getDescription(): string {
    return 'Limits how often the value is passed through';
  }

  public getTags(): string[] {
    return ['Logic'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, 'In', new AnyType()),
      new Socket(
        SOCKET_TYPE.IN,
        'Update',
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'updateDebounceFunction'),
        undefined,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, 'Wait', new NumberType(), 1000, false),
      new Socket(
        SOCKET_TYPE.IN,
        'Max Wait',
        new NumberType(),
        undefined,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, 'Leading', new BooleanType(), false, false),
      new Socket(SOCKET_TYPE.IN, 'Trailing', new BooleanType(), true, false),
      new Socket(SOCKET_TYPE.OUT, 'Out', new AnyType()),
    ];
  }
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
      },
    );
  }

  protected async onExecute(
    inputObject: any,
    outputObject: any,
  ): Promise<void> {
    if (this.passThroughDebounced === undefined) {
      this.updateDebounceFunction();
    }
    const input = inputObject['In'];
    const output = this.passThroughDebounced(input);
    if (output == undefined || isNaN(output)) {
      outputObject['Out'] = input;
    } else {
      outputObject['Out'] = output;
    }
  }
}

export class LoadNPM extends CustomFunction {
  public getName(): string {
    return 'Load NPM package';
  }

  public getDescription(): string {
    return 'Lazy loads an NPM package';
  }

  public getTags(): string[] {
    return ['Playground'].concat(super.getTags());
  }

  protected getDefaultParameterValues(): Record<string, any> {
    return { packageName: 'uuid' };
  }

  protected getDefaultParameterTypes(): Record<string, any> {
    return { packageName: new StringType() };
  }

  protected getOutputParameterName(): string {
    return 'NpmPackage';
  }

  protected getOutputParameterType(): AbstractType {
    return new JSONType();
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, false, 1000, this);
  }

  protected getDefaultFunction(): string {
    return `(packageName) => {
  const url = 'https://esm.sh/' + packageName;
  const npmPackage = await import(url);
  console.log(npmPackage);
	return npmPackage;
}`;
  }

  public socketShouldAutomaticallyAdapt(): boolean {
    return false;
  }
}

const outputSocketName = 'Output';
const parameterName1 = 'Input';
const parameterName2 = 'Input2';
const parameterName3 = 'Input3';
const hashMethodName = 'Hash method';

const IMPORT_NAME = 'hash-wasm';

export class Hash extends PPNode {
  hash = {};
  hashOptions;
  onOptionChange?: (value: string) => void;

  public getName(): string {
    return 'Hash creator';
  }

  public getDescription(): string {
    return 'Creates various hashes like md5, sha or HMAC';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(true, true, false, 1000, this);
  }

  public onNodeAdded = async (source: TNodeSource): Promise<void> => {
    await super.onNodeAdded(source);
    // if (source !== NODE_SOURCE.NEWCONNECTED) {
    this.hash = await PPGraph.currentGraph.dynamicImports[IMPORT_NAME];
    const hashFunctions = Object.entries(this.hash).filter(
      ([name, value]) => typeof value === 'function',
    );
    console.log(hashFunctions);
    this.hashOptions = hashFunctions.map(([name, func]) => {
      return {
        text: `${name} (${(func as any).length})`,
        value: name,
      };
    });
    console.log(this.hashOptions);

    const newSocket = new Socket(
      SOCKET_TYPE.IN,
      hashMethodName,
      new EnumType(this.hashOptions),
      'md4 (1)',
      false,
    );
    this.addSocket(newSocket);
    // }
  };

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        parameterName1,
        new StringType(),
        'param1',
        true,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        parameterName2,
        new StringType(),
        'param2',
        true,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        parameterName3,
        new StringType(),
        'param3',
        true,
      ),
      new Socket(SOCKET_TYPE.OUT, outputSocketName, new StringType(), '', true),
    ];
  }

  protected async onExecute(input, output): Promise<void> {
    const hashMethod = input[hashMethodName];
    console.log(hashMethod, this.hashOptions);
    const hashMethodValue = this.hashOptions?.find(
      (option) => option.text === hashMethod,
    ).value;
    if (hashMethodValue) {
      console.log(
        this.hash,
        hashMethodValue,
        this.hash[hashMethodValue].length,
      );
      if (hashMethodValue === 'createHMAC') {
        const hasher = this.hash[input[parameterName1]]();
        const hmac = await this.hash[hashMethodValue](
          hasher,
          input[parameterName2],
        );
        hmac.update(input[parameterName3]);
        output[outputSocketName] = await hmac.digest();
      } else if (String(hashMethodValue).startsWith('create')) {
        const hasher = await this.hash[hashMethodValue]();
        console.log(hasher);
        output[outputSocketName] = hasher.digest(input[parameterName1]);
      } else {
        const parameterCount = this.hash[hashMethodValue].length;
        switch (parameterCount) {
          case 0:
            output[outputSocketName] = await this.hash[hashMethodValue]();
            break;
          case 1:
            output[outputSocketName] = await this.hash[hashMethodValue](
              input[parameterName1],
            );
            break;
          case 2:
            output[outputSocketName] = await this.hash[hashMethodValue](
              input[parameterName1],
              input[parameterName2],
            );
            break;
          default:
            output[outputSocketName] = await this.hash[hashMethodValue];
            break;
        }
      }
    }
  }

  public getDynamicImports(): string[] {
    return [IMPORT_NAME];
  }
}

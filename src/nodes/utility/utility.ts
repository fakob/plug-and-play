import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { WidgetButton } from '../widgets/widgetNodes';
import { ensureVisible } from '../../utils/utils';
import { SOCKET_TYPE } from '../../utils/constants';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { AnyType } from '../datatypes/anyType';
import { EnumType } from '../datatypes/enumType';

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

  public getNodeWidth(): number {
    return 20;
  }
  public getNodeHeight(): number {
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
    this._BackgroundRef.drawCircle(16, 0, 14.5);
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject['Out'] = inputObject['In'];
  }
}

const selectNodeName = 'Select Node';

export class JumpToNode extends WidgetButton {
  setOptions: () => void;
  setOnOpen: () => void;

  public getName(): string {
    return 'Jump to node';
  }
  public getDescription(): string {
    return 'Jump to a specific node in your playground';
  }

  get nodeArrayOptions(): any[] {
    const nodeArray = Object.values(PPGraph.currentGraph.nodes);
    const nodeArrayOptions = nodeArray.map((node) => {
      return {
        text: `${node.name} - ${node.id}`,
        value: node.id,
      };
    });
    console.log(nodeArray);
    console.log(nodeArrayOptions);
    return nodeArrayOptions;
  }

  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.setOptions = () => {
      console.log('setOptions');
      (this.getSocketByName(selectNodeName).dataType as EnumType).setOptions(
        this.nodeArrayOptions
      );
    };

    this.setOnOpen = () => {
      console.log('setOnOpen');
      (this.getSocketByName(selectNodeName).dataType as EnumType).setOnOpen(
        this.setOptions
      );
    };

    // set options and add onOpen function on nodeAdded
    this.nodeIsAdded = () => {
      console.log('onConfigure');
      this.setOptions();
      this.setOnOpen();
    };

    // add onOpen function after node configure
    this.onConfigure = () => {
      console.log('onConfigure');
      this.setOptions();
      this.setOnOpen();
    };

    this.onWidgetTrigger = () => {
      const nodeToJumpTo =
        PPGraph.currentGraph.nodes[this.getInputData(selectNodeName)];
      console.log(
        'onWidgetTrigger',
        this.getInputData(selectNodeName),
        nodeToJumpTo
      );
      if (nodeToJumpTo) {
        ensureVisible([nodeToJumpTo]);
      }
      setTimeout(() => {
        nodeToJumpTo.renderOutline();
      }, 500);
      this.executeOptimizedChain();
    };
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        selectNodeName,
        new EnumType([{ text: 'text', value: undefined }]),
        'text'
      ),
    ].concat(super.getDefaultIO());
  }
}

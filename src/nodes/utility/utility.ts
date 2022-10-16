import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { WidgetButton } from '../widgets/widgetNodes';
import { zoomToFitNodes } from '../../utils/utils';
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
  onOpenSelect: () => void;

  public getName(): string {
    return 'Jump to node';
  }
  public getDescription(): string {
    return 'Jump to a specific node in your playground';
  }

  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    const onOpenSelect = () => {
      const nodeArray = Object.values(PPGraph.currentGraph.nodes);
      const nodeArrayOptions = nodeArray.map((node) => {
        return {
          text: `${node.name} - ${node.id}`,
          value: node.id,
        };
      });
      console.log(nodeArray);
      console.log(nodeArrayOptions);
      (this.getSocketByName(selectNodeName).dataType as EnumType).setOptions(
        nodeArrayOptions
      );
    };

    this.nodeIsAdded = () => {
      (this.getSocketByName(selectNodeName).dataType as EnumType).setOnOpen(
        onOpenSelect
      );
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
        zoomToFitNodes([nodeToJumpTo]);
      }
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

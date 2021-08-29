import PPGraph from '../classes/GraphClass';
import PPNode, { UpdateBehaviour } from '../classes/NodeClass';
import { SOCKET_TYPE } from './constants';

export type RegisteredNodeTypes = Record<
  string,
  {
    constructor: PPNodeConstructor;
    name?: string;
    description?: string;
    hasInputs?: boolean;
  }
>;

export type PPNodeConstructor<T extends PPNode = PPNode> = {
  type?: string;
  category?: string;
  new (name: string, graph: PPGraph, ...args: any[]): T;
};

export type SerializedGraph = {
  version: number;
  nodes: SerializedNode[];
  links: SerializedLink[];
  customNodeTypes: Record<string, string>;
};

export type CustomArgs = {
  customId?: string;
  color?: string;
  colorTransparency?: number;
  nodePosX?: number;
  nodePosY?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  isHybrid?: boolean;
  roundedCorners?: boolean;
  showLabels?: boolean;
  defaultArguments?: Record<string, any>;
  [key: string]: any; //  lets try to deprecate this
};

export interface IGraphSearch {
  id: string;
  name: string;
  label?: string;
  isRemote?: boolean;
  isDisabled?: boolean;
}

export interface INodeSearch {
  title: string;
  name: string;
  description: string;
  hasInputs: string;
}

export type SerializedNode = {
  type: string;
  id: string;
  name: string;
  x: number;
  y: number;
  inputSocketArray?: SerializedSocket[];
  outputSocketArray?: SerializedSocket[];
  updateBehaviour: UpdateBehaviour;
};

export type SerializedLink = {
  id: number;
  type: string;
  sourceNodeId: string;
  sourceSocketIndex: number;
  targetNodeId: string;
  targetSocketIndex: number;
};

export type TSocketType = typeof SOCKET_TYPE[keyof typeof SOCKET_TYPE];

export type SerializedSocket = {
  socketType: TSocketType;
  name: string;
  dataType: string;
  data: any;
  defaultData: any;
  visible: boolean;
  custom?: Record<string, any>;
};

export type TRgba = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

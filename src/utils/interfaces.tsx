import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { SOCKET_TYPE } from './constants';

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
  nodePosX?: number;
  nodePosY?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  [key: string]: any;
};

export interface INodes {
  /** Title of film. */
  title: string;
}

export type SerializedNode = {
  type: string;
  id: string;
  name: string;
  x: number;
  y: number;
  inputSocketArray?: SerializedSocket[];
  outputSocketArray?: SerializedSocket[];
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
  data: number;
  visible: boolean;
  custom?: Record<string, any>;
};

export type SerializedInputSocket = {
  name: string;
  type: string;
  data: number;
  defaultData: number;
  visible: boolean;
  custom?: Record<string, any>;
};

export type SerializedOutputSocket = {
  name: string;
  type: string;
  custom?: Record<string, any>;
};

export type TRgba = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

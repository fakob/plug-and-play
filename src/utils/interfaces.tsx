import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';

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
  inputSocketArray?: SerializedInputSocket[];
  outputSocketArray?: SerializedOutputSocket[];
};

export type SerializedLink = {
  id: number;
  type: string;
  sourceNodeId: string;
  sourceSocketIndex: number;
  targetNodeId: string;
  targetSocketIndex: number;
};

export type SerializedInputSocket = {
  name: string;
  type: string;
  data: number;
  defaultData: number;
  visible: boolean;
};

export type SerializedOutputSocket = {
  name: string;
  type: string;
};

export interface GridPosition {
  x: number;
  y: number;
  scale: number;
}

export interface NodeData {
  name: string;
  type: string;
  inputs?: {
    name: string;
    type: string;
  }[];
  outputs?: {
    name: string;
    type: string;
  }[];
}

import { Viewport } from 'pixi-viewport';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import InputSocket from './InputSocketClass';
import OutputSocket from './OutputSocketClass';
import PPLink from './LinkClass';

export type PPNodeConstructor<T extends PPNode = PPNode> = {
  type?: string;
  category?: string;
  new (name: string, graph: PPGraph, ...args: any[]): T;
};

export type SerializedGraph = {
  nodes: PPNode[];
  links: PPLink[];
  version: number;
};

export type SerializedNode = {
  type: string;
  id: number | null;
  name: string;
  x: number;
  y: number;
  inputSocketArray?: SerializedInputSocket[];
  outputSocketArray?: SerializedOutputSocket[];
};

export type SerializedLink = {
  id: number;
  type: string;
  sourceNodeId: number;
  sourceSocketIndex: number;
  targetNodeId: number;
  targetSocketIndex: number;
};

export type SerializedInputSocket = {
  name: string;
  type: string;
  defaultValue: number;
  value: number;
  visible: boolean;
};

export type SerializedOutputSocket = {
  name: string;
  type: string;
  data: number;
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

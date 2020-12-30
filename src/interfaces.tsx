import PPGraph from './GraphClass';
import PPNode from './NodeClass';

export type PPNodeConstructor<T extends PPNode = PPNode> = {
  type?: string;
  category?: string;
  new (name: string, graph: PPGraph, ...args: any[]): T;
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

import { Sprite, Text } from 'pixi.js';
import ThumbContainer from './ThumbContainer';

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

export interface Thumb {
  thumbContainerRef: ThumbContainer;
  textRef: Text;
  spriteRef: Sprite;
  base64: string;
  frameNumber: number;
}

export interface ThumbOptionOverlay {
  show: boolean;
  frameNumber?: number;
  gridPosition?: GridPosition;
}

export interface SelectedThumb {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string | undefined;
  visibility?: boolean;
}

export interface MovieInfo {
  frameCount?: number;
  width?: number;
  height?: number;
}

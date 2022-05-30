import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { IUpdateBehaviour } from '../classes/UpdateBehaviourClass';
import { COLOR_DARK, COLOR_WHITE, SOCKET_TYPE } from './constants';
import Color from 'color';

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
  graphSettings: {
    viewportCenterPosition: PIXI.Point;
    viewportScale: number;
  };
  nodes: SerializedNode[];
  links: SerializedLink[];
  customNodeTypes: Record<string, string>;
};

export type SerializedSelection = {
  version: number;
  nodes: SerializedNode[];
  links: SerializedLink[];
  customNodeTypes: Record<string, string>;
};

export type CustomArgs = {
  customId?: string;
  color?: TRgba;
  colorTransparency?: number;
  name?: string;
  nodePosX?: number;
  nodePosY?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  roundedCorners?: boolean;
  showLabels?: boolean;
  defaultArguments?: Record<string, any>;
  [key: string]: any; //  lets try to deprecate this
};

export interface IGraphSearch {
  inputValue?: string;
  id: string;
  name: string;
  label?: string;
  isRemote?: boolean;
  isDisabled?: boolean;
  isNew?: boolean;
}

export interface INodeSearch {
  inputValue?: string;
  title: string;
  key: string;
  name: string;
  description: string;
  hasInputs: string;
  isNew?: boolean;
}

export type SerializedNode = {
  type: string;
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight?: number;
  socketArray: SerializedSocket[];
  updateBehaviour: IUpdateBehaviour;
};

export type SerializedLink = {
  id: number;
  sourceNodeId: string;
  sourceSocketName: string;
  targetNodeId: string;
  targetSocketName: string;
};

export type TSocketType = typeof SOCKET_TYPE[keyof typeof SOCKET_TYPE];

export type SerializedSocket = {
  socketType: TSocketType;
  name: string;
  dataType: string;
  data: any;
  defaultData?: any;
  visible: boolean;
  isCustom: boolean;
};
export class TRgba {
  r = 0;
  g = 0;
  b = 0;
  a = 1;

  constructor(r = 0, g = 0, b = 0, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  static fromString(hex: string): TRgba {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return new TRgba(r, g, b);
  }

  hex(): string {
    return this.toColor().hex();
  }
  hexNumber(): number {
    return parseInt(this.hex().replace(/^#/, ''), 16);
  }

  isDark(): boolean {
    return this.toColor().isDark();
  }

  mix(otherColor: TRgba, blendFactor: number): TRgba {
    return TRgba.fromColor(
      this.toColor().mix(otherColor.toColor(), blendFactor)
    );
  }

  static white(): TRgba {
    return TRgba.fromString(COLOR_WHITE);
  }
  static black(): TRgba {
    return TRgba.fromString(COLOR_DARK);
  }

  multiply(value: number): TRgba {
    return new TRgba(
      this.r * value,
      this.g * value,
      this.b * value,
      this.a * value
    );
  }
  // private so no temptation to call from outside (lets not expose the Color class at all and keep it TRgba)
  private toColor(): Color {
    return Color({
      r: this.r,
      g: this.g,
      b: this.b,
    }).alpha(this.a);
  }

  private static fromColor = (color: Color): TRgba => {
    return new TRgba(
      color.color[0],
      color.color[1],
      color.color[2],
      color.valpha
    );
  };
}

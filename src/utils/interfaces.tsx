import * as PIXI from 'pixi.js';
import PPSelection from '../classes/SelectionClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import { IUpdateBehaviour } from '../classes/UpdateBehaviourClass';
import {
  ALIGNOPTIONS,
  COLOR_DARK,
  COLOR_WHITE,
  SOCKET_TYPE,
  NODE_SOURCE,
} from './constants';
import Color from 'color';

export type RegisteredNodeTypes = Record<
  string,
  {
    constructor: PPNodeConstructor;
    name?: string;
    description?: string;
    hasInputs?: boolean;
    tags?: string[];
    hasExample: boolean;
  }
>;

export type PPNodeConstructor<T extends PPNode = PPNode> = {
  type?: string;
  category?: string;
  new (name: string, ...args: any[]): T;
};

export type SerializedGraph = {
  version: number;
  graphSettings: {
    showExecutionVisualisation: boolean;
    viewportCenterPosition: PIXI.Point;
    viewportScale: number;
  };
  nodes: SerializedNode[];
  links: SerializedLink[];
  layouts: any;
};

export type SerializedSelection = {
  version: number;
  nodes: SerializedNode[];
  links: SerializedLink[];
};

export type CustomArgs = {
  overrideId?: string;
  name?: string;
  nodePosX?: number;
  nodePosY?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  initialData?: any;
  defaultArguments?: Record<string, any>;
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
  hasInputs: boolean;
  group: string;
  isNew?: boolean;
}

export interface ILayoutItem {
  w: number;
  h: number;
  x: number;
  y: number;
  i: TNodeId;
  minW: number;
  minH: number;
  moved: boolean;
  static: boolean;
}

export type TNodeId = `${string}-${string}-${number}`;

export type SerializedNode = {
  type: string;
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  socketArray: SerializedSocket[];
  updateBehaviour: IUpdateBehaviour;
};

export type SerializedLink = {
  id: string;
  sourceNodeId: string;
  sourceSocketName: string;
  targetNodeId: string;
  targetSocketName: string;
};

export type TSocketId =
  `${string}-${string}-${number}-${TSocketType}-${string}`;

export type TSocketType = (typeof SOCKET_TYPE)[keyof typeof SOCKET_TYPE];

export type TParseType = {
  value: any;
  warning?: string;
};

export type SerializedSocket = {
  socketType: TSocketType;
  name: string;
  dataType: string;
  data: any;
  defaultData?: any;
  visible: boolean;
};

export type NodeStatus = {
  color: TRgba;
  statusText: string;
};

export type TNodeSource = (typeof NODE_SOURCE)[keyof typeof NODE_SOURCE];

export type TAlignOptions = (typeof ALIGNOPTIONS)[keyof typeof ALIGNOPTIONS];

export type TPastePos = {
  x: number;
  y: number;
};

// export type TPPType = PPSelection | PPNode | PPSocket;
export type TPPType = PPSelection | PPSocket;

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

  static fromString(hexOrOtherString: string): TRgba {
    try {
      const parsedData = JSON.parse(hexOrOtherString);
      return Object.assign(new TRgba(), parsedData);
    } catch (error) {
      return TRgba.fromColor(Color(hexOrOtherString));
    }
  }

  object(): string {
    return this.toColor().object();
  }

  rgb(): string {
    return this.toColor().rgb().string();
  }

  hex(): string {
    return this.toColor().hex();
  }

  hexNumber(): number {
    return parseInt(this.hex().replace(/^#/, ''), 16);
  }

  darken(value: number): TRgba {
    return this.toColor().darken(value);
  }

  isDark(): boolean {
    return this.toColor().isDark();
  }

  getContrastTextColor(): TRgba {
    return this.toColor().isDark() ? TRgba.white() : TRgba.black();
  }

  setAlpha(value: number): TRgba {
    return TRgba.fromColor(this.toColor().alpha(value));
  }

  mix(otherColor: TRgba, blendFactor: number): TRgba {
    return TRgba.fromColor(
      this.toColor().mix(otherColor.toColor(), blendFactor),
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
      this.a * value,
    );
  }

  public static fromObject = (color: any): TRgba => {
    return new TRgba(color.r, color.g, color.b, color.a);
  };

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
      color.valpha,
    );
  };

  public static isTRgba(data: any): boolean {
    return (
      typeof data == 'object' &&
      Object.keys(data).length == 4 &&
      data['r'] !== undefined &&
      data['g'] !== undefined &&
      data['b'] !== undefined &&
      data['a'] !== undefined
    );
  }

  public static randomColor(): TRgba {
    return new TRgba(
      Math.random() * 255,
      Math.random() * 255,
      Math.random() * 255,
      1,
    );
  }
}

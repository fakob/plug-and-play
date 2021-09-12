import * as PIXI from 'pixi.js';
import Color from 'color';
import { TextStyle } from '@pixi/text';

export const PP_VERSION = 0.1;

// old node color #C1CADF
export const COLOR = [
  '#E1547D',
  '#E154BB',
  '#AB53DE',
  '#5952DF',
  '#549BE0',
  '#56E1CC',
  '#55E179',
  '#7FE158',
  '#D4E25A',
  '#E19757',
  '#A43F6C',
  '#5F3EA3',
  '#3E54A3',
  '#4092A4',
  '#40A577',
  '#42A541',
  '#7BA442',
  '#A58E43',
  '#A45140',
];

export const COLOR_WHITE = '#F5F5F5';
export const COLOR_DARK = '#0C0C0C';
export const COLOR_WHITE_TEXT = '#F4FAF9';

export const PLUGANDPLAY_ICON = '../assets/PlugAndPlayIcon-transparent.svg';

export const CANVAS_BACKGROUND_TEXTURE =
  '../assets/Pixel_grid_4000x2000.svg.png';
export const CANVAS_BACKGROUND_ALPHA = 0.02;

// export const COLOR_MAIN = '#2E3A59';
export const COLOR_MAIN = Color(COLOR[0]).lighten(0.8).hex();
export const COLOR_MAIN_HEX = PIXI.utils.string2hex(COLOR_MAIN);
export const COLOR_COMMENT = COLOR[12];

// common
export const TEXT_RESOLUTION = 8; // so one can zoom in closer and it keeps a decent resolution

export const SOCKET_TYPE = {
  IN: 'in',
  OUT: 'out',
} as const;

export const SOCKET_COLOR_HEX = PIXI.utils.string2hex(
  Color(COLOR[0]).lighten(0.4).hex()
);
export const SOCKET_COLOR_TINT_HEX = PIXI.utils.string2hex(
  Color(COLOR[0]).desaturate(0.3).hex()
);
export const SOCKET_HEIGHT = 24;
export const SOCKET_WIDTH = 12;
export const SOCKET_CORNERRADIUS = 4;
export const SOCKET_TEXTMARGIN = 8;
export const SOCKET_TEXTMARGIN_TOP = 4;
export const SOCKET_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_MAIN,
});

export const DATATYPE = {
  ANY: 'undefined',
  ARRAY: 'array',
  BOOLEAN: 'boolean',
  COLOR: 'color',
  ENUM: 'enum',
  NUMBER: 'number',
  PIXI: 'pixi',
  STRING: 'string',
  TRIGGER: 'trigger',
};

export const DATATYPE_DEFAULT_VALUE = {
  ANY: undefined,
  ARRAY: [],
  BOOLEAN: false,
  COLOR: [255, 55, 0, 0.5],
  ENUM: [],
  NUMBER: 0,
  PIXI: null,
  STRING: '',
  TRIGGER: undefined,
};

export const NODE_TEXTSTYLE = new TextStyle({
  fontSize: 13,
  fontWeight: 'bold',
  fill: COLOR_MAIN,
});
export const NODE_MARGIN = SOCKET_WIDTH / 2;
export const NODE_HEADER_HEIGHT = 24;
export const NODE_PADDING_TOP = 8;
export const NODE_PADDING_BOTTOM = 8;
export const NODE_HEADER_TEXTMARGIN_LEFT = SOCKET_WIDTH / 2 + 14;
export const NODE_HEADER_TEXTMARGIN_TOP = 4;
export const NODE_WIDTH = 160;
export const NODE_CORNERRADIUS = 8;

export const NODE_TYPE_COLOR = {
  DEFAULT: COLOR[0],
  INPUT: COLOR[0],
  TRANSFORM: COLOR[1],
  OUTPUT: COLOR[2],
  DRAW: COLOR[3],
  SHADER: COLOR[4],
};

export const COMMENT_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_COMMENT,
  align: 'left',
  fontStyle: 'italic',
});

export const CONNECTION_COLOR_HEX = PIXI.utils.string2hex(
  Color(COLOR[0]).desaturate(0.3).hex()
);

export const SELECTION_COLOR_HEX = PIXI.utils.string2hex(
  Color(COLOR[4]).desaturate(0.3).hex()
);

export const EMPTY_TEXTURE = '../assets/Empty.png';

export const NOTE_TEXTURE = '../assets/Note-white.png';
export const NOTE_FONT = '../assets/Arial-normal-black.fnt';
export const NOTE_MARGIN_STRING = '3px 0px 0px 5px';
export const NOTE_PADDING = 12;
export const NOTE_FONTSIZE = 32;
export const NOTE_LINEHEIGHT_FACTOR = 1.15;

export const DEFAULT_EDITOR_DATA = `// Cmd/Ctrl-Enter to update node
// Change function name to create new node
function customFunctionNode(a, b) {
  return a * b;
}`;

export const PIXI_PIVOT_OPTIONS = [
  {
    text: 'top left',
    value: { x: 0.0, y: 0.0 },
  },
  {
    text: 'top center',
    value: { x: 0.5, y: 0.0 },
  },
  {
    text: 'top right',
    value: { x: 1.0, y: 0.0 },
  },
  {
    text: 'center left',
    value: { x: 0.0, y: 0.5 },
  },
  {
    text: 'center center',
    value: { x: 0.5, y: 0.5 },
  },
  {
    text: 'center right',
    value: { x: 1.0, y: 0.5 },
  },
  {
    text: 'bottom left',
    value: { x: 0.0, y: 1.0 },
  },
  {
    text: 'bottom center',
    value: { x: 0.5, y: 1.0 },
  },
  {
    text: 'bottom right',
    value: { x: 1.0, y: 1.0 },
  },
];

export const SCALEHANDLE_SIZE = 8;

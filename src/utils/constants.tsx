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

// export const CANVAS_BACKGROUNDCOLOR = '#d3d3d3';
export const CANVAS_BACKGROUNDCOLOR = Color(COLOR[0]).lighten(0.6).hex();
export const CANVAS_BACKGROUNDCOLOR_HEX = PIXI.utils.string2hex(
  CANVAS_BACKGROUNDCOLOR
);
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
  STRING: 'string',
  NUMBER: 'number',
  COLOR: 'color',
  ARRAY: 'array',
  TRIGGER: 'trigger',
  PIXI: 'pixi',
};

export const DATATYPE_DEFAULTVALUE = {
  STRING: '',
  NUMBER: 0,
  COLOR: [255, 55, 0, 0.5],
  ARRAY: [],
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
export const NODE_OUTLINE_DISTANCE = 4;
export const NODE_HEADER_TEXTMARGIN_LEFT = SOCKET_WIDTH / 2 + 14;
export const NODE_HEADER_TEXTMARGIN_TOP = 4;
export const NODE_WIDTH = 160;
export const NODE_CORNERRADIUS = 8;
export const NODE_BACKGROUNDCOLOR = COLOR[0];
export const NODE_BACKGROUNDCOLOR_HEX = PIXI.utils.string2hex(
  NODE_BACKGROUNDCOLOR
);
export const NODE_SELECTIONCOLOR = Color(COLOR[0]).saturate(0.3).hex();
export const NODE_SELECTIONCOLOR_HEX = PIXI.utils.string2hex(
  NODE_SELECTIONCOLOR
);

export const COMMENT_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_COMMENT,
  textAlign: 'right',
  fontStyle: 'italic',
});

export const CONNECTION_COLOR_HEX = PIXI.utils.string2hex(
  Color(COLOR[0]).desaturate(0.3).hex()
);

export const EMPTY_TEXTURE = '../assets/Empty.png';

export const NOTE_TEXTURE = '../assets/Note-white.png';
export const NOTE_MARGIN_STRING = '3px 0px 0px 5px';
export const NOTE_PADDING = 12;
export const NOTE_FONTSIZE = 32;
export const NOTE_LINEHEIGHT_FACTOR = 1.5;

export const DEFAULT_EDITOR_DATA = `// Cmd/Ctrl-s to save/update node
// Change function name to create new node
function customFunctionNode(a, b) {
  return a * b;
}`;

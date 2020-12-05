import * as PIXI from 'pixi.js';
import { TextStyle } from '@pixi/text';

export const CANVAS_BACKGROUNDCOLOR = '#d3d3d3';
export const CANVAS_BACKGROUNDCOLOR_HEX = PIXI.utils.string2hex(
  CANVAS_BACKGROUNDCOLOR
);

export const COLOR_MAIN = '#2E3A59';
export const COLOR_MAIN_HEX = PIXI.utils.string2hex(COLOR_MAIN);

// common
export const TEXT_RESOLUTION = 8; // so one can zoom in closer and it keeps a decent resolution

export const INPUTSOCKET_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_MAIN,
});
export const INPUTSOCKET_HEIGHT = 24;
export const INPUTSOCKET_WIDTH = 12;
export const INPUTSOCKET_CORNERRADIUS = 4;
export const INPUTSOCKET_TEXTMARGIN_LEFT = 8;
export const INPUTSOCKET_TEXTMARGIN_TOP = 4;

export const OUTPUTSOCKET_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_MAIN,
  // textAlign: 'right',
});
export const OUTPUTSOCKET_HEIGHT = 24;
export const OUTPUTSOCKET_WIDTH = 12;
export const OUTPUTSOCKET_CORNERRADIUS = 4;
export const OUTPUTSOCKET_TEXTMARGIN_RIGHT = 8;
export const OUTPUTSOCKET_TEXTMARGIN_TOP = 4;

export const NODE_TEXTSTYLE = new TextStyle({
  fontSize: 13,
  fontWeight: 'bold',
  fill: COLOR_MAIN,
});
export const NODE_HEADER_HEIGHT = 24;
export const NODE_MARGIN_TOP = 8;
export const NODE_MARGIN_BOTTOM = 8;
export const NODE_OUTLINE_DISTANCE = 2;
export const NODE_HEADER_TEXTMARGIN_LEFT = INPUTSOCKET_WIDTH / 2 + 14;
export const NODE_HEADER_TEXTMARGIN_TOP = 4;
export const NODE_WIDTH = 160;
export const NODE_CORNERRADIUS = 8;
export const NODE_BACKGROUNDCOLOR = '#C1CADF';

export const COMMENT_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_MAIN,
  textAlign: 'right',
  fontStyle: 'italic',
});

export const CONNECTION_COLOR_HEX = PIXI.utils.string2hex('#2E5942');

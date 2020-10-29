import { TextStyle } from '@pixi/text';

export const COLOR_MAIN = '#2E3A59';

export const INPUTNODE_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_MAIN,
});
export const INPUTNODE_HEIGHT = 24;
export const INPUTSOCKET_WIDTH = 12;
export const INPUTSOCKET_CORNERRADIUS = 4;
export const INPUTSOCKET_TEXTMARGIN_LEFT = 8;
export const INPUTSOCKET_TEXTMARGIN_TOP = 4;

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

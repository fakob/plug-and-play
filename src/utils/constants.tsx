import * as PIXI from 'pixi.js';
import { createTheme } from '@mui/material';
import Color from 'color';
import { TextStyle } from '@pixi/text';
import { EnumStructure } from '../nodes/datatypes/enumType';
import { darkThemeOverride } from './customTheme';
import { ILayouts, TRgba } from '../utils/interfaces';

export const PP_VERSION = 0.1;

export const URL_PARAMETER_NAME = {
  LOADURL: 'loadURL',
  LOADLOCAL: 'loadLocal',
  NEW: 'new',
  FETCHLOCALGRAPH: 'fetchLocalGraph',
  TOASTEVERYTHING: 'toastEverything',
};

export const GET_STARTED_GRAPH =
  'Begin with an introduction of Plug and Playground';

export const GESTUREMODE = {
  MOUSE: 'Mouse',
  TRACKPAD: 'Trackpad',
  AUTO: 'Auto detect',
} as const;

export const ONCLICK_DOUBLECLICK = 2;
export const ONCLICK_TRIPPLECLICK = 3;

export const ALIGNOPTIONS = {
  ALIGN_LEFT: 'Align left',
  ALIGN_CENTER_HORIZONTAL: 'Align center horizontal',
  ALIGN_RIGHT: 'Align right',
  ALIGN_TOP: 'Align top',
  ALIGN_CENTER_VERTICAL: 'Align center vertical',
  ALIGN_BOTTOM: 'Align bottom',
  DISTRIBUTE_VERTICAL: 'Distribute vertical',
  DISTRIBUTE_HORIZONTAL: 'Distribute horizontal',
} as const;

export const DEFAULT_DRAWER_WIDTH = 340;

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
  '#D4FF00',
];

export const COLOR_WHITE = '#F5F5F5';
export const WHITE_HEX = 0xf5f5f5;
export const COLOR_DARK = '#0C0C0C';
export const DARK_HEX = 0x0c0c0c;
export const COLOR_WHITE_TEXT = '#F4FAF9';
export const COLOR_ERROR = '#FF0000';
export const COLOR_WARNING = '#FF8A00';

export const RANDOMMAINCOLOR = COLOR[Math.floor(Math.random() * COLOR.length)];

export const customTheme = createTheme(darkThemeOverride, {
  palette: {
    primary: {
      light: `${Color(RANDOMMAINCOLOR).lighten(0.1)}`,
      main: `${RANDOMMAINCOLOR}`,
      dark: `${Color(RANDOMMAINCOLOR).darken(0.1)}`,
      contrastText: `${TRgba.white().hex()}`,
    },
    secondary: {
      light: `${Color(RANDOMMAINCOLOR).negate().lighten(0.1)}`,
      main: `${Color(RANDOMMAINCOLOR).negate()}`,
      dark: `${Color(RANDOMMAINCOLOR).negate().darken(0.1)}`,
      contrastText: `${TRgba.white().hex()}`,
    },
    background: {
      paper: `${Color(RANDOMMAINCOLOR).darken(0.5)}`,
      medium: `${Color(RANDOMMAINCOLOR).darken(0.6)}`,
      default: `${Color(RANDOMMAINCOLOR).darken(0.85)}`,
    },
  },
});

export const PRESET_COLORS = [
  '#F4FAF9',
  '#F5F5F5',
  '#0C0C0C',
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
  '#D4FF00',
];

export const ERROR_COLOR = TRgba.fromString('#B71C1C');
export const SUCCESS_COLOR = TRgba.fromString('#4BB543');

export const PLUGANDPLAY_ICON = '../assets/PlugAndPlayIcon-transparent.svg';
export const PLUGANDPLAY_ICON_WHITE = '../assets/PlugAndPlayIconWhite.svg';
export const PLUGANDPLAY_ICON_BLACK = '../assets/PlugAndPlayIconBlack.svg';
export const DRAWER30M_ICON = '../assets/Icon_Drawer30M.svg';
export const DRAWER60M_ICON = '../assets/Icon_Drawer60M.svg';

export const CANVAS_BACKGROUND_TEXTURE =
  '../assets/Pixel_grid_4000x2000.svg.png';
export const CANVAS_BACKGROUND_ALPHA = 0.02;
export const NINE_SLICE_SHADOW = '../assets/NineSliceShadow.png';

export const COLOR_MAIN = Color(COLOR[0]).lighten(0.8).hex();
export const COLOR_COMMENT = COLOR[12];

// common
export const TEXT_RESOLUTION = 8; // so one can zoom in closer and it keeps a decent resolution

export const SOCKET_TYPE = {
  IN: 'in',
  OUT: 'out',
  TRIGGER: 'trigger',
} as const;

export const SOCKET_COLOR_HEX: string = Color(COLOR[0]).lighten(0.4).hex();
export const SOCKET_HEIGHT = 24;
export const SOCKET_WIDTH = 12;
export const SOCKET_CORNERRADIUS = 4;
export const SOCKET_TEXTMARGIN = 8;
export const SOCKET_TEXTMARGIN_TOP = 4;
export const SOCKET_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_MAIN,
});
export const UPDATEBEHAVIOURHEADER_TEXTSTYLE = new TextStyle({
  fontSize: 10,
  fill: '#FFFFFF',
});
export const UPDATEBEHAVIOURHEADER_UPDATE =
  '../assets/Icon_UpdateBehaviour_Update.png';
export const UPDATEBEHAVIOURHEADER_NOUPDATE =
  '../assets/Icon_UpdateBehaviour_NoUpdate.png';
export const EDIT_ICON = '../assets/Icon_Tune.png';

export const ALIGNLEFT_TEXTURE = '../assets/Icon_AlignLeft.png';
export const ALIGNCENTERHORIZONTALLY_TEXTURE =
  '../assets/Icon_AlignCenterHorizontally.png';
export const ALIGNRIGHT_TEXTURE = '../assets/Icon_AlignRight.png';
export const ALIGNTOP_TEXTURE = '../assets/Icon_AlignTop.png';
export const ALIGNCENTERVERTICALLY_TEXTURE =
  '../assets/Icon_AlignCenterVertically.png';
export const ALIGNBOTTOM_TEXTURE = '../assets/Icon_AlignBottom.png';
export const DISTRIBUTEHORIZONTAL_TEXTURE =
  '../assets/Icon_DistributeHorizontally.png';
export const DISTRIBUTEVERTICAL_TEXTURE =
  '../assets/Icon_DistributeVertically.png';

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

export const CONTEXTMENU_WIDTH = 288;
export const CONTEXTMENU_GRAPH_HEIGHT = 734;
export const TOOLTIP_WIDTH = 320;
export const TOOLTIP_DISTANCE = 32;
export const TOOLTIP_DELAY = 700;

export const DRAGANDDROP_GRID_MARGIN = 32;

export const NODE_TYPE_COLOR = {
  DEFAULT: COLOR[1], // Transform
  INPUT: COLOR[0],
  TRANSFORM: COLOR[1],
  DRAW: COLOR[2],
  SHADER: COLOR[3],
  OUTPUT: COLOR[4],
  SYSTEM: COLOR[5],
  MACRO: COLOR[6],
  MISSING: COLOR_ERROR,
};

export const PIXI_TRANSPARENT_ALPHA = 0.001; // If an PIXI element has alpha set to 0 it has no size and is not rendered at all

export const NODE_SOURCE = {
  NEW: 'New',
  NEWCONNECTED: 'NewConnected',
  SERIALIZED: 'Serialized',
} as const;

export enum STATUS_SEVERITY {
  SUCCESS = 1,
  WARNING = 2,
  ERROR = 3,
  FATAL = 4,
}

export const COMMENT_TEXTSTYLE = new TextStyle({
  fontSize: 12,
  fill: COLOR_COMMENT,
  align: 'left',
  fontStyle: 'italic',
});

export const CONNECTION_COLOR_HEX = new PIXI.Color(
  Color(COLOR[0]).desaturate(0.3).hex(),
).toNumber();

export const SELECTION_COLOR_HEX = new PIXI.Color(
  Color(COLOR[4]).desaturate(0.3).hex(),
).toNumber();

export const EMPTY_TEXTURE = '../assets/Empty.png';

export const SELECTION_DOWNSTREAM_TEXTURE =
  '../assets/Icon_SelectDownstream.png';
export const SELECTION_UPSTREAM_TEXTURE = '../assets/Icon_SelectUpstream.png';
export const SELECTION_WHOLE_TEXTURE = '../assets/Icon_SelectWhole.png';

export const NOTE_TEXTURE = '../assets/Note-white.png';
export const NOTE_FONT = '../assets/Arial-normal-black.fnt';
export const NOTE_MARGIN_STRING = '3px 0px 0px 5px';
export const NOTE_PADDING = 12;
export const NOTE_FONTSIZE = 32;
export const NOTE_LINEHEIGHT_FACTOR = 1.15;

export const MAX_STRING_LENGTH = 1000;

export const DEFAULT_EDITOR_DATA = `// Ctrl-Enter to update node
// Change function name to create new node
function customFunctionNode(a, b) {
  return a * b;
}`;

export const DEFAULT_2DVECTOR = {
  x: 0,
  y: 0,
};

export const MAX_LATEST_NODES_IN_SEARCH = 3;

export const PIXI_PIVOT_OPTIONS: EnumStructure = [
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

export const BROKEN_IMAGE =
  'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBmaWxsPSIjRkZGRkZGIiB3aWR0aD0iMTAwcHQiIGhlaWdodD0iMTAwcHQiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8Zz4KICA8cGF0aCBkPSJtMzYuNjY4IDQwYzAgMy42ODM2LTIuOTg0NCA2LjY2OC02LjY2OCA2LjY2OHMtNi42NjgtMi45ODQ0LTYuNjY4LTYuNjY4IDIuOTg0NC02LjY2OCA2LjY2OC02LjY2OCA2LjY2OCAyLjk4NDQgNi42NjggNi42NjgiLz4KICA8cGF0aCBkPSJtNjkuNjkxIDIwbC0xLjk3NjYgNi42NjhoMTUuNjE3djUwaC0zMC40M2wtMS45NzY2IDYuNjY0MWgzOS4wNzR2LTYzLjMzMnoiLz4KICA8cGF0aCBkPSJtNTMuODkxIDczLjMzMmgyNi4xMDl2LTkuNTIzNGMtNi42NTYyLTkuMjUzOS05Ljg0NzctMjIuMTkxLTE2LjI3Ny0yMy42NnoiLz4KICA8cGF0aCBkPSJtNjAuMTM3IDUuNzE4OGwtNC4yMzQ0IDE0LjI4MWgtNDUuOTAydjYzLjMzMmgyNy4xNDVsLTMuNjcxOSAxMi4zODcgNi4zOTQ1IDEuODk0NSAyNi42NjgtOTB6bS0xNS43NyA1My4yMjNjLTIuMjI2Ni0yLjg3MTEtNC40NjQ4LTQuNjUyMy02Ljg2NzItNC42NTIzLTYuNTE1NiAwLTguOTE0MSAxMy44NTUtMTcuNSAxNi42NjR2Mi4zNzg5aDIwLjEwMmwtMC45ODgyOCAzLjMzMi0yMi40NDUgMC4wMDM5MDd2LTUwaDM3LjI2NnoiLz4KIDwvZz4KPC9zdmc+Cg==';

export const DEFAULT_IMAGE =
  'data:image/jpeg;base64,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';

export const IMAGE_TYPES: EnumStructure = [
  {
    text: 'image/png',
  },
  {
    text: 'image/jpeg',
  },
  {
    text: 'image/webp',
  },
];

export const OBJECT_FIT_OPTIONS: EnumStructure = [
  {
    text: 'contain',
  },
  {
    text: 'cover',
  },
  {
    text: 'fill',
  },
  {
    text: 'none',
  },
  {
    text: 'scale-down',
  },
];

export const COMPARISON_OPTIONS: EnumStructure = [
  {
    text: 'Greater than (>)',
    value: '>',
  },
  {
    text: 'Greater than or equal (>=)',
    value: '>=',
  },
  {
    text: 'Less than (<)',
    value: '<',
  },
  {
    text: 'Less than or equal (<=)',
    value: '<=',
  },
  {
    text: 'Equal (==)',
    value: '==',
  },
  {
    text: 'Not equal (!=)',
    value: '!=',
  },
  {
    text: 'Strict equal (===)',
    value: '===',
  },
  {
    text: 'Strict not equal (!==)',
    value: '!==',
  },
  {
    text: 'Logical AND (&&)',
    value: '&&',
  },
  {
    text: 'Logical OR (||)',
    value: '||',
  },
  {
    text: 'Logical NOT (!)',
    value: '!',
  },
];

export const CONDITION_OPTIONS: EnumStructure = [
  {
    text: 'is null OR undefined',
  },
  {
    text: 'is undefined',
  },
  {
    text: 'is null',
  },
  {
    text: 'is NOT null OR undefined',
  },
  {
    text: 'is NOT undefined',
  },
  {
    text: 'is NOT null',
  },
];

export const TRIGGER_TYPE_OPTIONS: EnumStructure = [
  {
    text: 'positiveFlank',
  },
  {
    text: 'negativeFlank',
  },
  {
    text: 'change',
  },
  {
    text: 'always',
  },
];

export const LOADING_STATE = {
  ISLOADING: 'ISLOADING',
  LOADED: 'LOADED',
  FAILED: 'FAILED',
};

export const GRID_SHADER = `
  precision mediump float;
  varying vec2 vUvs;
  uniform float zoom;

  void main()
  {
      //Generate a simple grid.
      //Offset uv so that center is 0,0 and edges are -1,1
      vec2 uv = (vUvs-vec2(0.5))*2.0;
      vec2 gUv = floor(uv*zoom);
      vec4 color1 = vec4(0.0, 0.0, 0.0, 0.0);
      vec4 color2 = vec4(0.0, 0.0, 0.0, 0.05);
      vec4 outColor = mod(gUv.x + gUv.y, 2.) < 0.5 ? color1 : color2;
      gl_FragColor = outColor;

  }`;

// Vertex shader. Use same shader for all passes.
export const BASIC_VERTEX_SHADER = `
  precision mediump float;

  attribute vec2 aVertexPosition;
  attribute vec2 aUvs;

  uniform mat3 translationMatrix;
  uniform mat3 projectionMatrix;

  varying vec2 vUvs;

  void main() {

      vUvs = aUvs;
      gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

  }`;

export const PXSHOW_SQL_QUERY = `SELECT json_extract(state,'$.State') as State FROM states
WHERE service IS 'Store'`;

export const LAYOUTS_EMPTY: ILayouts = { default: [] };

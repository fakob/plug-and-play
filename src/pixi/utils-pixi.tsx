import Color from 'color';
import { TRgba } from '../utils/interfaces';

export const rgbToHex = (rgbArray: number[]): string => {
  return rgbArray
    .slice(0, 3)
    .map((x) => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
};

export const rgbToRgba = (rgbInput: string | number[] | undefined): TRgba => {
  let rgbArray;
  if (rgbInput) {
    if (typeof rgbInput === 'string') {
      rgbArray = rgbInput.split(',');
    } else {
      rgbArray = rgbInput;
    }
    return {
      r: rgbArray[0],
      g: rgbArray[1],
      b: rgbArray[2],
      a: rgbArray[3],
    };
  }
};

export const hexToTRgba = (hex: string, alpha?: number): TRgba => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return { r, g, b, a: alpha };
  } else {
    return { r, g, b, a: 1.0 };
  }
};

export const trgbaToColor = (trgba: TRgba): Color => {
  return Color({
    r: trgba.r,
    g: trgba.g,
    b: trgba.b,
  }).alpha(trgba.a);
};

export const colorToTrgba = (color: Color): TRgba => {
  return { ...color.object(), a: color.alpha() };
};

export const getTextWithLineBreaks = (node: any): string => {
  // we only deal with TextNodes
  if (!node || !node.parentNode || node.nodeType !== 3) return '';
  // our Range object form which we'll get the characters positions
  const range = document.createRange();
  // here we'll store all our lines
  const lines = [];
  // begin at the first char
  range.setStart(node, 0);
  // initial position
  let prevBottom = range.getBoundingClientRect().bottom;
  const str = node.textContent;
  let current = 1; // we already got index 0
  let lastFound = 0;
  let bottom = 0;
  // iterate over all characters
  while (current <= str.length) {
    // move our cursor
    range.setStart(node, current);
    if (current < str.length - 1) range.setEnd(node, current + 1);
    bottom = range.getBoundingClientRect().bottom;
    if (bottom > prevBottom) {
      // line break
      lines.push(
        str.substr(lastFound, current - lastFound) // text content
      );
      prevBottom = bottom;
      lastFound = current;
    }
    current++;
  }
  // push the last line
  lines.push(str.substr(lastFound));

  return lines.join('\n');
};

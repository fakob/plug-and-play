import * as PIXI from 'pixi.js';
import Color from 'color';
import PPNode from '../classes/NodeClass';
import { TRgba } from '../utils/interfaces';
import { COLOR } from '../utils/constants';

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
  if (trgba) {
    return Color({
      r: trgba.r,
      g: trgba.g,
      b: trgba.b,
    }).alpha(trgba.a);
  } else {
    return Color(COLOR[5]);
  }
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

export const getObjectsInsideBounds = (
  nodes: PPNode[],
  selectionRect: PIXI.Rectangle
): PPNode[] => {
  // console.log(selectionRect);
  const selectedNodes: PPNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeBounds = node.getBounds();
    // console.log(
    //   nodeBounds,
    //   nodeBounds.x >= selectionRect.x && nodeBounds.y >= selectionRect.y
    // );
    const isInside =
      nodeBounds.x >= selectionRect.x &&
      nodeBounds.y >= selectionRect.y &&
      nodeBounds.x + nodeBounds.width <=
        selectionRect.x + selectionRect.width &&
      nodeBounds.y + nodeBounds.height <=
        selectionRect.y + selectionRect.height;
    if (isInside) {
      selectedNodes.push(node);
    }
  }
  return selectedNodes;
};

export const getBoundsOfNodes = (nodes: PPNode[]): PIXI.Rectangle => {
  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxX = -Number.MAX_VALUE;
  let maxY = -Number.MAX_VALUE;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeBounds = node.getBounds();
    minX = nodeBounds.x < minX ? nodeBounds.x : minX;
    minY = nodeBounds.y < minY ? nodeBounds.y : minY;
    maxX =
      nodeBounds.x + nodeBounds.width > maxX
        ? nodeBounds.x + nodeBounds.width
        : maxX;
    maxY =
      nodeBounds.y + nodeBounds.height > maxY
        ? nodeBounds.y + nodeBounds.height
        : maxY;
  }
  return new PIXI.Rectangle(minX, minY, maxX - minX, maxY - minY);
};

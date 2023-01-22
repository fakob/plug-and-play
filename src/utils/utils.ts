import React, { useEffect, useState, useRef } from 'react';
import JSON5 from 'json5';
import * as PIXI from 'pixi.js';
import * as XLSX from 'xlsx';

import PPGraph from '../classes/GraphClass';
import PPSocket from '../classes/SocketClass';
import PPNode from '../classes/NodeClass';
import {
  CONDITION_OPTIONS,
  NODE_PADDING_TOP,
  NODE_HEADER_HEIGHT,
  SOCKET_TEXTMARGIN_TOP,
  SOCKET_WIDTH,
  GESTUREMODE,
} from './constants';
import { GraphDatabase } from './indexedDB';
import { SerializedSelection } from './interfaces';
import { AnyType } from '../nodes/datatypes/anyType';
import { Viewport } from 'pixi-viewport';

export function isFunction(funcOrClass: any): boolean {
  const propertyNames = Object.getOwnPropertyNames(funcOrClass);
  console.log(propertyNames);
  return (
    !propertyNames.includes('prototype') || propertyNames.includes('arguments')
  );
}

export function isClass(item: any): boolean {
  console.log(item.constructor.name);
  return (
    item.constructor.name !== 'Function' && item.constructor.name !== 'Object'
  );
}

export function convertToArray<T>(value: T | T[]): T[] {
  let array: T[] = [];
  if (Array.isArray(value)) {
    array = value;
  } else {
    array.push(value);
  }
  return array;
}

export function convertToString(value: unknown): string {
  let newValue;
  if (typeof value === 'object') {
    newValue = JSON.stringify(value, getCircularReplacer(), 2);
  } else if (typeof value !== 'string') {
    newValue = String(value);
  } else {
    newValue = value;
  }
  return newValue;
}

export function getElement(value: number | number[], index: number): number {
  let array: number[] = [];
  if (Array.isArray(value)) {
    array = value;
  } else {
    array.push(value);
  }
  return index < array.length ? array[index] : array[array.length - 1];
}

export function getNodeCommentPosX(width: number): number {
  return width + SOCKET_WIDTH;
}

export function getNodeCommentPosY(): number {
  return NODE_PADDING_TOP + NODE_HEADER_HEIGHT + SOCKET_TEXTMARGIN_TOP - 8;
}

export function highlightText(text: string, query: string): any {
  let lastIndex = 0;
  const words = query
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map(escapeRegExpChars);
  if (words.length === 0) {
    return [text];
  }
  const regexp = new RegExp(words.join('|'), 'gi');
  const tokens: React.ReactNode[] = [];
  while (true) {
    const match = regexp.exec(text);
    if (!match) {
      break;
    }
    const length = match[0].length;
    const before = text.slice(lastIndex, regexp.lastIndex - length);
    if (before.length > 0) {
      tokens.push(before);
    }
    lastIndex = regexp.lastIndex;
    tokens.push(
      React.createElement(
        'strong',
        {
          key: lastIndex,
        },
        match[0]
      )
    );
  }
  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push(rest);
  }
  return tokens;
}

export function escapeRegExpChars(text: string): string {
  return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
}

export const roundNumber = (number: number, decimals = 2): number =>
  Math.round(number * 10 ** decimals + Number.EPSILON) / 10 ** decimals; // rounds the number with 3 decimals

export const limitRange = (
  value: number,
  lowerLimit: number,
  upperLimit: number
): number => {
  const min = Math.min(lowerLimit, upperLimit);
  const max = Math.max(lowerLimit, upperLimit);

  return Math.min(Math.max(min, value), max);
};

export const mapRange = (
  value: number,
  low1: number,
  high1: number,
  low2: number,
  high2: number,
  returnInt = true
): number => {
  // special case, prevent division by 0
  if (high1 - low1 === 0) {
    return 0;
  }
  // * 1.0 added to force float division
  let newValue =
    low2 + (high2 - low2) * (((value - low1) * 1.0) / (high1 - low1));
  newValue = Math.round(newValue * 1000 + Number.EPSILON) / 1000; // rounds the number with 3 decimals
  let limitedNewValue = Math.min(Math.max(newValue, low2), high2);
  if (returnInt) {
    limitedNewValue = Math.round(limitedNewValue);
  }
  return limitedNewValue;
};

export const fetchAsBlob = (url) => {
  return fetch(url).then((response) => response.blob());
};

export const convertBlobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
};

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
};

export const downloadFile = (
  content: string,
  fileName: string,
  contentType: string
): void => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
};

export const formatDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${[year, month, day].join('-')} at ${[hour, minutes, seconds].join(
    '.'
  )}`;
};

export const getDifferenceSelection = (
  firstSelection: PPNode[],
  secondSelection: PPNode[]
): PPNode[] => {
  return firstSelection
    .filter((x) => !secondSelection.includes(x))
    .concat(secondSelection.filter((x) => !firstSelection.includes(x)));
};

export const truncateText = (
  inputString: string,
  maxLength: number
): string => {
  if (inputString.length > maxLength) {
    return inputString.substring(0, maxLength) + '...';
  }
  return inputString;
};

export const useStateRef = (initialValue: any) => {
  const [value, setValue] = useState(initialValue);

  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return [value, setValue, ref];
};

export const removeExtension = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, '');
};

export const getSetting = async (
  db: GraphDatabase,
  settingsName: string
): Promise<string | undefined> => {
  const settingsObject = await db.settings
    .where({
      name: settingsName,
    })
    .first();
  const setting = settingsObject?.value;
  return setting;
};

export function setGestureModeOnViewport(
  viewport: Viewport,
  gestureMode = undefined
) {
  viewport.wheel({
    smooth: 3,
    trackpadPinch: true,
    wheelZoom: gestureMode === GESTUREMODE.TRACKPAD ? false : true,
  });
}

export const getMethods = (o): string[] => {
  return Object.getOwnPropertyNames(Object.getPrototypeOf(o)).filter(
    (m) => 'function' === typeof o[m]
  );
};

export const writeTextToClipboard = (newClip: string): void => {
  navigator.clipboard.writeText(newClip).then(
    function () {
      /* clipboard successfully set */
    },
    function () {
      console.error('Writing to clipboard of this text failed:', newClip);
    }
  );
};

export const writeNodeDataToClipboard = (stringifiedData: string): void => {
  // const dataObject = {
  //   type: 'plug-and-playground/clipboard',
  //   data: stringifiedData,
  // };

  const htmlString = `<plugandplayground>${stringifiedData}</plugandplayground>`;

  if (navigator.clipboard && window.ClipboardItem) {
    navigator.clipboard
      .write([
        new ClipboardItem({
          'text/plain': new Blob([stringifiedData], {
            type: 'text/plain',
          }),
          'text/html': new Blob([htmlString], { type: 'text/html' }),
        }),
      ])
      .then(
        function () {
          /* clipboard successfully set */
        },
        function () {
          console.error(
            'Writing to clipboard of this text failed:',
            stringifiedData
          );
        }
      );
  }
};

export const writeDataToClipboard = (data: unknown): void => {
  writeNodeDataToClipboard(
    JSON.stringify(data, getCircularReplacer(), 2) || ''
  );
};

export const getDataFromClipboard = async (): Promise<
  Record<string, string>
> => {
  // get text from clipboard and try to parse it
  try {
    const clipboardItems = await navigator.clipboard.read();
    const clipboardBlobs = {};
    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        const blob = await clipboardItem.getType(type);
        clipboardBlobs[type] = await blob.text();
      }
    }
    return clipboardBlobs;
  } catch (err) {
    console.error(err.name, err.message);
  }
};

export const getNodeDataFromHtml = (html: string): SerializedSelection => {
  const maybeJson = html
    .match(/<plugandplayground>([\s\S]*)<\/plugandplayground>/)?.[1]
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  return JSON.parse(maybeJson) as SerializedSelection;
};

export const getNodeDataFromText = (text: string): SerializedSelection => {
  return JSON.parse(text) as SerializedSelection;
};

export const isEventComingFromWithinTextInput = (event: any): boolean => {
  return (
    event.target.id === 'Input' ||
    event.target.localName === 'input' ||
    event.target.localName === 'textarea' ||
    event.target?.attributes?.['data-slate-editor'] !== undefined ||
    event.target?.attributes?.['data-slate-node'] !== undefined ||
    event.target?.attributes?.['data-slate-string'] !== undefined ||
    event.target?.attributes?.['data-slate-zero-width'] !== undefined ||
    event.target?.attributes?.['data-slate-length'] !== undefined
  );
};

export const calculateAspectRatioFit = (
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
  minWidth: number,
  minHeight: number
): { width: number; height: number } => {
  let ratio = Math.min(newWidth / oldWidth, newHeight / oldHeight);
  const tempWidth = oldWidth * ratio;
  const tempHeight = oldHeight * ratio;
  if (tempWidth < minWidth || tempHeight < minHeight) {
    ratio = Math.max(minWidth / oldWidth, minHeight / oldHeight);
  }
  return { width: oldWidth * ratio, height: oldHeight * ratio };
};

export const replacePartOfObject = (
  originalObject: any,
  pathToReplace: string,
  value: any
): any => {
  let objValue = value;
  const parsedJSON = parseJSON(value);
  if (parsedJSON) {
    objValue = parsedJSON;
  } else {
    console.log('Value is probably a primitive:', value);
  }

  // duplicate originalObject
  const obj = JSON.parse(JSON.stringify(originalObject));

  let movingPointer = obj;
  const parts = pathToReplace
    .split('.')
    .map((item) => item.replace(/[\[\]']+/g, '')); // remove square brackets for arrays

  let part;
  const last = parts.pop();

  // navigate to the property to be replaced
  while ((part = parts.shift())) {
    if (typeof movingPointer[part] !== 'object') movingPointer[part] = {};
    movingPointer = movingPointer[part];
  }

  // replace with value
  movingPointer[last] = objValue;
  return obj;
};

export const parseJSON = (jsonToParse: any): { [key: string]: any } => {
  let jsonObj: any;
  switch (typeof jsonToParse) {
    case 'string':
      jsonObj = JSON5.parse(jsonToParse);
      break;
    case 'object':
      jsonObj = jsonToParse;
      break;

    default:
      jsonObj = {};
      break;
  }
  return jsonObj;
};

export const getXLSXSelectionRange = (
  sri: number,
  sci: number,
  eri: number,
  eci: number
): string => {
  const selectionRange = `${XLSX.utils.encode_col(sci)}${XLSX.utils.encode_row(
    sri
  )}:${XLSX.utils.encode_col(eci)}${XLSX.utils.encode_row(eri)}`;
  return selectionRange;
};

export const compare = (
  inputA: unknown,
  chosenOperator: string,
  inputB: unknown
): unknown => {
  switch (chosenOperator) {
    case '>':
      return inputA > inputB;
    case '<':
      return inputA < inputB;
    case '>=':
      return inputA >= inputB;
    case '<=':
      return inputA <= inputB;
    case '==':
      return inputA == inputB;
    case '!=':
      return inputA != inputB;
    case '===':
      return inputA === inputB;
    case '!==':
      return inputA !== inputB;
    case '&&':
      return inputA && inputB;
    case '||':
      return inputA || inputB;
    case '!':
      return !inputA;
  }
};

export const isVariable = (
  inputA: unknown,
  chosenCondition: string
): unknown => {
  switch (chosenCondition) {
    case CONDITION_OPTIONS[0].text:
      return typeof inputA === 'undefined' || inputA === null;
    case CONDITION_OPTIONS[1].text:
      return typeof inputA === 'undefined';
    case CONDITION_OPTIONS[2].text:
      return inputA === null;
    case CONDITION_OPTIONS[3].text:
      return typeof inputA !== 'undefined' && inputA !== null;
    case CONDITION_OPTIONS[4].text:
      return typeof inputA !== 'undefined';
    case CONDITION_OPTIONS[5].text:
      return inputA !== null;
    default:
      return false;
  }
};

export async function connectNodeToSocket(
  socket: PPSocket,
  node: PPNode
): Promise<void> {
  if (!node) {
    return;
  }
  const input = socket.isInput() ? socket : getMatchingSocket(socket, node);
  const output = !socket.isInput() ? socket : getMatchingSocket(socket, node);
  if (!input || !output) {
    return;
  }
  // this is an action, feel free to chance
  await PPGraph.currentGraph.action_Connect(output, input);
}

export const getMatchingSocket = (socket: PPSocket, node: PPNode): PPSocket => {
  const socketArray = socket.isInput()
    ? node.outputSocketArray
    : node.inputSocketArray;
  if (socketArray.length > 0) {
    const getSocket = (
      condition,
      onlyFreeSocket,
      onlyVisibleSocket = true
    ): PPSocket => {
      return socketArray.find((socketInArray) => {
        return (
          (!onlyVisibleSocket || socketInArray.visible) &&
          condition(socketInArray) &&
          (!onlyFreeSocket || !socketInArray.hasLink())
        );
      });
    };

    const preferredCondition = (socketInArray): boolean => {
      const preferredSocketName = socketInArray.isInput()
        ? node.getPreferredInputSocketName()
        : node.getPreferredOutputSocketName();
      return socketInArray.name === preferredSocketName;
    };

    const exactMatchCondition = (socketInArray): boolean => {
      return socketInArray.dataType.constructor === socket.dataType.constructor;
    };

    const anyTypeCondition = (socketInArray): boolean => {
      return socketInArray.dataType.constructor === new AnyType().constructor;
    };

    const anyCondition = (): boolean => {
      return true;
    };

    return (
      getSocket(preferredCondition, true, false) ?? // get preferred with no link
      getSocket(exactMatchCondition, true) ?? // get exact match with no link
      getSocket(anyTypeCondition, true) ?? // get anyType with no link
      getSocket(anyCondition, true) ?? // get any with no link
      // no match free and visible
      getSocket(preferredCondition, false, false) ??
      getSocket(exactMatchCondition, false) ??
      getSocket(anyTypeCondition, false) ??
      getSocket(anyCondition, false) ??
      // no match linked and visible
      getSocket(exactMatchCondition, false, false) ??
      getSocket(anyTypeCondition, false, false) ??
      getSocket(anyCondition, false, false)
    );
  }
  // node does not have an in/output socket
  return undefined;
};

export const indexToAlphaNumName = (num: number) => {
  let alpha = '';

  for (; num >= 0; num = parseInt(String(num / 26), 10) - 1) {
    alpha = String.fromCharCode((num % 26) + 0x41) + alpha;
  }

  return alpha;
};

export const getLongestArrayInArray = (arrayOfArrays): number => {
  const longestArray = arrayOfArrays.reduce((a, b) => {
    return a.length > b.length ? a : b;
  }, []);
  return longestArray.length;
};

export const addRowToArrayOfArrays = (
  arrayOfArrays: any[],
  insertIndex
): any[] => {
  arrayOfArrays.splice(
    insertIndex,
    0,
    Array(getLongestArrayInArray(arrayOfArrays)).fill('')
  );
  return arrayOfArrays;
};

export const removeRowFromArrayOfArrays = (
  arrayOfArrays: any[],
  insertIndex
): any[] => {
  arrayOfArrays.splice(insertIndex, 1);
  return arrayOfArrays;
};

export const addColumnToArrayOfArrays = (
  arrayOfArrays: any[],
  insertIndex
): any[] => {
  const newArrayOfArrays = arrayOfArrays.map((row) => {
    row.splice(insertIndex, 0, '');
    return row;
  });
  return newArrayOfArrays;
};

export const removeColumnFromArrayOfArrays = (
  arrayOfArrays: any[],
  insertIndex
): any[] => {
  const newArrayOfArrays = arrayOfArrays.map((row) => {
    row.splice(insertIndex, 1);
    return row;
  });
  return newArrayOfArrays;
};

export function getCurrentCursorPosition(): PIXI.Point {
  let mousePosition: PIXI.Point = JSON.parse(
    JSON.stringify(
      PPGraph.currentGraph.app.renderer.plugins.interaction.mouse.global
    )
  );
  const viewport = PPGraph.currentGraph.viewport;

  mousePosition = viewport.toWorld(mousePosition);
  return mousePosition;
}

export function getCurrentButtons(): number {
  return PPGraph.currentGraph.app.renderer.plugins.interaction.mouse.buttons;
}

export function sortCompare(a: string, b: string, desc: boolean): number {
  // make sure that empty lines are always on the bottom
  if (a == '' || a == null) return 1;
  if (b == '' || b == null) return -1;

  if (desc) {
    [b, a] = [a, b];
  }

  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function removeUrlParameter(parameter: string): void {
  // Get the current URL
  const currentUrl = new URL(window.location.href);
  const searchParams = new URLSearchParams(currentUrl.search);

  // Remove the specified parameter
  searchParams.delete(parameter);

  // Update the URL
  currentUrl.search = searchParams.toString();
  window.history.pushState({}, '', currentUrl.href);
}

export function createGist(
  description: string,
  fileName: string,
  fileContent: string,
  isPublic: boolean
) {
  const data = { description, fileName, fileContent, isPublic };
  return fetch('/create-gist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export function updateGist(
  gistId: string,
  description: string,
  fileName: string,
  fileContent: string
) {
  const data = {
    gistId,
    description,
    fileName: fileName ? fileName : undefined,
    fileContent: fileContent ? fileContent : undefined,
  };
  return fetch('/update-gist', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

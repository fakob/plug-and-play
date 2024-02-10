import React, { useEffect, useState, useRef } from 'react';
import JSON5 from 'json5';
import * as PIXI from 'pixi.js';
import isUrl from 'is-url';
import { hri } from 'human-readable-ids';
import { useTheme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import PPStorage from '../PPStorage';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import {
  CONDITION_OPTIONS,
  GESTUREMODE,
  MAX_STRING_LENGTH,
  NODE_HEADER_HEIGHT,
  NODE_PADDING_TOP,
  SOCKET_TEXTMARGIN_TOP,
  SOCKET_WIDTH,
  URL_PARAMETER_NAME,
} from './constants';
import { GraphDatabase } from './indexedDB';
import {
  IWarningHandler,
  SerializedSelection,
  TNodeId,
  TParseType,
  TSocketId,
  TSocketType,
} from './interfaces';
import { Viewport } from 'pixi-viewport';
import { AbstractType } from '../nodes/datatypes/abstractType';
import { PNPSuccess, SocketParsingWarning } from '../classes/ErrorClass';

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
    try {
      newValue = JSON.stringify(value, getCircularReplacer(), 2);
    } catch (error) {
      console.error(error);
    }
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
        match[0],
      ),
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
  upperLimit: number,
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
  returnInt = true,
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
  content: string | ArrayBufferLike,
  fileName: string,
  contentType: string,
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
    '.',
  )}`;
};

export const getDifferenceSelection = (
  firstSelection: PPNode[],
  secondSelection: PPNode[],
): PPNode[] => {
  return firstSelection
    .filter((x) => !secondSelection.includes(x))
    .concat(secondSelection.filter((x) => !firstSelection.includes(x)));
};

export const truncateText = (
  inputString: string,
  maxLength: number,
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

export const getFileExtension = (fileName: string): string => {
  return fileName
    .slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2)
    .toLowerCase();
};

export const removeExtension = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, '');
};

export const getSetting = async (
  db: GraphDatabase,
  settingsName: string,
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
  gestureMode = undefined,
) {
  viewport.wheel({
    smooth: 3,
    trackpadPinch: true,
    wheelZoom: gestureMode === GESTUREMODE.TRACKPAD ? false : true,
  });
}

export const getMethods = (o): string[] => {
  return Object.getOwnPropertyNames(Object.getPrototypeOf(o)).filter(
    (m) => 'function' === typeof o[m],
  );
};

export const writeTextToClipboard = (newClip: string): void => {
  navigator.clipboard.writeText(newClip).then(
    function () {
      /* clipboard successfully set */
    },
    function () {
      console.error('Writing to clipboard of this text failed:', newClip);
    },
  );
};

export const escapeHtml = (str: string) => {
  const element = document.createElement('div');
  element.textContent = str;
  return element.innerHTML;
};

export const unescapeHtml = (escapedStr: string) => {
  const element = document.createElement('div');
  element.innerHTML = escapedStr;
  return element.textContent;
};

export const writeNodeDataToClipboard = (stringifiedData: string): void => {
  const htmlString = `<plugandplayground>${escapeHtml(
    stringifiedData,
  )}</plugandplayground>`;

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
            stringifiedData,
          );
        },
      );
  }
};

export const writeDataToClipboard = (data: unknown): void => {
  writeNodeDataToClipboard(
    JSON.stringify(data, getCircularReplacer(), 2) || '',
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
  const regex = /<plugandplayground>([\s\S]*)<\/plugandplayground>/;
  const maybeJson = unescapeHtml(regex.exec(html)?.[1]);
  return JSON.parse(maybeJson) as SerializedSelection;
};

export const getNodeDataFromText = (text: string): SerializedSelection => {
  return JSON.parse(text) as SerializedSelection;
};

export const isEventComingFromWithinTextInput = (event: any): boolean => {
  return (
    (event.target.id as string).endsWith('Input') ||
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
  minHeight: number,
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
  value: any,
): any => {
  let objValue = value;
  const parsedJSON = parseJSON(value).value;
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

export const parseJSON = (data: any, strictParsing = false): TParseType => {
  let parsedData;
  const warnings: SocketParsingWarning[] = [];
  if (typeof data === 'string' || strictParsing) {
    try {
      parsedData = JSON5.parse(data);
    } catch (error) {}
  }
  if (parsedData == undefined) {
    if (typeof data == 'object') {
      parsedData = data;
    } else {
      try {
        parsedData = JSON.parse(JSON.stringify(data));
      } catch (error) {
        parsedData = {};
        warnings.push(new SocketParsingWarning('Not a JSON. {} is returned'));
      }
    }
  }

  return {
    value: parsedData,
    warnings: warnings,
  };
};

export const compare = (
  inputA: unknown,
  chosenOperator: string,
  inputB: unknown,
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
  chosenCondition: string,
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
  node: PPNode,
): Promise<void> {
  if (!node) {
    return;
  }
  const input = socket.isInput()
    ? socket
    : node.getSocketForNewConnection(socket);
  const output = !socket.isInput()
    ? socket
    : node.getSocketForNewConnection(socket);
  if (!input || !output) {
    return;
  }
  await PPGraph.currentGraph.action_Connect(output, input);
}

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
  insertIndex,
): any[] => {
  arrayOfArrays.splice(
    insertIndex,
    0,
    Array(getLongestArrayInArray(arrayOfArrays)).fill(''),
  );
  return arrayOfArrays;
};

export const removeRowFromArrayOfArrays = (
  arrayOfArrays: any[],
  insertIndex,
): any[] => {
  arrayOfArrays.splice(insertIndex, 1);
  return arrayOfArrays;
};

export const addColumnToArrayOfArrays = (
  arrayOfArrays: any[],
  insertIndex,
): any[] => {
  const newArrayOfArrays = arrayOfArrays.map((row) => {
    row.splice(insertIndex, 0, '');
    return row;
  });
  return newArrayOfArrays;
};

export const removeColumnFromArrayOfArrays = (
  arrayOfArrays: any[],
  insertIndex,
): any[] => {
  const newArrayOfArrays = arrayOfArrays.map((row) => {
    row.splice(insertIndex, 1);
    return row;
  });
  return newArrayOfArrays;
};

// TODO this function sometimes returns 0,0 (before graph has gotten event), fix this (and function below)
export function getCurrentCursorPosition(): PIXI.Point {
  if (PPGraph.currentGraph.pointerEvent) {
    const event = PPGraph.currentGraph.pointerEvent;
    let pointerPosition: PIXI.Point = JSON.parse(
      JSON.stringify(new PIXI.Point(event.clientX, event.clientY)),
    );
    const viewport = PPGraph.currentGraph.viewport;

    pointerPosition = viewport.toWorld(pointerPosition);
    return pointerPosition;
  } else {
    console.warn(
      'Failed to get cursor event (probably not set yet), returning 0,0',
    );
    return new PIXI.Point(0, 0);
  }
}

export function getCurrentButtons(): number {
  if (PPGraph.currentGraph.pointerEvent.buttons) {
    return PPGraph.currentGraph.pointerEvent.buttons;
  } else {
    console.warn(
      'Failed to get cursor event (probably not set yet), returning 0',
    );
    return 0;
  }
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
  const currentUrl = new URL(window.location.href);
  const searchParams = new URLSearchParams(currentUrl.search);
  searchParams.delete(parameter);
  currentUrl.search = searchParams.toString();
  window.history.pushState({}, '', currentUrl.href);
}

export const updateLocalIdInURL = (localGraphID) => {
  const urlObj = new URL(window.location.href);
  const previousLocalGraphID = urlObj.searchParams.get(
    URL_PARAMETER_NAME.LOADLOCAL,
  );
  urlObj.searchParams.set(URL_PARAMETER_NAME.LOADLOCAL, localGraphID);

  // only add to history if there was a change
  if (previousLocalGraphID !== localGraphID) {
    history.pushState(null, '', urlObj.toString());
  }
};

export function createGist(
  description: string,
  fileName: string,
  fileContent: string,
  isPublic: boolean,
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

export const cutOrCopyClipboard = async (e: ClipboardEvent): Promise<void> => {
  const selection = document.getSelection();
  // if text selection is empty
  // prevent default and copy selected nodes
  if (selection.toString() === '') {
    e.preventDefault();
    const serializeSelection = PPGraph.currentGraph.serializeSelection();
    writeDataToClipboard(serializeSelection);
    if (e.type === 'cut') {
      PPGraph.currentGraph.action_DeleteSelectedNodes();
    }
  }
};

export const pasteClipboard = async (e: ClipboardEvent): Promise<void> => {
  if (!isEventComingFromWithinTextInput(e)) {
    const clipboardBlobs = await getDataFromClipboard();

    const tryGettingDataAndAdd = async (mimeType) => {
      const mouseWorld = getCurrentCursorPosition();
      let data;
      try {
        // check if it is node data
        if (mimeType === 'text/html') {
          data = getNodeDataFromHtml(clipboardBlobs[mimeType]);
        } else {
          data = getNodeDataFromText(clipboardBlobs[mimeType]);
        }
        e.preventDefault();
        await PPGraph.currentGraph.action_pasteNodes(
          data,
          new PIXI.Point(mouseWorld.x, mouseWorld.y),
        );
        return true;
      } catch (e) {
        console.log(`No node data in ${mimeType}`, e);
      }
      try {
        data = clipboardBlobs[mimeType];
        e.preventDefault();
        if (PPGraph.currentGraph.selection.selectedNodes.length < 1) {
          if (isUrl(data)) {
            await PPGraph.currentGraph.addNewNode('EmbedWebsite', {
              nodePosX: mouseWorld.x,
              nodePosY: mouseWorld.y,
              initialData: `<iframe src="${data}" style="width: 100%; height: 100%;"></iframe>`,
            });
          } else {
            await PPGraph.currentGraph.addNewNode('TextEditor', {
              nodePosX: mouseWorld.x,
              nodePosY: mouseWorld.y,
              initialData: {
                ...(mimeType === 'text/html'
                  ? { html: data }
                  : { plain: data }),
              },
            });
          }
        }
        return true;
      } catch (e) {
        console.log(`No text data in ${mimeType}`, e);
      }
    };

    let result = false;
    if (clipboardBlobs['text/html']) {
      result = await tryGettingDataAndAdd('text/html');
    }
    if (!result && clipboardBlobs['text/plain']) {
      await tryGettingDataAndAdd('text/plain');
    }
  }
};

export function getLoadedValue(value, shouldLoadAll) {
  return shouldLoadAll
    ? String(value)
    : String(value)?.slice(0, MAX_STRING_LENGTH) + '...';
}

export const getExampleURL = (path: string, fileName: string): string => {
  return `${
    window.location.origin
  }/assets/examples/${path}/${encodeURIComponent(fileName)}.ppgraph`;
};

export const getLoadExampleURL = (path: string, fileName: string): string => {
  const fullPath = `${window.location.origin}${
    window.location.pathname
  }?loadURL=${getExampleURL(path, fileName)}`;
  return fullPath;
};

export const getLoadGraphExampleURL = (graphName: string): string => {
  return getLoadExampleURL('', graphName);
};

export const getLoadNodeExampleURL = (nodeName: string): string => {
  return getLoadExampleURL('nodes', nodeName);
};

export function isPhone(): boolean {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];

  return toMatch.some((toMatchItem) => {
    return navigator.userAgent.match(toMatchItem);
  });
}

export function controlOrMetaKey() {
  return isMac() ? '⌘' : 'Ctrl';
}

export function isMac(): boolean {
  return navigator.platform.indexOf('Mac') != -1;
}

// needs ThemeProvider context
export function useIsSmallScreen(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
}

export const wrapDownloadLink = (URL: string, text = '') => {
  return `<a style="color:#E154BB;text-decoration:none;" href="${URL}" target="_blank">${
    text || URL
  }</a>`;
};

export const saveBase64AsImage = async (base64, fileName) => {
  const data = await fetch(base64).then((b) => b.arrayBuffer());

  // extract format
  const regex = /^data:image\/(\w+);/;
  const matches = base64.match(regex);
  const imageType = matches ? matches[1] : 'png';
  downloadFile(
    data,
    `${fileName} - ${formatDate()}.${imageType}`,
    `image/${imageType}`,
  );
};

export const updateDataIfDefault = (
  node: PPNode,
  inputSocketName: string,
  defaultData: any,
  dataToUpdate: any,
): void => {
  if (defaultData === node.getInputData(inputSocketName)) {
    node.setInputData(inputSocketName, dataToUpdate);
    node.executeOptimizedChain();
  }
};

export const getObjectAtPoint = (point): PIXI.DisplayObject => {
  const boundary = new PIXI.EventBoundary(PPGraph.currentGraph.app.stage);
  const objectsUnderPoint = boundary.hitTest(point.x, point.y);
  return objectsUnderPoint;
};

export function getConfigData(selectedNodeOrGraph: PPNode | PPGraph) {
  return JSON.stringify(
    selectedNodeOrGraph?.serialize(),
    getCircularReplacer(),
    2,
  );
}

export const constructLocalResourceId = (fileName, fileSize) => {
  return `${fileName}-${fileSize}`;
};

export const getFileNameFromLocalResourceId = (localResourceId) => {
  const regex = /(.+)-\d+$/;
  return localResourceId.match(regex)[1];
};

export const getExtensionFromLocalResourceId = (localResourceId) => {
  const fileName = getFileNameFromLocalResourceId(localResourceId);
  return getFileExtension(fileName);
};

export const constructSocketId = (
  nodeId: TNodeId,
  socketType: TSocketType,
  socketName: string,
): TSocketId => {
  return `${nodeId}-${socketType}-${socketName}`;
};

export const deconstructSocketId = (
  socketId: string,
): {
  nodeId: TNodeId;
  socketType: TSocketType;
  socketName: string;
} => {
  const pattern = /^([a-z]+-[a-z]+-\d+)-([a-zA-Z]+)-(.+)$/;
  const match = pattern.exec(socketId);
  if (match) {
    const [, nodeId, socketType, socketName] = match;
    return {
      nodeId: nodeId as TNodeId,
      socketType: socketType as TSocketType,
      socketName,
    };
  } else {
    throw new Error('Invalid socketId format');
  }
};

export const loadGraph = (urlParams: URLSearchParams) => {
  const loadURL = urlParams.get(URL_PARAMETER_NAME.LOADURL);
  const localGraphID = urlParams.get(URL_PARAMETER_NAME.LOADLOCAL);
  const createEmptyGraph = urlParams.get(URL_PARAMETER_NAME.NEW);
  const fetchFromLocalServer = urlParams.get(
    URL_PARAMETER_NAME.FETCHLOCALGRAPH,
  );
  console.log(
    `${URL_PARAMETER_NAME.LOADURL}: ${loadURL}, ${URL_PARAMETER_NAME.LOADLOCAL}: ${localGraphID}, ${URL_PARAMETER_NAME.NEW}: ${createEmptyGraph}`,
  );
  if (loadURL) {
    PPStorage.getInstance().loadGraphFromURL(loadURL);
    removeUrlParameter(URL_PARAMETER_NAME.LOADURL);
  } else if (localGraphID) {
    PPStorage.getInstance().loadGraphFromDB(localGraphID);
  } else if (fetchFromLocalServer) {
    PPStorage.getInstance()
      .getLocallyProvidedGraph(fetchFromLocalServer)
      .then((serializedGraph) => {
        const nameID = hri.random();
        PPGraph.currentGraph.configure(serializedGraph, hri.random(), nameID);
      });
  } else if (!createEmptyGraph) {
    PPStorage.getInstance().loadGraphFromDB();
  }
};

export const sortByDate = (a, b) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

export const parseValueAndAttachWarnings = (
  nodeOrSocket: IWarningHandler,
  dataType: AbstractType,
  data: any,
): any => {
  const { value, warnings } = dataType.parse(data);
  if (warnings.length === 0) {
    nodeOrSocket.setStatus(new PNPSuccess());
  } else {
    warnings.forEach((warning) => {
      nodeOrSocket.setStatus(warning);
    });
  }
  return value;
};

export const calculateDistance = (pointA: PIXI.Point, pointB: PIXI.Point) => {
  const xDist = pointB.x - pointA.x;
  const yDist = pointB.y - pointA.y;
  return Math.sqrt(xDist * xDist + yDist * yDist);
};

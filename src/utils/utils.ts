import React, { useEffect, useState, useRef } from 'react';
import JSON5 from 'json5';
import { Node } from 'slate';
import * as PIXI from 'pixi.js';

import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import {
  NODE_PADDING_TOP,
  NODE_HEADER_HEIGHT,
  SOCKET_TEXTMARGIN_TOP,
  SOCKET_WIDTH,
} from './constants';
import { GraphDatabase } from './indexedDB';

import { PPNodeConstructor } from './interfaces';

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

export function getInfoFromRegisteredNode(
  graph: PPGraph,
  key: string,
  constructor: PPNodeConstructor
): { hasInputs: boolean; name: string; description: string } {
  const node = new constructor(key, graph);
  const hasInputs = node.inputSocketArray.length > 0;
  return { hasInputs, name: node.name, description: node.description };
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

export function getNodeCommentPosX(x: number, width: number): number {
  return x + width + SOCKET_WIDTH;
}

export function getNodeCommentPosY(y: number): number {
  return y + NODE_PADDING_TOP + NODE_HEADER_HEIGHT + SOCKET_TEXTMARGIN_TOP;
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
  // value || 0 makes sure that NaN s are turned into a number to work with
  return Math.min(Math.max(value || 0, lowerLimit || 0), upperLimit || 0);
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

export const convertStringToSlateNodes = (text: string): any => {
  if (text === undefined) {
    return [
      {
        children: [{ text: '' }],
      },
    ];
  }
  return text.split('\n').map((line) => {
    return {
      children: [{ text: line }],
    };
  });
};

export const convertSlateNodesToString = (value: any): string => {
  return value.map((n) => Node.string(n)).join('\n');
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

export const getRemoteGraphsList = async (
  githubBaseURL: string,
  githubBranchName: string
): Promise<string[]> => {
  try {
    const branches = await fetch(
      `${githubBaseURL}/branches/${githubBranchName}`,
      {
        headers: {
          accept: 'application/vnd.github.v3+json',
        },
      }
    );
    const branchesData = await branches.json();
    const sha = branchesData.commit.sha;

    const fileList = await fetch(`${githubBaseURL}/git/trees/${sha}`, {
      headers: {
        accept: 'application/vnd.github.v3+json',
      },
    });
    const fileListData = await fileList.json();
    const files = fileListData.tree;
    const arrayOfFileNames = files.map((file) => file.path);

    return arrayOfFileNames;
  } catch (error) {
    return [];
  }
};

export const getRemoteGraph = async (
  githubBaseURL: string,
  githubBranchName: string,
  fileName: string
): Promise<any> => {
  try {
    const file = await fetch(
      `${githubBaseURL}/contents/${fileName}?ref=${githubBranchName}`,
      {
        headers: {
          accept: 'application/vnd.github.v3.raw',
        },
      }
    );
    const fileData = await file.json();
    return fileData;
  } catch (error) {
    return undefined;
  }
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

export const getLoadedGraphId = async (
  db: GraphDatabase
): Promise<string | undefined> => {
  const loadedGraphIdObject = await db.settings
    .where({
      name: 'loadedGraphId',
    })
    .first();
  const loadedGraphId = loadedGraphIdObject?.value;
  return loadedGraphId;
};

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
      console.error('Write to clipboard of this text failed:', newClip);
    }
  );
};

export const writeDataToClipboard = (data: unknown): void => {
  writeTextToClipboard(JSON.stringify(data, getCircularReplacer(), 2) || '');
};

export const isEventComingFromWithinTextInput = (event: any): boolean => {
  return (
    event.target.dataset.slateEditor !== undefined ||
    event.target.id === 'Input' ||
    event.target.localName === 'input' ||
    event.target.localName === 'textarea' ||
    event.target.className.includes('cm-content') ||
    event.target.className.includes('cm-scroller')
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

export const getSelectionBounds = (selectedNodes: PPNode[]): PIXI.Rectangle => {
  let selectionBounds = new PIXI.Rectangle();
  selectedNodes.forEach((node: PIXI.DisplayObject, index: number) => {
    const tempRect = node.getLocalBounds();
    // move rect to get bounds local to nodeContainer
    tempRect.x += node.transform.position.x;
    tempRect.y += node.transform.position.y;
    if (index === 0) {
      selectionBounds = tempRect;
    }
    selectionBounds.enlarge(tempRect);
  });
  return selectionBounds;
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

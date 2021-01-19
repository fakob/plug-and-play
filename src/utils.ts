import {
  NODE_MARGIN_TOP,
  NODE_OUTLINE_DISTANCE,
  NODE_HEADER_HEIGHT,
  NODE_WIDTH,
  OUTPUTSOCKET_TEXTMARGIN_TOP,
  OUTPUTSOCKET_WIDTH,
} from './constants';

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

export function getElement(value: number | number[], index: number): number {
  let array: number[] = [];
  if (Array.isArray(value)) {
    array = value;
  } else {
    array.push(value);
  }
  return index < array.length ? array[index] : array[array.length - 1];
}

export function getNodeCommentPosX(x: number): number {
  return x + NODE_OUTLINE_DISTANCE * 2 + NODE_WIDTH + OUTPUTSOCKET_WIDTH;
}

export function getNodeCommentPosY(y: number): number {
  return (
    y +
    NODE_MARGIN_TOP +
    NODE_HEADER_HEIGHT +
    NODE_OUTLINE_DISTANCE +
    OUTPUTSOCKET_TEXTMARGIN_TOP
  );
}

import { INPUTTYPE, OUTPUTTYPE } from '../constants';
import PPGraph from '../GraphClass';
import * as base from './base';
import * as math from './math';

console.log(math);
// console.log(import.meta);

export const registerAllNodeTypes = (graph: PPGraph): void => {
  const categories = { base, math };
  for (const [categoryKey, categoryValue] of Object.entries(categories)) {
    console.log(categoryValue);
    for (const key of Object.keys(categoryValue)) {
      // register nodes using the 'as ...' name when importing
      // e.g. * as base -> node types will be base/baseClass.type
      graph.registerNodeType(`${categoryKey}/${key}`, categoryValue[key]);
    }
  }

  // add additional nodes from functions
  function multiply(a, b) {
    return a * b;
  }
  graph.wrapFunctionAsNode(
    'math/Multiply',
    multiply,
    [INPUTTYPE.NUMBER, INPUTTYPE.NUMBER],
    OUTPUTTYPE.NUMBER
  );

  function getElementFromArray(array: any[], index: number) {
    if (Array.isArray(array) && !Number.isNaN(index)) {
      if (index >= 0 && index < array.length) {
        return array[index];
      }
    }
    return undefined;
  }
  graph.wrapFunctionAsNode(
    'base/GetElementFromArray',
    getElementFromArray,
    [INPUTTYPE.ARRAY, INPUTTYPE.NUMBER]
    // OUTPUTTYPE.NUMBER
  );
};

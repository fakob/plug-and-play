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

  function multiply(a, b) {
    return a * b;
  }

  graph.wrapFunctionAsNode(
    'math/multiply',
    multiply,
    [INPUTTYPE.NUMBER, INPUTTYPE.NUMBER],
    OUTPUTTYPE.NUMBER
  );
};

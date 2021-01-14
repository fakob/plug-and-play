import { INPUTTYPE, OUTPUTTYPE } from '../constants';
// import { isFunction, isClass } from '../utils';
import PPGraph from '../GraphClass';
import PPNode from '../NodeClass';
import * as base from './base';
import * as math from './math';

console.log(math);

export const registerAllNodeTypes = (graph: PPGraph): void => {
  const categories = { base, math };
  for (const [categoryKey, categoryValue] of Object.entries(categories)) {
    console.log(categoryKey, categoryValue);
    for (const key of Object.keys(categoryValue)) {
      // check if it is a class inheriting from PPNode
      // if not we consider it a function
      // functions which are imported like this can not define input and output parameter types
      if (categoryValue[key].prototype instanceof PPNode) {
        graph.registerNodeType(`${key}`, categoryValue[key]);
      } else {
        graph.wrapFunctionAsNode(categoryValue[key]);
      }
    }
  }

  function getElementFromArray(array: any[], index: number) {
    if (Array.isArray(array) && !Number.isNaN(index)) {
      if (index >= 0 && index < array.length) {
        return array[index];
      }
    }
    return undefined;
  }
  graph.wrapFunctionAsNode(
    getElementFromArray,
    [INPUTTYPE.ARRAY, INPUTTYPE.NUMBER]
    // OUTPUTTYPE.NUMBER
  );
};

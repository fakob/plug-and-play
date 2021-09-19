import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import * as base from './base';
import * as draw from './draw';
import * as math from './math';
import * as text from './text';
import * as shader from './image/shader';
import * as image from './image/image';
import * as get from './api/get';
import * as array from './data/array';
import * as json from './data/json';

export const registerAllNodeTypes = (graph: PPGraph): void => {
  const categories = {
    base,
    math,
    draw,
    text,
    shader,
    image,
    get,
    array,
    json,
  };
  for (const [categoryKey, categoryValue] of Object.entries(categories)) {
    console.log(categoryKey, categoryValue);
    for (const key of Object.keys(categoryValue)) {
      // check if it is a class inheriting from PPNode
      // if not we consider it a function
      // functions which are imported like this can not define input and output parameter types
      if (categoryValue[key].prototype instanceof PPNode) {
        graph.registerNodeType(key, categoryValue[key]);
      } else {
        const nodeConstructor = graph.convertFunctionToNodeConstructor(
          categoryValue[key]
        );
        graph.registerNodeType(key, nodeConstructor);
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
  const nodeConstructor = graph.convertFunctionToNodeConstructor(
    getElementFromArray
    // OUTPUTTYPE.NUMBER
  );
  graph.registerNodeType(getElementFromArray.name, nodeConstructor);
};

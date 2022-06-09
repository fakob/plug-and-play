import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import * as base from './base';
import * as draw from './draw/draw';
import * as table from './table';
import * as math from './math';
import * as text from './text';
import * as logViewer from './logViewer';
import * as shader from './image/shader';
import * as image from './image/image';
import * as get from './api/get';
import * as array from './data/array';
import * as json from './data/json';
import * as pixotopegateway from './api/pixotopeGateway';
import * as dataFunctions from './data/dataFunctions';
import * as stateNodes from './state/stateNodes';
import * as charts from './draw/charts';
import * as macro from './macro/macro';
import * as booleanlogic from './logic/boolean';

export const registerAllNodeTypes = (graph: PPGraph): void => {
  const categories = {
    base,
    math,
    draw,
    table,
    text,
    logViewer,
    shader,
    image,
    get,
    array,
    json,
    pixotopegateway,
    dataFunctions,
    stateNodes,
    charts,
    macro,
    booleanlogic,
  };
  for (const [categoryKey, categoryValue] of Object.entries(categories)) {
    console.log(categoryKey, categoryValue);
    for (const key of Object.keys(categoryValue)) {
      if (categoryValue[key].prototype instanceof PPNode) {
        graph.registerNodeType(key, categoryValue[key]);
      }
    }
  }
};

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
import * as widgetNodes from './widgets/widgetNodes';
import * as charts from './draw/charts';
import * as macro from './macro/macro';
import * as booleanlogic from './logic/boolean';
import { RegisteredNodeTypes } from '../utils/interfaces';
import { getInfoFromRegisteredNode } from '../utils/utils';

export const getAllNodeTypes = (graph: PPGraph): RegisteredNodeTypes => {
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
    widgetNodes,
    charts,
    macro,
    booleanlogic,
  };
  const toReturn: RegisteredNodeTypes = {};
  for (const [categoryKey, categoryValue] of Object.entries(categories)) {
    Object.keys(categoryValue)
      .filter((key) => categoryValue[key].prototype instanceof PPNode)
      .forEach((key) => {
        const nodeInfo = getInfoFromRegisteredNode(
          graph,
          key,
          categoryValue[key]
        );
        toReturn[key] = {
          constructor: categoryValue[key].constructor,
          name: nodeInfo.name,
          description: nodeInfo.description,
          hasInputs: nodeInfo.hasInputs,
        };
      });
  }
  return toReturn;
};

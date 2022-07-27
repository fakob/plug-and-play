import PPNode from '../classes/NodeClass';
import * as base from './base';
import * as draw from './draw/draw';
import * as table from './table';
import * as codeEditor from './codeEditor';
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
import * as utility from './utility/utility';
import { getInfoFromRegisteredNode } from '../utils/utils';
import { RegisteredNodeTypes } from '../utils/interfaces';

let allNodesCached = undefined;

export const getAllNodeTypes = (): RegisteredNodeTypes => {
  if (!allNodesCached) {
    const categories = {
      base,
      math,
      draw,
      table,
      codeEditor,
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
      utility,
    };
    const toReturn = {};
    for (const [categoryKey, categoryValue] of Object.entries(categories)) {
      console.log(categoryKey, categoryValue);
      for (const key of Object.keys(categoryValue)) {
        const nodeConstructor = categoryValue[key];
        if (nodeConstructor.prototype instanceof PPNode) {
          const nodeInfo = getInfoFromRegisteredNode(key, nodeConstructor);
          toReturn[key] = {
            constructor: nodeConstructor,
            name: nodeInfo.name,
            description: nodeInfo.description,
            hasInputs: nodeInfo.hasInputs,
          };
        }
      }
    }
    allNodesCached = toReturn;
  }
  return allNodesCached;
};

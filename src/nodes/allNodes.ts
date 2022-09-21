import PPNode from '../classes/NodeClass';
import * as array from './data/array';
import * as base from './base';
import * as booleanlogic from './logic/boolean';
import * as charts from './draw/charts';
import * as codeEditor from './codeEditor';
import * as dataFunctions from './data/dataFunctions';
import * as draw from './draw/draw';
import * as get from './api/get';
import * as image from './image/image';
import * as json from './data/json';
import * as logViewer from './logViewer';
import * as macro from './macro/macro';
import * as math from './math';
import * as pixotopegateway from './api/pixotopeGateway';
import * as shader from './image/shader';
import * as stateNodes from './state/stateNodes';
import * as table from './table';
import * as text from './text';
import * as textEditor from './textEditor/textEditor';
import * as utility from './utility/utility';
import * as widgetNodes from './widgets/widgetNodes';
import { getInfoFromRegisteredNode } from '../utils/utils';
import { RegisteredNodeTypes } from '../utils/interfaces';

let allNodesCached = undefined;

export const getAllNodeTypes = (): RegisteredNodeTypes => {
  if (!allNodesCached) {
    const categories = {
      array,
      base,
      booleanlogic,
      charts,
      codeEditor,
      dataFunctions,
      draw,
      get,
      image,
      json,
      logViewer,
      macro,
      math,
      pixotopegateway,
      shader,
      stateNodes,
      table,
      text,
      textEditor,
      utility,
      widgetNodes,
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

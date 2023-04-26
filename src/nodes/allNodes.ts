import PPNode from '../classes/NodeClass';
import * as array from './data/array';
import * as base from './base';
import * as booleanlogic from './logic/boolean';
import * as browser from './utility/browser';
import * as charts from './draw/graph/lineGraph';
import * as codeEditor from './codeEditor';
import * as dataFunctions from './data/dataFunctions';
import * as draw from './draw/draw';
import * as get from './api/http';
import * as html from './draw/html';
import * as image from './image/image';
import * as json from './data/json';
import * as logViewer from './logViewer';
import * as macro from './macro/macro';
import * as math from './math';
import * as playground from './utility/playground';
import * as pixotopegateway from './api/pixotopeGateway';
import * as shader from './image/shader';
import * as stateNodes from './state/stateNodes';
import * as table from './table/table';
import * as tableHelpers from './table/tableHelpers';
import * as test from './data/test';
import * as text from './text';
import * as textEditor from './textEditor/textEditor';
import * as utility from './utility/utility';
import * as widgetNodes from './widgets/widgetNodes';
import * as recordNodes from './interactivity/record';
import { RegisteredNodeTypes } from '../utils/interfaces';
import * as simpleBarChart from './graphSegments/simpleBarGraph';

let allNodesCached = undefined;

export const getAllNodeTypes = (): RegisteredNodeTypes => {
  if (!allNodesCached) {
    const categories = {
      array,
      base,
      booleanlogic,
      browser,
      charts,
      codeEditor,
      dataFunctions,
      draw,
      get,
      html,
      image,
      json,
      logViewer,
      macro,
      math,
      playground,
      pixotopegateway,
      shader,
      stateNodes,
      table,
      tableHelpers,
      test,
      text,
      textEditor,
      utility,
      widgetNodes,
      recordNodes,
      simpleBarChart,
    };
    const toReturn = {};
    for (const [categoryKey, categoryValue] of Object.entries(categories)) {
      console.log(categoryKey, categoryValue);
      for (const key of Object.keys(categoryValue)) {
        const nodeConstructor = categoryValue[key];
        if (nodeConstructor.prototype instanceof PPNode) {
          const node: PPNode = new nodeConstructor(key);
          const hasInputs = node.inputSocketArray.length > 0;

          toReturn[key] = {
            constructor: nodeConstructor,
            name: node.getName(),
            description: node.getDescription(),
            hasInputs: hasInputs,
          };
        }
      }
    }
    allNodesCached = toReturn;
  }
  return allNodesCached;
};

export const getAllNodesInDetail = (): any[] => {
  const categories = {
    array,
    base,
    booleanlogic,
    browser,
    charts,
    codeEditor,
    dataFunctions,
    draw,
    get,
    html,
    image,
    json,
    logViewer,
    macro,
    math,
    playground,
    pixotopegateway,
    shader,
    stateNodes,
    table,
    tableHelpers,
    test,
    text,
    textEditor,
    utility,
    widgetNodes,
    recordNodes,
    simpleBarChart,
  };
  const toReturn = [];
  for (const [categoryKey, categoryValue] of Object.entries(categories)) {
    console.log(categoryKey, categoryValue);
    for (const key of Object.keys(categoryValue)) {
      const nodeConstructor = categoryValue[key];
      if (nodeConstructor.prototype instanceof PPNode) {
        const node: PPNode = new nodeConstructor(key);
        const inputSockets = node.getAllInputSockets().map((socket) => {
          return socket.dataType.getName();
        });
        const outputSockets = node.outputSocketArray.map((socket) => {
          return socket.dataType.getName();
        });

        const updateBehaviour = [
          node.updateBehaviour.update,
          node.updateBehaviour.interval,
          node.updateBehaviour.intervalFrequency,
        ];

        toReturn.push({
          name: node.getName(),
          description: node.getDescription(),
          tags: node.getTags(),
          inputCount: node.getAllInputSockets().length,
          inputSockets: inputSockets.join(),
          outputCount: node.outputSocketArray.length,
          outputSockets: outputSockets.join(),
          // minNodeWith: node.getMinNodeWidth(),
          // minNodeHeight: node.getMinNodeHeight(),
          updateBehaviour: updateBehaviour.join(),
          // sourceCode: node.getSourceCode(),
        });
      }
    }
  }
  return toReturn.sort((a, b) => a.name.localeCompare(b.name));
};

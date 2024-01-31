import PPNode from '../classes/NodeClass';
import * as array from './data/array';
import * as base from './base';
import * as booleanlogic from './logic/boolean';
import * as browser from './utility/browser';
import * as codeEditor from './codeEditor';
import * as database from './utility/database';
import * as dataFunctions from './data/dataFunctions';
import * as draw from './draw/draw';
import * as html from './draw/html';
import * as video from './draw/video';
import * as lineCharts from './draw/graph/lineGraph';
import * as pieCharts from './draw/graph/pieGraph';
import * as draw_meta from './draw/drawMeta';
import * as get from './api/http';
import * as image from './image/image';
import * as json from './data/json';
import * as xml from './data/xml';
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
import * as jira from './api/jira';
import * as chatgpt from './api/chatgpt';
import * as twitter from './api/twitter';

let allNodesCached = undefined;
let allNodesFormatted = undefined;

// TODO get rid of copy pasting here

export const getAllNodeTypes = (): RegisteredNodeTypes => {
  if (!allNodesCached) {
    const categories = {
      array,
      base,
      booleanlogic,
      browser,
      charts: lineCharts,
      pieCharts,
      draw_meta,
      codeEditor,
      database,
      dataFunctions,
      draw,
      get,
      html,
      video,
      image,
      json,
      xml,
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
      jira,
      chatgpt,
      twitter,
    };
    const toReturn = {};
    const start = Date.now();
    for (const [categoryKey, categoryValue] of Object.entries(categories)) {
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
            tags: node.getTags(),
            hasExample: node.hasExample(),
          };
        }
      }
    }
    console.log('time to gather all node info: ' + (Date.now() - start));
    allNodesCached = toReturn;
  }
  return allNodesCached;
};

export const getAllNodesFormattedForInterface = (): any[] => {
  if (allNodesFormatted == undefined) {
    allNodesFormatted = Object.entries(getAllNodeTypes())
      .map(([title, obj]) => {
        return {
          title,
          name: obj.name,
          key: title,
          description: obj.description,
          hasInputs: obj.hasInputs,
          tags: obj.tags,
          hasExample: obj.hasExample,
          group: obj.tags[0],
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
      )
      .sort(
        (a, b) =>
          a.group?.localeCompare(b.group, 'en', {
            sensitivity: 'base',
          }),
      );
  }
  return allNodesFormatted;
};

export const getAllNodesInDetail = (): any[] => {
  const categories = {
    array,
    base,
    booleanlogic,
    browser,
    charts: lineCharts,
    pieCharts,
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
  };
  const start = Date.now();
  const toReturn = [];
  for (const [categoryKey, categoryValue] of Object.entries(categories)) {
    for (const key of Object.keys(categoryValue)) {
      const nodeConstructor = categoryValue[key];
      if (nodeConstructor.prototype instanceof PPNode) {
        const node: PPNode = new nodeConstructor(key);
        const inputSockets = node.getAllInputSockets().map((socket) => {
          return `${socket.name}:${socket.dataType.getName()}`;
        });
        const outputSockets = node.outputSocketArray.map((socket) => {
          return `${socket.name}: ${socket.dataType.getName()}`;
        });

        const updateBehaviour = [
          node.updateBehaviour.load,
          node.updateBehaviour.update,
          node.updateBehaviour.interval,
          node.updateBehaviour.intervalFrequency,
        ];

        toReturn.push({
          key: key,
          name: node.getName(),
          description: node.getDescription(),
          description2: node.getAdditionalDescription(),
          tags: node.getTags().join(),
          hasExample: node.hasExample(),
          updateBehaviour: updateBehaviour.join(),
          inputCount: node.getAllInputSockets().length,
          inputSockets: inputSockets.join(),
          outputCount: node.outputSocketArray.length,
          outputSockets: outputSockets.join(),
        });
      }
    }
  }
  console.log('time to gather all node info detail: ' + (Date.now() - start));
  return toReturn.sort((a, b) => a.name.localeCompare(b.name));
};

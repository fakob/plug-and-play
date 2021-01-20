import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import React from 'react';
import ReactDOM from 'react-dom';
import * as dat from 'dat.gui';
import {
  CANVAS_BACKGROUNDCOLOR_HEX,
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
} from './constants';
import PPGraph from './GraphClass';
import { registerAllNodeTypes } from './nodes/allNodes';
import ReactContainer from './ReactContainer';
import { GraphDatabase } from './indexeddb';
// import PixelGrid from '../assets/Pixel_grid_4000x2000.svg.png';

import './style.css';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

const gui = new dat.GUI();
// gui
const data = {
  showComments: true,
  run: false,
  runStep: function () {
    currentGraph.runStep();
  },
  saveGraph: function () {
    serializeGraph();
  },
  loadGraph: function () {
    loadCurrentGraph();
  },
  duplicateSelction: function () {
    currentGraph.duplicateSelection();
  },
  addNode: '',
  showEditor: true,
};

const db = new GraphDatabase();

const gameWidth = 800;
const gameHeight = 600;

// (window as any).classes = {};
// (window as any).classes.PPNode = PPNode;

const defaultEditorData = `// Ctrl-Enter to create node
function square(a) {
  return a * a;
}`;

let reactRoot;
let editorData: string;
let currentGraph: PPGraph;

const app = new PIXI.Application({
  backgroundColor: CANVAS_BACKGROUNDCOLOR_HEX,
  width: gameWidth,
  height: gameHeight,
  antialias: true,
  autoDensity: true,
  resolution: 2,
});

// create viewport
const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: window.innerWidth,
  worldHeight: window.innerHeight,
  interaction: app.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
});

console.log(viewport);
console.log(window.devicePixelRatio);
// add the viewport to the stage
app.stage.addChild(viewport);

viewport
  .drag()
  .pinch()
  .wheel()
  .decelerate({
    friction: 0.8,
  })
  .clampZoom({
    minScale: 0.05,
    maxScale: 4,
  });

window.onload = async (): Promise<void> => {
  document.body.appendChild(app.view);
  window.addEventListener('keydown', keysDown);

  resizeCanvas();
  setupGrid();
  setupReactContainer();

  loadCurrentGraph();
};

function createOrUpdateNodeFromCode(code) {
  currentGraph.createOrUpdateNodeFromCode(code);
  editorData = code;
}

function serializeGraph() {
  const serializedGraph = currentGraph.serialize();
  console.log(serializedGraph);
  console.info(serializedGraph.customNodeTypes);
  // console.log(JSON.stringify(serializedGraph));
  db.transaction('rw', db.currentGraph, async () => {
    const id = await db.currentGraph.put({
      id: 0,
      date: new Date(),
      graphData: serializedGraph,
      editorData,
    });
    console.log(`Saved currentGraph: ${id}`);
  }).catch((e) => {
    console.log(e.stack || e);
  });
}

function loadCurrentGraph() {
  db.transaction('rw', db.currentGraph, async () => {
    const lastGraph = await db.currentGraph.where({ id: 0 }).toArray();
    if (lastGraph.length > 0) {
      // load editorData
      editorData = lastGraph[0].editorData;

      // configure graph
      const graphData = lastGraph[0].graphData;
      currentGraph.configure(graphData, false);

      console.log(currentGraph.nodeContainer.children);
    } else {
      console.log('No saved graphData');
    }
  }).catch((e) => {
    console.log(e.stack || e);
  });
}

function setupReactContainer(): void {
  reactRoot = document.createElement('div');
  const child = document.body.appendChild(reactRoot);
  child.className = 'rootClass';
  child.id = 'container';
  ReactDOM.render(
    <ReactContainer
      value={editorData || defaultEditorData}
      onSave={createOrUpdateNodeFromCode}
    />,
    reactRoot
  );

  // callbacks
  currentGraph.onSelectionChange = (selectedNodes: string[]) => {
    console.log(selectedNodes);
    let codeString = '';
    selectedNodes.forEach((nodeId) => {
      const selectedNode = currentGraph.nodes.find(
        (node) => node.id === nodeId
      );
      console.log(selectedNode);
      const selectedNodeType = selectedNode.type;
      codeString = currentGraph.customNodeTypes[selectedNodeType];
      // if (codeString) {
      console.log(codeString);
      editorData = codeString;
      // }
    });
    ReactDOM.render(
      <ReactContainer value={codeString} onSave={createOrUpdateNodeFromCode} />,
      reactRoot
    );
  };
}

function resizeCanvas(): void {
  const resize = () => {
    viewport.resize(window.innerWidth, window.innerHeight);
    app.renderer.resize(window.innerWidth, window.innerHeight);
  };

  resize();

  window.addEventListener('resize', resize);
}

function keysDown(e: KeyboardEvent): void {
  console.log(e.key);
  //delete or backspace
  if (e.key === 'Backspace' || e.key === 'Delete') {
    currentGraph.deleteSelectedNodes();
  }
}

function setupGrid(): void {
  // add background tiles
  const texture = PIXI.Texture.from(CANVAS_BACKGROUND_TEXTURE);
  // const background = PIXI.Sprite.from('https://upload.wikimedia.org/wikipedia/commons/6/63/Pixel_grid_4000x2000.svg');
  const background = new PIXI.TilingSprite(
    texture,
    app.screen.width,
    app.screen.height
  );
  background.tileScale.x = 0.5;
  background.tileScale.y = 0.5;
  viewport.addChild(background);
  viewport.on('moved', () => {
    background.tilePosition.y = -viewport.top;
    background.tilePosition.x = -viewport.left;
    background.y = viewport.top;
    background.x = viewport.left;

    background.width = innerWidth / viewport.scale.x;
    background.height = innerHeight / viewport.scale.y;
  });
  background.alpha = CANVAS_BACKGROUND_ALPHA;

  // add graph
  currentGraph = new PPGraph(app, viewport);

  registerAllNodeTypes(currentGraph);
  const allRegisteredNodeTypeNames = Object.keys(
    currentGraph.registeredNodeTypes
  );

  gui.add(data, 'showEditor').onChange((value) => {
    const element = document.getElementById('container');
    value ? element.classList.remove('hide') : element.classList.add('hide');
  });
  gui.add(data, 'run');
  gui.add(data, 'saveGraph');
  gui.add(data, 'loadGraph');
  gui.add(data, 'duplicateSelction');
  gui.add(data, 'runStep');
  gui.add(data, 'showComments').onChange((value) => {
    console.log(value);
    currentGraph.showComments = value;
  });
  gui.add(data, 'addNode', allRegisteredNodeTypeNames).onChange((selected) => {
    console.log(selected);
    currentGraph.createAndAddNode(selected);
  });

  app.ticker.add(() => {
    if (data.run) {
      currentGraph.runStep();
    }
  });
}

import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import React from 'react';
import ReactDOM from 'react-dom';
import * as dat from 'dat.gui';
import { CANVAS_BACKGROUNDCOLOR_HEX } from './constants';
import PPNode from './NodeClass';
import PPGraph from './GraphClass';
import { registerAllNodeTypes } from './nodes/allNodes';
import ReactContainer from './ReactContainer';
// import PixelGrid from '../assets/Pixel_grid_4000x2000.svg.png';

import './style.css';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

const gui = new dat.GUI();

const gameWidth = 800;
const gameHeight = 600;

(window as any).classes = {};
(window as any).classes.PPNode = PPNode;

let reactRoot;

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

  resizeCanvas();
  setupGrid();
  // setupReactContainer();
  // readFile();
  // document.getElementById('file').addEventListener('change', readFile, false);
};

function readFile() {
  // const files = evt.target.files;
  // const file = files[0];
  const file = new File(
    [''],
    __dirname + __filename
    // '‎⁨/⁨Users⁩/⁨jakobschindegger⁩/⁨Documents⁩/⁨Development⁩/⁨fakob⁩/⁨plug-and-play⁩/⁨src⁩/⁨nodes⁩/base.ts'
  );
  console.log(__dirname);
  console.log(__filename);
  console.log(file);
  const reader = new FileReader();
  reader.onload = function (event) {
    console.log(event.target);
    console.log(event.target.result);
    const result = event.target.result as string;
    ReactDOM.render(<ReactContainer value={result} />, reactRoot);
  };
  reader.readAsText(file);
}

function setupReactContainer(): void {
  reactRoot = document.createElement('div');
  const child = document.body.appendChild(reactRoot);
  child.className = 'rootClass';
  child.id = 'container';
  ReactDOM.render(<ReactContainer value="const test = 3;" />, reactRoot);
}

function resizeCanvas(): void {
  const resize = () => {
    viewport.resize(window.innerWidth, window.innerHeight);
    app.renderer.resize(window.innerWidth, window.innerHeight);
  };

  resize();

  window.addEventListener('resize', resize);
}

function setupGrid(): void {
  // add background tiles
  const texture = PIXI.Texture.from('../assets/Pixel_grid_4000x2000.svg.png');
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
  background.alpha = 0.1;

  // add graph
  const graph = new PPGraph(app, viewport);

  registerAllNodeTypes(graph);
  const allRegisteredNodeTypeNames = Object.keys(graph.registeredNodeTypes);

  // gui
  const data = {
    run: false,
    runStep: function () {
      graph.runStep();
    },
    addNode: '',
  };

  gui.add(data, 'run');
  gui.add(data, 'runStep');
  gui.add(data, 'addNode', allRegisteredNodeTypeNames).onChange((selected) => {
    console.log(selected);
    graph.createAndAdd(selected);
  });

  app.ticker.add(() => {
    if (data.run) {
      graph.runStep();
    }
  });
}

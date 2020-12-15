import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import * as dat from 'dat.gui';
import { CANVAS_BACKGROUNDCOLOR_HEX } from './constants';
import PPGraph from './GraphClass';
import { MathAdd, MathNoise } from './nodes/math';
import { DrawRect, RangeArray, TimeAndDate } from './nodes/base';
// import PixelGrid from '../assets/Pixel_grid_4000x2000.svg.png';

import './style.css';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

const gui = new dat.GUI();

const gameWidth = 800;
const gameHeight = 600;

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
};

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

  graph.registerNodeType('math/add', MathAdd);
  graph.registerNodeType('math/noise', MathNoise);
  graph.registerNodeType('base/timeAndDate', TimeAndDate);
  graph.registerNodeType('base/rect', DrawRect);
  graph.registerNodeType('base/rangeArray', RangeArray);

  // gui
  const data = {
    run: false,
    amount: 24,
    columnCount: 4,
    margin: 20,
    width: 400,
    height: 400,
    color: '#FF0000',
    // addInput: function () {
    //   console.log(viewport.children[0]);
    //   console.log(nodeArray[0].addInput('New', 'string'));
    // },
    addMathAddNode: function () {
      graph.createAndAdd('math/add');
    },
    addRectNode: function () {
      graph.createAndAdd('base/rect');
    },
    addRangeArrayNode: function () {
      graph.createAndAdd('base/rangeArray');
    },
    addMathNoiseNode: function () {
      graph.createAndAdd('math/noise');
    },
    addTimeDate: function () {
      graph.createAndAdd('base/timeAndDate');
    },
    runStep: function () {
      graph.runStep();
    },
    // addNode: function () {
    //   const myAddNode = new PPNode(myAddNode, graph);
    //   graph.add(myAddNode);
    // },
    // addWatchNode: function () {
    //   const myWatchNode = new PPNode(watchNode, graph);
    //   graph.add(myWatchNode);
    // },
  };

  gui.addColor(data, 'color').onChange(() => {
    updateGrid();
  });
  gui.add(data, 'run');
  gui.add(data, 'amount', 1, 100, 1).onChange(() => {
    setupGrid();
  });
  gui.add(data, 'columnCount', 1, 20, 1).onChange(() => {
    updateGrid();
  });
  gui.add(data, 'margin', 0, 100, 1).onChange(() => {
    updateGrid();
  });
  gui.add(data, 'width', 0, 400, 1).onChange(() => {
    updateGrid();
  });
  gui.add(data, 'height', 0, 400, 1).onChange(() => {
    updateGrid();
  });
  gui.add(data, 'runStep');
  // gui.add(data, 'addInput');
  gui.add(data, 'addMathAddNode');
  gui.add(data, 'addRectNode');
  gui.add(data, 'addRangeArrayNode');
  gui.add(data, 'addMathNoiseNode');
  gui.add(data, 'addTimeDate');
  // gui.add(data, 'addAddNode');
  // gui.add(data, 'addWatchNode');

  app.ticker.add(() => {
    if (data.run) {
      graph.runStep();
    }
  });
}

function updateGrid(): void {
  console.log('viewport');
}

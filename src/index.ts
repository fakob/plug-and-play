import * as PIXI from 'pixi.js';
import ThumbContainer from './ThumbContainer';
import NodeClass from './NodeClass';
import { getGridPositionArray } from './utils-pixi';
import { Viewport } from 'pixi-viewport';
import * as dat from 'dat.gui';

import './style.css';

const gui = new dat.GUI();

const data = {
  amount: 24,
  columnCount: 4,
  margin: 20,
  width: 400,
  height: 400,
  color: '#FF0000',
};

gui.addColor(data, 'color').onChange(() => {
  updateGrid();
});
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

const gameWidth = 800;
const gameHeight = 600;
let emptyThumbArray;

const app = new PIXI.Application({
  backgroundColor: 0xd3d3d3,
  width: gameWidth,
  height: gameHeight,
  antialias: true,
});

// const stage = app.stage;

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

// activate plugins
// viewport.on('clicked', () => {
//   console.log('clicked');
//   // viewport.fitWorld();
//   viewport.fit();
//   viewport.moveCenter(viewport.screenWidth / 2, viewport.screenHeight / 2);
// });
// viewport.on("zoomed", zoomed);
// viewport.on("zoomed-end", zoomedEnd);

viewport
  .drag()
  .pinch()
  .wheel()
  // .clamp({ direction: 'all' })
  // .clampZoom({ minScale: 0.5, maxScale: 1 })
  .decelerate({
    friction: 0.8,
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
    // app.stage.scale.x = window.innerWidth / gameWidth;
    // app.stage.scale.y = window.innerHeight / gameHeight;
  };

  resize();

  window.addEventListener('resize', resize);
}

function setupGrid(): void {
  // clear the stage
  viewport.removeChildren();

  const ppNode = new NodeClass({
    name: 'First Node',
    type: 'testNode',
    inputs: [
      {
        name: 'Input 1',
        type: 'number',
      },
      {
        name: 'Input 2',
        type: 'number',
      },
    ],
  });

  viewport.addChild(ppNode);
}

function updateGrid(): void {
  console.log('viewport');
}

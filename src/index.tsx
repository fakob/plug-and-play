import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import React from 'react';
import ReactDOM from 'react-dom';
import * as monaco from 'monaco-editor';
import toJsonSchema from 'to-json-schema';
import * as dat from 'dat.gui';
import { CANVAS_BACKGROUNDCOLOR_HEX } from './constants';
import PPGraph from './GraphClass';
import { MathAdd, MathNoise } from './nodes/math';
import {
  DrawRect,
  MakeAPICall,
  RangeArray,
  TimeAndDate,
  Trigger,
} from './nodes/base';
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

  const root = document.createElement('div');
  const child = document.body.appendChild(root);
  child.className = 'rootClass';
  child.id = 'container';
  const element = <h1>Hello, world</h1>;
  const objToBeConverted = [
    {
      id: 1,
      name: 'Leanne Graham',
      username: 'Bret',
      email: 'Sincere@april.biz',
      address: {
        street: 'Kulas Light',
        suite: 'Apt. 556',
        city: 'Gwenborough',
        zipcode: '92998-3874',
        geo: {
          lat: '-37.3159',
          lng: '81.1496',
        },
      },
      phone: '1-770-736-8031 x56442',
      website: 'hildegard.org',
      company: {
        name: 'Romaguera-Crona',
        catchPhrase: 'Multi-layered client-server neural-net',
        bs: 'harness real-time e-markets',
      },
    },
    {
      id: 2,
      name: 'Ervin Howell',
      username: 'Antonette',
      email: 'Shanna@melissa.tv',
      address: {
        street: 'Victor Plains',
        suite: 'Suite 879',
        city: 'Wisokyburgh',
        zipcode: '90566-7771',
        geo: {
          lat: '-43.9509',
          lng: '-34.4618',
        },
      },
      phone: '010-692-6593 x09125',
      website: 'anastasia.net',
      company: {
        name: 'Deckow-Crist',
        catchPhrase: 'Proactive didactic contingency',
        bs: 'synergize scalable supply-chains',
      },
    },
    {
      id: 3,
      name: 'Clementine Bauch',
      username: 'Samantha',
      email: 'Nathan@yesenia.net',
      address: {
        street: 'Douglas Extension',
        suite: 'Suite 847',
        city: 'McKenziehaven',
        zipcode: '59590-4157',
        geo: {
          lat: '-68.6102',
          lng: '-47.0653',
        },
      },
      phone: '1-463-123-4447',
      website: 'ramiro.info',
      company: {
        name: 'Romaguera-Jacobson',
        catchPhrase: 'Face to face bifurcated interface',
        bs: 'e-enable strategic applications',
      },
    },
    {
      id: 4,
      name: 'Patricia Lebsack',
      username: 'Karianne',
      email: 'Julianne.OConner@kory.org',
      address: {
        street: 'Hoeger Mall',
        suite: 'Apt. 692',
        city: 'South Elvis',
        zipcode: '53919-4257',
        geo: {
          lat: '29.4572',
          lng: '-164.2990',
        },
      },
      phone: '493-170-9623 x156',
      website: 'kale.biz',
      company: {
        name: 'Robel-Corkery',
        catchPhrase: 'Multi-tiered zero tolerance productivity',
        bs: 'transition cutting-edge web services',
      },
    },
    {
      id: 5,
      name: 'Chelsey Dietrich',
      username: 'Kamren',
      email: 'Lucio_Hettinger@annie.ca',
      address: {
        street: 'Skiles Walks',
        suite: 'Suite 351',
        city: 'Roscoeview',
        zipcode: '33263',
        geo: {
          lat: '-31.8129',
          lng: '62.5342',
        },
      },
      phone: '(254)954-1289',
      website: 'demarco.info',
      company: {
        name: 'Keebler LLC',
        catchPhrase: 'User-centric fault-tolerant solution',
        bs: 'revolutionize end-to-end systems',
      },
    },
    {
      id: 6,
      name: 'Mrs. Dennis Schulist',
      username: 'Leopoldo_Corkery',
      email: 'Karley_Dach@jasper.info',
      address: {
        street: 'Norberto Crossing',
        suite: 'Apt. 950',
        city: 'South Christy',
        zipcode: '23505-1337',
        geo: {
          lat: '-71.4197',
          lng: '71.7478',
        },
      },
      phone: '1-477-935-8478 x6430',
      website: 'ola.org',
      company: {
        name: 'Considine-Lockman',
        catchPhrase: 'Synchronised bottom-line interface',
        bs: 'e-enable innovative applications',
      },
    },
    {
      id: 7,
      name: 'Kurtis Weissnat',
      username: 'Elwyn.Skiles',
      email: 'Telly.Hoeger@billy.biz',
      address: {
        street: 'Rex Trail',
        suite: 'Suite 280',
        city: 'Howemouth',
        zipcode: '58804-1099',
        geo: {
          lat: '24.8918',
          lng: '21.8984',
        },
      },
      phone: '210.067.6132',
      website: 'elvis.io',
      company: {
        name: 'Johns Group',
        catchPhrase: 'Configurable multimedia task-force',
        bs: 'generate enterprise e-tailers',
      },
    },
    {
      id: 8,
      name: 'Nicholas Runolfsdottir V',
      username: 'Maxime_Nienow',
      email: 'Sherwood@rosamond.me',
      address: {
        street: 'Ellsworth Summit',
        suite: 'Suite 729',
        city: 'Aliyaview',
        zipcode: '45169',
        geo: {
          lat: '-14.3990',
          lng: '-120.7677',
        },
      },
      phone: '586.493.6943 x140',
      website: 'jacynthe.com',
      company: {
        name: 'Abernathy Group',
        catchPhrase: 'Implemented secondary concept',
        bs: 'e-enable extensible e-tailers',
      },
    },
    {
      id: 9,
      name: 'Glenna Reichert',
      username: 'Delphine',
      email: 'Chaim_McDermott@dana.io',
      address: {
        street: 'Dayna Park',
        suite: 'Suite 449',
        city: 'Bartholomebury',
        zipcode: '76495-3109',
        geo: {
          lat: '24.6463',
          lng: '-168.8889',
        },
      },
      phone: '(775)976-6794 x41206',
      website: 'conrad.com',
      company: {
        name: 'Yost and Sons',
        catchPhrase: 'Switchable contextually-based project',
        bs: 'aggregate real-time technologies',
      },
    },
    {
      id: 10,
      name: 'Clementina DuBuque',
      username: 'Moriah.Stanton',
      email: 'Rey.Padberg@karina.biz',
      address: {
        street: 'Kattie Turnpike',
        suite: 'Suite 198',
        city: 'Lebsackbury',
        zipcode: '31428-2261',
        geo: {
          lat: '-38.2386',
          lng: '57.2232',
        },
      },
      phone: '024-648-3804',
      website: 'ambrose.net',
      company: {
        name: 'Hoeger LLC',
        catchPhrase: 'Centralized empowering task-force',
        bs: 'target end-to-end models',
      },
    },
  ];
  ReactDOM.render(element, root);
  // const schema = toJsonSchema(objToBeConverted);
  // console.log(schema);
  monaco.editor.create(document.getElementById('container'), {
    value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
    language: 'javascript',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    theme: 'vs-dark',
  });
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
  graph.registerNodeType('base/makeAPICall', MakeAPICall);
  graph.registerNodeType('base/trigger', Trigger);

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
    addTrigger: function () {
      graph.createAndAdd('base/trigger');
    },
    addMakeAPICall: function () {
      graph.createAndAdd('base/makeAPICall');
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
  gui.add(data, 'addTrigger');
  gui.add(data, 'addMakeAPICall');
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

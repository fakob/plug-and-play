import React, { useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import ReactContainer from './ReactContainer';
import PixiContainer from './PixiContainer';
import * as dat from 'dat.gui';
import { GraphDatabase } from './indexeddb';
import PPGraph from './GraphClass';
import {
  CANVAS_BACKGROUNDCOLOR_HEX,
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
  DEFAULT_EDITOR_DATA,
} from './constants';
import { registerAllNodeTypes } from './nodes/allNodes';
import styles from './style.module.css';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

const App = (): JSX.Element => {
  let pixiApp: PIXI.Application;
  let currentGraph: PPGraph;

  const db = new GraphDatabase();
  const pixiContext = useRef<HTMLDivElement | null>(null);
  const [editorData, setEditorData] = React.useState(DEFAULT_EDITOR_DATA);

  // on mount
  useEffect(() => {
    console.log(pixiContext.current);

    // create pixiApp
    pixiApp = new PIXI.Application({
      backgroundColor: CANVAS_BACKGROUNDCOLOR_HEX,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      autoDensity: true,
      resolution: 2,
    });
    pixiApp.stage.interactive = true;
    pixiApp.stage.buttonMode = true;

    // create viewport
    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: window.innerWidth,
      worldHeight: window.innerHeight,
      interaction: pixiApp.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });

    // add the viewport to the stage
    pixiApp.stage.addChild(viewport);

    // configure viewport
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

    // add pixiApp to canvas
    pixiContext.current.appendChild(pixiApp.view);

    // add background tiles
    const texture = PIXI.Texture.from(CANVAS_BACKGROUND_TEXTURE);
    const background = new PIXI.TilingSprite(
      texture,
      pixiApp.screen.width,
      pixiApp.screen.height
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

    // add graph to pixiApp
    currentGraph = new PPGraph(pixiApp, viewport);

    // register all available node types
    registerAllNodeTypes(currentGraph);
    const allRegisteredNodeTypeNames = Object.keys(
      currentGraph.registeredNodeTypes
    );

    // draw temporary gui
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
      duplicateSelection: function () {
        currentGraph.duplicateSelection();
      },
      addNode: '',
      showEditor: true,
    };

    gui.add(data, 'showEditor').onChange((value) => {
      const element = document.getElementById('container');
      value ? element.classList.remove('hide') : element.classList.add('hide');
    });
    gui.add(data, 'run');
    gui.add(data, 'saveGraph');
    gui.add(data, 'loadGraph');
    gui.add(data, 'duplicateSelection');
    gui.add(data, 'runStep');
    gui.add(data, 'showComments').onChange((value) => {
      console.log(value);
      currentGraph.showComments = value;
    });
    gui
      .add(data, 'addNode', allRegisteredNodeTypeNames)
      .onChange((selected) => {
        console.log(selected);
        currentGraph.createAndAddNode(selected);
      });

    pixiApp.ticker.add(() => {
      if (data.run) {
        currentGraph.runStep();
      }
    });

    loadCurrentGraph();

    // register callbacks
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
        setEditorData(codeString);
        // }
      });
    };

    return () => {
      // On unload completely destroy the application and all of it's children
      pixiApp.destroy(true, {
        children: true,
      });
    };
  }, []);

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
        setEditorData(lastGraph[0].editorData);

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

  function createOrUpdateNodeFromCode(code) {
    currentGraph.createOrUpdateNodeFromCode(code);
    setEditorData(code);
  }

  return (
    <>
      <PixiContainer ref={pixiContext} />
      <ReactContainer value={editorData} onSave={createOrUpdateNodeFromCode} />
    </>
  );
};

export default App;

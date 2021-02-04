import React, { useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import ReactContainer from './ReactContainer';
import PixiContainer from './PixiContainer';
import * as dat from 'dat.gui';
import PPGraph from './GraphClass';
import {
  CANVAS_BACKGROUNDCOLOR_HEX,
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
} from './constants';
import { registerAllNodeTypes } from './nodes/allNodes';
import styles from './style.module.css';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

const App = (): JSX.Element => {
  let pixiApp: PIXI.Application;
  let currentGraph: PPGraph;
  const pixiContext = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log(pixiContext.current);

    // create pixiApp
    pixiApp = new PIXI.Application({
      backgroundColor: CANVAS_BACKGROUNDCOLOR_HEX,
      width: 800,
      height: 600,
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
        // serializeGraph();
      },
      loadGraph: function () {
        // loadCurrentGraph();
      },
      duplicateSelction: function () {
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
    gui.add(data, 'duplicateSelction');
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

    // listen to window resize event and resize pixiApp
    const resizeCanvas = (): void => {
      const resize = () => {
        viewport.resize(window.innerWidth, window.innerHeight);
        pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
      };

      resize();

      window.addEventListener('resize', resize);
    };
    resizeCanvas();

    return () => {
      // On unload completely destroy the application and all of it's children
      pixiApp.destroy(true, {
        children: true,
      });
    };
  }, []);

  return (
    <>
      <PixiContainer ref={pixiContext} />
      <ReactContainer
      // value={editorData || defaultEditorData}
      // onSave={createOrUpdateNodeFromCode}
      />
    </>
  );
};

export default App;

import React, { useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
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

const PixiContainer = (): JSX.Element => {
  let app: PIXI.Application;
  let currentGraph: PPGraph;
  const pixiContext = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    app = new PIXI.Application({
      backgroundColor: CANVAS_BACKGROUNDCOLOR_HEX,
      width: 800,
      height: 600,
      antialias: true,
      autoDensity: true,
      resolution: 2,
    });
    app.stage.interactive = true;
    app.stage.buttonMode = true;

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

    // app.stage.on('click', this.onClick);
    pixiContext.current.appendChild(app.view);
    // this.drawCalendarScene(app);

    // add graph
    currentGraph = new PPGraph(app, viewport);

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
    gui
      .add(data, 'addNode', allRegisteredNodeTypeNames)
      .onChange((selected) => {
        console.log(selected);
        currentGraph.createAndAddNode(selected);
      });

    app.ticker.add(() => {
      if (data.run) {
        currentGraph.runStep();
      }
    });

    const resizeCanvas = (): void => {
      const resize = () => {
        viewport.resize(window.innerWidth, window.innerHeight);
        app.renderer.resize(window.innerWidth, window.innerHeight);
      };

      resize();

      window.addEventListener('resize', resize);
    };

    resizeCanvas();

    return () => {
      // On unload completely destroy the application and all of it's children
      app.destroy(true, {
        children: true,
      });
    };
  }, []);

  return <div className={styles.pixicontainer} ref={pixiContext}></div>;
};

export default PixiContainer;

import React, { useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { MenuItem } from '@blueprintjs/core';
import { Omnibar, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
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
import { INodes } from './interfaces';
import { highlightText } from './utils';
import { registerAllNodeTypes } from './nodes/allNodes';
import styles from './style.module.css';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

const NodeSearch = Omnibar.ofType<INodes>();

const App = (): JSX.Element => {
  let pixiApp: PIXI.Application;
  // let currentGraph: PPGraph;

  const db = new GraphDatabase();
  const currentGraph = useRef<PPGraph | null>(null);
  const pixiContext = useRef<HTMLDivElement | null>(null);
  const [editorData, setEditorData] = useState(DEFAULT_EDITOR_DATA);
  const [isOpen, setIsOpen] = useState(false);
  const [isCurrentGraphLoaded, setIsCurrentGraphLoaded] = useState(false);

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
    currentGraph.current = new PPGraph(pixiApp, viewport);

    // register all available node types
    registerAllNodeTypes(currentGraph.current);
    const allRegisteredNodeTypeNames = Object.keys(
      currentGraph.current.registeredNodeTypes
    );

    console.log(
      'currentGraph.current.registeredNodeTypes:',
      currentGraph.current.registeredNodeTypes
    );
    console.log('allRegisteredNodeTypeNames:', allRegisteredNodeTypeNames);
    console.log('currentGraph.current:', currentGraph.current);

    // draw temporary gui
    const gui = new dat.GUI();
    // gui
    const data = {
      showComments: true,
      run: false,
      runStep: function () {
        currentGraph.current.runStep();
      },
      saveGraph: function () {
        serializeGraph();
      },
      loadGraph: function () {
        loadCurrentGraph();
      },
      duplicateSelection: function () {
        currentGraph.current.duplicateSelection();
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
      currentGraph.current.showComments = value;
    });
    gui
      .add(data, 'addNode', allRegisteredNodeTypeNames)
      .onChange((selected) => {
        console.log(selected);
        currentGraph.current.createAndAddNode(selected);
      });

    pixiApp.ticker.add(() => {
      if (data.run) {
        currentGraph.current.runStep();
      }
    });

    loadCurrentGraph();
    setIsCurrentGraphLoaded(true);
    console.log('currentGraph.current:', currentGraph.current);

    // register callbacks
    currentGraph.current.onSelectionChange = (selectedNodes: string[]) => {
      console.log(selectedNodes);
      let codeString = '';
      selectedNodes.forEach((nodeId) => {
        const selectedNode = currentGraph.current.nodes.find(
          (node) => node.id === nodeId
        );
        console.log(selectedNode);
        const selectedNodeType = selectedNode.type;
        codeString = currentGraph.current.customNodeTypes[selectedNodeType];
        // if (codeString) {
        console.log(codeString);
        setEditorData(codeString);
        // }
      });
    };

    // register key events
    const keysDown = (e: KeyboardEvent): void => {
      console.log(e);
      console.log(e.key);
      if (e.ctrlKey && e.key === 'f') {
        setIsOpen((prevState) => !prevState);
      }
    };
    window.addEventListener('keydown', keysDown.bind(this));

    return () => {
      // On unload completely destroy the application and all of it's children
      pixiApp.destroy(true, {
        children: true,
      });
    };
  }, []);

  function serializeGraph() {
    const serializedGraph = currentGraph.current.serialize();
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
        currentGraph.current.configure(graphData, false);

        console.log(currentGraph.current.nodeContainer.children);
      } else {
        console.log('No saved graphData');
      }
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function createOrUpdateNodeFromCode(code) {
    currentGraph.current.createOrUpdateNodeFromCode(code);
    setEditorData(code);
  }

  const handleItemSelect = (selected: INodes) => {
    console.log(selected);
    currentGraph.current.createAndAddNode(selected.title);
    setIsOpen(false);
  };

  return (
    <>
      <PixiContainer ref={pixiContext} />
      <ReactContainer value={editorData} onSave={createOrUpdateNodeFromCode} />
      {isCurrentGraphLoaded && (
        <NodeSearch
          itemRenderer={renderFilm}
          items={
            Object.keys(currentGraph.current.registeredNodeTypes).map(
              (node) => {
                return { title: node };
              }
            ) as INodes[]
          }
          itemPredicate={filterNode}
          onItemSelect={handleItemSelect}
          resetOnQuery={true}
          resetOnSelect={true}
          // onClose={this.handleClose}
          isOpen={isOpen}
        />
      )}
    </>
  );
};

export default App;

const filterNode: ItemPredicate<INodes> = (query, node, _index, exactMatch) => {
  const normalizedTitle = node.title.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
  }
};

const renderFilm: ItemRenderer<INodes> = (
  node,
  { handleClick, modifiers, query }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  const text = `${node.title}`;
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={node.title}
      onClick={handleClick}
      text={highlightText(text, query)}
    />
  );
};

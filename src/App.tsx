import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useDropzone } from 'react-dropzone';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { MenuItem } from '@blueprintjs/core';
import { ItemRenderer, ItemPredicate, Suggest } from '@blueprintjs/select';
import InspectorContainer from './InspectorContainer';
import PixiContainer from './PixiContainer';
import { GraphContextMenu, NodeContextMenu } from './components/ContextMenus';
import { GraphDatabase } from './utils/indexedDB';
import PPGraph from './classes/GraphClass';
import {
  CANVAS_BACKGROUNDCOLOR_HEX,
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
  PLUGANDPLAY_ICON,
} from './utils/constants';
import { INodes } from './utils/interfaces';
import {
  convertBlobToBase64,
  downloadFile,
  formatDate,
  highlightText,
} from './utils/utils';
import { registerAllNodeTypes } from './nodes/allNodes';
import PPSocket from './classes/SocketClass';
import PPNode from './classes/NodeClass';
import { InputParser } from './utils/inputParser';
import styles from './utils/style.module.css';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

const NodeSearch = Suggest.ofType<INodes>();

const isMac = navigator.platform.indexOf('Mac') != -1;
const controlOrMetaKey = isMac ? '⌘' : 'Ctrl';
console.log('isMac: ', isMac);

const App = (): JSX.Element => {
  const db = new GraphDatabase();
  const pixiApp = useRef<PIXI.Application | null>(null);
  const currentGraph = useRef<PPGraph | null>(null);
  const pixiContext = useRef<HTMLDivElement | null>(null);
  const nodeSearchInput = useRef<HTMLInputElement | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGraphContextMenuOpen, setIsGraphContextMenuOpen] = useState(false);
  const [isNodeContextMenuOpen, setIsNodeContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState([0, 0]);
  const [isCurrentGraphLoaded, setIsCurrentGraphLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedNode, setSelectedNode] = useState<PPNode | null>(null);

  let lastTimeTicked = 0;

  // react-dropzone
  const onDrop = useCallback((acceptedFiles) => {
    console.log(acceptedFiles);
    acceptedFiles.forEach((file: File) => {
      console.log(file);
      // const reader = new FileReader();
      const objectURL = URL.createObjectURL(file);
      console.log(objectURL);

      const extension = file.name
        .slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2)
        .toLowerCase();

      // select what node to create
      (async function () {
        const response = await fetch(objectURL);
        let data;
        let newNode;

        switch (extension) {
          case 'ppgraph':
            data = await response.text();
            currentGraph.current.configure(JSON.parse(data), false);
            break;
          case 'csv':
            data = await response.text();
            newNode = currentGraph.current.createAndAddNode('Table', {
              data,
            });
            break;
          case 'txt':
            data = await response.text();
            newNode = currentGraph.current.createAndAddNode('Text', {
              initialData: data,
            });
            break;
          case 'jpg':
          case 'png':
            data = await response.blob();
            const base64 = await convertBlobToBase64(data);
            newNode = currentGraph.current.createAndAddNode('Image', {
              base64,
            });
            break;
          default:
            break;
        }
        console.log(data);
        console.log(newNode);
      })();
    });
  }, []);
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop,
  });
  const style = useMemo(
    () => ({
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  ) as any;
  useEffect(() => {
    console.log('isDragActive');
  }, [isDragActive]);

  // on mount
  useEffect(() => {
    console.log(pixiContext.current);

    // create pixiApp
    pixiApp.current = new PIXI.Application({
      backgroundColor: CANVAS_BACKGROUNDCOLOR_HEX,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      autoDensity: true,
      resolution: 2,
    });
    pixiApp.current.stage.interactive = true;
    pixiApp.current.stage.buttonMode = true;

    // disable browser window zoom on trackpad pinch
    pixiApp.current.view.addEventListener(
      'mousewheel',
      (e: Event) => {
        e.preventDefault();
      },
      { passive: false }
    );

    // disable default context menu
    window.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });

    // create viewport
    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: window.innerWidth,
      worldHeight: window.innerHeight,
      interaction: pixiApp.current.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });

    // add the viewport to the stage
    pixiApp.current.stage.addChild(viewport);

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
    pixiContext.current.appendChild(pixiApp.current.view);

    // add background tiles
    const texture = PIXI.Texture.from(CANVAS_BACKGROUND_TEXTURE);
    const background = new PIXI.TilingSprite(
      texture,
      pixiApp.current.screen.width,
      pixiApp.current.screen.height
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
    currentGraph.current = new PPGraph(pixiApp.current, viewport);

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

    pixiApp.current.ticker.add(() => {
      const currentTime: number = new Date().getTime();
      const delta = currentTime - lastTimeTicked;
      lastTimeTicked = currentTime;
      currentGraph.current.tick(currentTime, delta);
    });

    loadCurrentGraph();
    setIsCurrentGraphLoaded(true);
    console.log('currentGraph.current:', currentGraph.current);

    // register callbacks
    currentGraph.current.onSelectionChange = (selectedNodes: string[]) => {
      if (selectedNodes.length === 0) {
        setSelectedNode(null);
      } else {
        selectedNodes.forEach((nodeId) => {
          setSelectedNode(
            currentGraph.current.nodes.find((node) => node.id === nodeId)
          );
        });
      }
    };

    currentGraph.current.onRightClick = (
      event: PIXI.InteractionEvent,
      target: PIXI.DisplayObject
    ) => {
      setIsGraphContextMenuOpen(false);
      setIsNodeContextMenuOpen(false);
      setContextMenuPosition(
        // creating new point so react updates
        [event.data.global.x, event.data.global.y]
      );
      console.log(event, target, event.data.global);
      switch (true) {
        case target instanceof PPSocket:
          console.log('app right click, socket');
          break;
        case target instanceof PPNode:
          console.log('app right click, node');
          setIsNodeContextMenuOpen(true);
          break;
        case target instanceof Viewport:
          console.log('app right click, viewport');
          setIsGraphContextMenuOpen(true);
          break;
        default:
          console.log('app right click, something else');
          break;
      }
    };

    // register key events
    const keysDown = (e: KeyboardEvent): void => {
      // console.log(e.key);
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen((prevState) => !prevState);
        nodeSearchInput.current.focus();
      }
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        serializeGraph();
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsGraphContextMenuOpen(false);
        setIsNodeContextMenuOpen(false);
      }
    };
    window.addEventListener('keydown', keysDown.bind(this));

    window.addEventListener('keydown', (e: KeyboardEvent) =>
      InputParser.parseKeyDown(e, currentGraph.current)
    );
    window.addEventListener('keyup', (e: KeyboardEvent) =>
      InputParser.parseKeyUp(e)
    );

    return () => {
      // On unload completely destroy the application and all of it's children
      pixiApp.current.destroy(true, {
        children: true,
      });
    };
  }, []);

  useEffect(() => {
    currentGraph.current.showComments = showComments;
  }, [showComments]);

  function downloadGraph() {
    const serializedGraph = currentGraph.current.serialize();
    downloadFile(
      JSON.stringify(serializedGraph, null, 2),
      `${formatDate()}.ppgraph`,
      'text/plain'
    );
  }

  function uploadGraph() {
    open();
  }

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
  }

  const handleItemSelect = (selected: INodes) => {
    console.log(selected);
    setIsSearchOpen(false);
    currentGraph.current.createAndAddNode(selected.title);
  };

  return (
    <div
      // close open context menu again on click
      onClick={() => {
        isGraphContextMenuOpen && setIsGraphContextMenuOpen(false);
        isNodeContextMenuOpen && setIsNodeContextMenuOpen(false);
        isSearchOpen && setIsSearchOpen(false);
      }}
    >
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        {/* </div> */}
        {isGraphContextMenuOpen && (
          <GraphContextMenu
            controlOrMetaKey={controlOrMetaKey}
            contextMenuPosition={contextMenuPosition}
            currentGraph={currentGraph}
            setIsSearchOpen={setIsSearchOpen}
            nodeSearchInput={nodeSearchInput}
            loadCurrentGraph={loadCurrentGraph}
            serializeGraph={serializeGraph}
            downloadGraph={downloadGraph}
            uploadGraph={uploadGraph}
            showComments={showComments}
            setShowComments={setShowComments}
          />
        )}
        {isNodeContextMenuOpen && (
          <NodeContextMenu
            controlOrMetaKey={controlOrMetaKey}
            contextMenuPosition={contextMenuPosition}
            currentGraph={currentGraph}
          />
        )}
        <PixiContainer ref={pixiContext} />
        {selectedNode && (
          <InspectorContainer
            currentGraph={currentGraph.current}
            selectedNode={selectedNode}
            onSave={createOrUpdateNodeFromCode}
          />
        )}
        <img
          className={styles.plugAndPlaygroundIcon}
          src={PLUGANDPLAY_ICON}
          onClick={() => {
            setContextMenuPosition([80, 40]);
            setIsGraphContextMenuOpen(true);
          }}
        />
        {isCurrentGraphLoaded && (
          <NodeSearch
            className={styles.nodeSearch}
            inputProps={{
              inputRef: nodeSearchInput,
              large: true,
              placeholder: 'Search Nodes',
            }}
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
            resetOnClose={true}
            resetOnQuery={true}
            resetOnSelect={true}
            popoverProps={{ minimal: true }}
            inputValueRenderer={(node: INodes) => node.title}
            createNewItemFromQuery={createNewItemFromQuery}
            createNewItemRenderer={renderCreateFilmOption}
          />
        )}
      </div>
    </div>
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

function createNewItemFromQuery(title: string): INodes {
  return {
    title,
  };
}

const renderCreateFilmOption = (
  query: string,
  active: boolean,
  handleClick: React.MouseEventHandler<HTMLElement>
) => (
  <MenuItem
    icon="add"
    text={`Create "${query}"`}
    active={active}
    onClick={handleClick}
    shouldDismissPopover={false}
  />
);

const activeStyle = {
  opacity: 0.2,
};

const acceptStyle = {
  backgroundColor: '#00FF00',
  // opacity: 0.2,
};

const rejectStyle = {
  backgroundColor: '#FF0000',
  // opacity: 0.2,
};

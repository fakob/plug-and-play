import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useDropzone } from 'react-dropzone';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import {
  Alert,
  Button,
  ButtonGroup,
  Classes,
  Dialog,
  FormGroup,
  InputGroup,
  Intent,
  MenuDivider,
  MenuItem,
} from '@blueprintjs/core';
import { ItemRenderer, ItemPredicate, Suggest } from '@blueprintjs/select';
import Color from 'color';
import { hri } from 'human-readable-ids';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import InspectorContainer from './InspectorContainer';
import PixiContainer from './PixiContainer';
import { GraphContextMenu, NodeContextMenu } from './components/ContextMenus';
import { GraphDatabase } from './utils/indexedDB';
import PPGraph from './classes/GraphClass';
import {
  CANVAS_BACKGROUNDCOLOR_HEX,
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
  COLOR,
  PLUGANDPLAY_ICON,
} from './utils/constants';
import { IGraphSearch, INodeSearch } from './utils/interfaces';
import {
  convertBlobToBase64,
  downloadFile,
  formatDate,
  getLoadedGraphId,
  getRemoteGraph,
  getRemoteGraphsList,
  highlightText,
  truncateText,
  removeExtension,
  useStateRef,
} from './utils/utils';
import { registerAllNodeTypes } from './nodes/allNodes';
import PPSelection from './classes/SelectionClass';
import PPSocket from './classes/SocketClass';
import PPNode from './classes/NodeClass';
import { InputParser } from './utils/inputParser';
import styles from './utils/style.module.css';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

TimeAgo.addDefaultLocale(en);
// Create formatter (English).
const timeAgo = new TimeAgo('en-US');

const GraphSearch = Suggest.ofType<IGraphSearch>();
const NodeSearch = Suggest.ofType<INodeSearch>();

const isMac = navigator.platform.indexOf('Mac') != -1;
const controlOrMetaKey = isMac ? '⌘' : 'Ctrl';
console.log('isMac: ', isMac);

const randomMainColor = COLOR[Math.floor(Math.random() * COLOR.length)];

const App = (): JSX.Element => {
  document.title = 'Your Plug and Playground';

  // remote playground database
  const githubBaseURL =
    'https://api.github.com/repos/fakob/plug-and-play-examples';
  const githubBranchName = 'dev';

  const mousePosition = { x: 0, y: 0 };

  const db = new GraphDatabase();
  const pixiApp = useRef<PIXI.Application | null>(null);
  const currentGraph = useRef<PPGraph | null>(null);
  const pixiContext = useRef<HTMLDivElement | null>(null);
  const viewport = useRef<Viewport | null>(null);
  const graphSearchInput = useRef<HTMLInputElement | null>(null);
  const [graphSearchRendered, setGraphSearchRendered] = useState(false);
  const [nodeSearchRendered, setNodeSearchRendered] = useState(false);
  const nodeSearchInput = useRef<HTMLInputElement | null>(null);
  const [isGraphSearchOpen, setIsGraphSearchOpen] = useState(false);
  const [isNodeSearchVisible, setIsNodeSearchVisible] = useState(false);
  const [isGraphContextMenuOpen, setIsGraphContextMenuOpen] = useState(false);
  const [isNodeContextMenuOpen, setIsNodeContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState([0, 0]);
  const [isCurrentGraphLoaded, setIsCurrentGraphLoaded] = useState(false);
  const [actionObject, setActionObject] = useState(null); // id and name of graph to edit/delete
  const [showComments, setShowComments] = useState(false);
  const [selectedNode, setSelectedNode] = useState<PPNode | null>(null);
  const [remoteGraphs, setRemoteGraphs, remoteGraphsRef] = useStateRef([]);
  const [graphSearchItems, setGraphSearchItems] = useState<
    IGraphSearch[] | null
  >([{ id: '', name: '' }]);
  const [graphSearchActiveItem, setGraphSearchActiveItem] =
    useState<IGraphSearch | null>(null);

  // dialogs
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteGraph, setShowDeleteGraph] = useState(false);

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
            saveNewGraph(removeExtension(file.name));
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
              defaultArguments: { Image: base64 },
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
      ...(isDragActive
        ? {
            opacity: 0.5,
          }
        : {}),
      ...(isDragAccept
        ? {
            backgroundColor: randomMainColor,
            opacity: 0.5,
          }
        : {}),
      ...(isDragReject
        ? {
            backgroundColor: '#FF0000',
          }
        : {}),
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

    window.addEventListener(
      'mousemove',
      function (mouseMoveEvent) {
        mousePosition.x = mouseMoveEvent.pageX;
        mousePosition.y = mouseMoveEvent.pageY;
      },
      false
    );

    // disable default context menu
    window.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });

    // create viewport
    viewport.current = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: window.innerWidth,
      worldHeight: window.innerHeight,
      interaction: pixiApp.current.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });

    // add the viewport to the stage
    pixiApp.current.stage.addChild(viewport.current);

    // configure viewport
    viewport.current
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
    viewport.current.addChild(background);
    viewport.current.on('moved', () => {
      background.tilePosition.y = -viewport.current.top;
      background.tilePosition.x = -viewport.current.left;
      background.y = viewport.current.top;
      background.x = viewport.current.left;

      background.width = innerWidth / viewport.current.scale.x;
      background.height = innerHeight / viewport.current.scale.y;
    });
    background.alpha = CANVAS_BACKGROUND_ALPHA;

    // add graph to pixiApp
    currentGraph.current = new PPGraph(pixiApp.current, viewport.current);

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

    loadGraph();
    setIsCurrentGraphLoaded(true);
    console.log('currentGraph.current:', currentGraph.current);

    getRemoteGraphsList(githubBaseURL, githubBranchName).then(
      (arrayOfFileNames) => {
        console.log(arrayOfFileNames);
        setRemoteGraphs(arrayOfFileNames);
      }
    );

    // register callbacks
    currentGraph.current.selection.onSelectionChange = (
      selectedNodes: PPNode[]
    ) => {
      if (selectedNodes.length === 0) {
        setSelectedNode(null);
      } else {
        setSelectedNode(selectedNodes[selectedNodes.length - 1]);
      }
    };

    currentGraph.current.onOpenNodeSearch = (pos: PIXI.Point) => {
      openNodeSearch(pos);
    };

    currentGraph.current.onRightClick = (
      event: PIXI.InteractionEvent,
      target: PIXI.DisplayObject
    ) => {
      setIsGraphContextMenuOpen(false);
      setIsNodeContextMenuOpen(false);
      setContextMenuPosition([
        Math.min(window.innerWidth - 240, event.data.global.x),
        Math.min(window.innerHeight - 432, event.data.global.y),
      ]);
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

    (
      pixiApp.current.stage.getChildByName('selectionContainer') as PPSelection
    ).onRightClick = (
      event: PIXI.InteractionEvent,
      target: PIXI.DisplayObject
    ) => {
      setIsGraphContextMenuOpen(false);
      setIsNodeContextMenuOpen(false);
      setContextMenuPosition([
        Math.min(window.innerWidth - 240, event.data.global.x),
        Math.min(window.innerHeight - 432, event.data.global.y),
      ]);
      console.log(event, target, event.data.global);
      console.log('app right click, selection');
      setIsNodeContextMenuOpen(true);
    };

    // register key events
    const keysDown = (e: KeyboardEvent): void => {
      // console.log(e.key);
      if (e.shiftKey) {
        viewport.current.cursor = 'default';
      }
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        setIsGraphSearchOpen((prevState) => !prevState);
      }
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        openNodeSearch(mousePosition);
      }
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setShowEdit((prevState) => !prevState);
      }
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          saveNewGraph();
        } else {
          saveGraph();
        }
      }
      if (e.shiftKey && e.code === 'Digit1') {
        zoomToFit();
      }
      if ((isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key === 'y') {
        e.preventDefault();
        setShowComments((prevState) => !prevState);
      }
      if (e.key === 'Escape') {
        setIsGraphSearchOpen(false);
        setIsNodeSearchVisible(false);
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
      // Passing the same reference
      graphSearchInput.current.removeEventListener(
        'focus',
        updateGraphSearchItems
      );
    };
  }, []);

  // addEventListener to graphSearchInput
  useEffect(() => {
    if (!graphSearchRendered) {
      return;
    }
    console.log('add eventlistener to graphSearchInput');
    graphSearchInput.current.addEventListener('focus', updateGraphSearchItems);
    // }
  }, [graphSearchRendered]);

  // addEventListener to nodeSearchInput
  useEffect(() => {
    if (!nodeSearchRendered) {
      return;
    }
    console.log('add eventlistener to nodeSearchInput');
    nodeSearchInput.current.addEventListener('blur', nodeSearchInputBlurred);
    // }
  }, [nodeSearchRendered]);

  useEffect(() => {
    if (graphSearchInput.current != null) {
      if (isGraphSearchOpen) {
        graphSearchInput.current.focus();
      }
    }
  }, [isGraphSearchOpen]);

  useEffect(() => {
    if (isNodeSearchVisible) {
      nodeSearchInput.current.focus();
    } else {
      // wait before clearing clickedSocketRef
      // so handleNodeItemSelect has access
      setTimeout(() => {
        currentGraph.current.clearTempConnection();
      }, 100);
    }
  }, [isNodeSearchVisible]);

  useEffect(() => {
    currentGraph.current.showComments = showComments;
  }, [showComments]);

  const zoomToFit = () => {
    const nodeContainerBounds =
      currentGraph.current.nodeContainer.getLocalBounds();
    viewport.current.fit(
      true,
      nodeContainerBounds.width,
      nodeContainerBounds.height
    );
    viewport.current.moveCenter(
      nodeContainerBounds.x + nodeContainerBounds.width / 2,
      nodeContainerBounds.y + nodeContainerBounds.height / 2
    );
    viewport.current.zoomPercent(-0.1, true); // zoom out a bit
  };

  function downloadGraph() {
    db.transaction('rw', db.graphs, db.settings, async () => {
      const loadedGraphId = await getLoadedGraphId(db);
      const graph = await db.graphs.where('id').equals(loadedGraphId).first();

      const serializedGraph = currentGraph.current.serialize();
      downloadFile(
        JSON.stringify(serializedGraph, null, 2),
        `${graph?.name} - ${formatDate()}.ppgraph`,
        'text/plain'
      );
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function uploadGraph() {
    open();
  }

  function renameGraph(graphId: number, newName = undefined) {
    db.transaction('rw', db.graphs, db.settings, async () => {
      const id = await db.graphs.where('id').equals(graphId).modify({
        name: newName,
      });
      setActionObject({ id: graphId, name: newName });
      console.log(`Renamed graph: ${id} to ${newName}`);
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function deleteGraph(graphId: string) {
    console.log(graphId);
    db.transaction('rw', db.graphs, db.settings, async () => {
      const loadedGraphId = await getLoadedGraphId(db);
      if (loadedGraphId === graphId) {
        // save loadedGraphId
        await db.settings.put({
          name: 'loadedGraphId',
          value: undefined,
        });
      }
      const id = await db.graphs.where('id').equals(graphId).delete();
      console.log(`Deleted graph: ${id}`);
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function saveGraph(saveNew = false, newName = undefined) {
    const serializedGraph = currentGraph.current.serialize();
    console.log(serializedGraph);
    console.info(serializedGraph.customNodeTypes);
    // console.log(JSON.stringify(serializedGraph));
    db.transaction('rw', db.graphs, db.settings, async () => {
      const graphs = await db.graphs.toArray();
      const loadedGraphId = await getLoadedGraphId(db);

      const id = hri.random();
      const tempName = id.substring(0, id.lastIndexOf('-')).replace('-', ' ');

      const loadedGraph = graphs.find((graph) => graph.id === loadedGraphId);

      if (saveNew || graphs.length === 0 || loadedGraph === undefined) {
        const name = newName ?? tempName;
        const indexId = await db.graphs.put({
          id,
          date: new Date(),
          name,
          graphData: serializedGraph,
        });

        // save loadedGraphId
        await db.settings.put({
          name: 'loadedGraphId',
          value: id,
        });

        setActionObject({ id, name });
        setGraphSearchActiveItem({ id, name });

        console.log(`Saved new graph: ${indexId}`);
      } else {
        const indexId = await db.graphs
          .where('id')
          .equals(loadedGraphId)
          .modify({
            date: new Date(),
            graphData: serializedGraph,
          });
        console.log(`Updated currentGraph: ${indexId}`);
      }
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function saveNewGraph(newName = undefined) {
    saveGraph(true, newName);
  }

  function loadGraph(id = undefined) {
    db.transaction('rw', db.graphs, db.settings, async () => {
      const graphs = await db.graphs.toArray();
      const loadedGraphId = await getLoadedGraphId(db);

      if (loadedGraphId !== undefined && graphs.length > 0) {
        let loadedGraph = graphs.find(
          (graph) => graph.id === (id || loadedGraphId)
        );

        // check if graph exists and load last graph if it does not
        if (loadedGraph === undefined) {
          loadedGraph = graphs[graphs.length - 1];
        }

        const graphData = loadedGraph.graphData;
        currentGraph.current.configure(graphData, false);

        // update loadedGraphId
        await db.settings.put({
          name: 'loadedGraphId',
          value: loadedGraph.id,
        });

        setActionObject({
          id: loadedGraph.id,
          name: loadedGraph.name,
        });
        setGraphSearchActiveItem({
          id: loadedGraph.id,
          name: loadedGraph.name,
        });
      } else {
        console.log('No saved graphData');
      }
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  async function cloneRemoteGraph(id = undefined) {
    const nameOfFileToClone = remoteGraphsRef.current[id];
    const fileData = await getRemoteGraph(
      githubBaseURL,
      githubBranchName,
      nameOfFileToClone
    );
    console.log(fileData);
    currentGraph.current.configure(fileData);
    const newName = `${removeExtension(remoteGraphsRef.current[id])} - copy`; // remove .ppgraph extension and add copy
    saveNewGraph(newName);
  }

  function createOrUpdateNodeFromCode(code) {
    currentGraph.current.createOrUpdateNodeFromCode(code);
  }

  const handleGraphItemSelect = (selected: IGraphSearch) => {
    console.log(selected);
    setIsGraphSearchOpen(false);

    if (selected.isRemote) {
      cloneRemoteGraph(selected.id);
    } else {
      loadGraph(selected.id);
      setGraphSearchActiveItem(selected);
    }
  };

  const handleNodeItemSelect = (selected: INodeSearch) => {
    console.log(selected);
    // store link before search gets hidden and temp connection gets reset
    const addLink = currentGraph.current.clickedSocketRef;
    const nodePos = viewport.current.toWorld(
      contextMenuPosition[0],
      contextMenuPosition[1]
    );
    currentGraph.current.createAndAddNode(selected.title, {
      nodePosX: nodePos.x,
      nodePosY: nodePos.y,
      addLink,
    });
    setIsNodeSearchVisible(false);
  };

  const getNodes = (): INodeSearch[] => {
    const addLink = currentGraph.current.clickedSocketRef;
    const tempItems = Object.entries(currentGraph.current.registeredNodeTypes)
      .map(([title, obj]) => {
        return {
          title,
          name: obj.name,
          description: obj.description,
          hasInputs: obj.hasInputs.toString(),
        };
      })
      .sort(
        (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }) // case insensitive sorting
      )
      .filter((node) =>
        addLink ? node.hasInputs === 'true' : 'true'
      ) as INodeSearch[];
    return tempItems;
  };

  const openNodeSearch = (pos = undefined) => {
    console.log('openNodeSearch');
    if (pos !== undefined) {
      setContextMenuPosition([
        Math.min(window.innerWidth - 200, pos.x),
        Math.min(window.innerHeight - 56, pos.y),
      ]);
    }
    setIsNodeSearchVisible(true);
  };

  const nodeSearchInputBlurred = () => {
    console.log('nodeSearchInputBlurred');
    setIsNodeSearchVisible(false);
  };

  const updateGraphSearchItems = () => {
    console.log('updateGraphSearchItems');
    load();

    async function load() {
      const remoteGraphSearchItems = remoteGraphsRef.current.map(
        (graph, index) => {
          return {
            id: index,
            name: removeExtension(graph), // remove .ppgraph extension
            label: 'remote',
            isRemote: true,
          } as IGraphSearch;
        }
      );
      // add remote header entry
      if (remoteGraphSearchItems.length > 0) {
        remoteGraphSearchItems.unshift({
          id: `remote-header`,
          name: 'Remote playgrounds', // opening a remote playground creates a local copy
          isDisabled: true,
        });
      }

      const graphs = await db.graphs.toCollection().sortBy('date');
      const newGraphSearchItems = graphs.map((graph) => {
        return {
          id: graph.id,
          name: graph.name,
          label: `saved ${timeAgo.format(graph.date)}`,
        } as IGraphSearch;
      });

      // add local header entry
      if (graphs.length > 0) {
        newGraphSearchItems.unshift({
          id: `local-header`,
          name: 'Local playgrounds',
          isDisabled: true,
        });
      }

      const allGraphSearchItems = [
        ...newGraphSearchItems,
        ...remoteGraphSearchItems,
      ];
      setGraphSearchItems(allGraphSearchItems);

      const loadedGraphId = await getLoadedGraphId(db);
      const loadedGraphIndex = allGraphSearchItems.findIndex(
        (graph) => graph.id === loadedGraphId
      );
      setGraphSearchActiveItem(newGraphSearchItems[loadedGraphIndex]);
    }
  };

  function ErrorFallback({ error, resetErrorBoundary }) {
    return (
      <div role="alert" style={{ color: 'white' }}>
        <p>Something went wrong:</p>
        <pre>{error.message}</pre>
        <button onClick={resetErrorBoundary}>Try again</button>
      </div>
    );
  }

  const filterGraph: ItemPredicate<IGraphSearch> = (
    query,
    graph,
    _index,
    exactMatch
  ) => {
    if (graph) {
      const normalizedTitle = graph?.name?.toLowerCase();
      const normalizedQuery = query.toLowerCase();

      if (exactMatch) {
        return normalizedTitle === normalizedQuery;
      } else {
        return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
      }
    }
  };

  const filterNode: ItemPredicate<INodeSearch> = (
    query,
    node,
    _index,
    exactMatch
  ) => {
    const normalizedTitle = node.title.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    if (exactMatch) {
      return normalizedTitle === normalizedQuery;
    } else {
      return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
    }
  };

  const renderGraphItem: ItemRenderer<IGraphSearch> = (
    graph,
    { handleClick, modifiers, query }
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    const isRemote = graph.isRemote;
    const text = graph.name;
    const title = isRemote // hover title tag
      ? `${graph.name}
NOTE: opening a remote playground creates a local copy`
      : graph.name;
    const icon = isRemote ? 'duplicate' : undefined;
    const label = graph.label;
    const itemToReturn = graph.isDisabled ? (
      <MenuDivider key={graph.id} title={text} />
    ) : (
      <MenuItem
        active={modifiers.active}
        disabled={graph.isDisabled || modifiers.disabled}
        key={graph.id}
        title={title}
        icon={icon}
        onClick={handleClick}
        label={label}
        labelElement={
          !isRemote && (
            <ButtonGroup minimal={true} className="menuItemButtonGroup">
              <Button
                minimal
                icon="edit"
                title="Rename playground"
                className="menuItemButton"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  console.log(graph.name);
                  setIsGraphSearchOpen(false);
                  setActionObject(graph);
                  setShowEdit(true);
                }}
              />
              <Button
                minimal
                icon="trash"
                title="Delete playground"
                className="menuItemButton"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  console.log(graph.name);
                  setIsGraphSearchOpen(false);
                  setActionObject(graph);
                  setShowDeleteGraph(true);
                }}
              />
            </ButtonGroup>
          )
        }
        text={highlightText(text, query)}
      />
    );
    return itemToReturn;
  };

  const renderNodeItem: ItemRenderer<INodeSearch> = (
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
        title={node.description}
        label={truncateText(node.description, 24)}
        onClick={handleClick}
        text={highlightText(text, query)}
      />
    );
  };

  const createNewItemFromQuery = (title: string): INodeSearch => {
    return {
      title,
      name: title,
      description: '',
      hasInputs: '',
    };
  };

  const submitEditDialog = (): void => {
    const name = (
      document.getElementById('playground-name-input') as HTMLInputElement
    ).value;
    setShowEdit(false);
    renameGraph(actionObject.id, name);
    updateGraphSearchItems();
  };

  const renderCreateNodeOption = (
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

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div
        // close open context menu again on click
        onClick={() => {
          isGraphContextMenuOpen && setIsGraphContextMenuOpen(false);
          isNodeContextMenuOpen && setIsNodeContextMenuOpen(false);
          isGraphSearchOpen && setIsGraphSearchOpen(false);
        }}
      >
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <Alert
            cancelButtonText="Cancel"
            confirmButtonText="Delete"
            intent={Intent.DANGER}
            isOpen={showDeleteGraph}
            onCancel={() => setShowDeleteGraph(false)}
            onConfirm={() => {
              setShowDeleteGraph(false);
              deleteGraph(actionObject.id);
            }}
          >
            <p>
              Are you sure you want to delete
              <br />
              <b>{`${actionObject?.name}`}</b>?
            </p>
          </Alert>
          <Dialog
            onClose={() => setShowEdit(false)}
            title="Edit playground details"
            autoFocus={true}
            canEscapeKeyClose={true}
            canOutsideClickClose={true}
            enforceFocus={true}
            isOpen={showEdit}
            usePortal={true}
            onOpened={() => {
              const input = document.getElementById(
                'playground-name-input'
              ) as HTMLInputElement;
              input.focus();
              input.select();
            }}
          >
            <div className={Classes.DIALOG_BODY}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitEditDialog();
                }}
              >
                <FormGroup label="Name of playground" labelFor="text-input">
                  <InputGroup
                    id="playground-name-input"
                    defaultValue={`${actionObject?.name}`}
                    placeholder={`${actionObject?.name}`}
                  />
                </FormGroup>
                <div className={Classes.DIALOG_FOOTER}>
                  <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button onClick={() => setShowEdit(false)}>Cancel</Button>
                    <Button
                      intent={Intent.WARNING}
                      onClick={() => {
                        submitEditDialog();
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Dialog>
          {isGraphContextMenuOpen && (
            <GraphContextMenu
              controlOrMetaKey={controlOrMetaKey}
              contextMenuPosition={contextMenuPosition}
              currentGraph={currentGraph}
              setIsGraphSearchOpen={setIsGraphSearchOpen}
              openNodeSearch={openNodeSearch}
              setShowEdit={setShowEdit}
              loadGraph={loadGraph}
              saveGraph={saveGraph}
              saveNewGraph={saveNewGraph}
              downloadGraph={downloadGraph}
              uploadGraph={uploadGraph}
              showComments={showComments}
              setShowComments={setShowComments}
              zoomToFit={zoomToFit}
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
            style={{
              backgroundColor: randomMainColor,
            }}
            src={PLUGANDPLAY_ICON}
            onClick={() => {
              setContextMenuPosition([80, 40]);
              setIsGraphContextMenuOpen(true);
            }}
          />
          {isCurrentGraphLoaded && (
            <>
              <GraphSearch
                className={`${styles.graphSearch} graphSearch`}
                inputProps={{
                  inputRef: (el) => {
                    graphSearchInput.current = el;
                    setGraphSearchRendered(!!el);
                  },
                  large: true,
                  placeholder: 'Search playgrounds',
                  className: styles.brightPlaceholder,
                  style: {
                    backgroundColor: Color(randomMainColor).alpha(0.3),
                  },
                }}
                // defaultSelectedItem={graphSearchActiveItem}
                noResults={'No playgrounds available'}
                itemRenderer={renderGraphItem}
                items={graphSearchItems}
                activeItem={graphSearchActiveItem}
                itemPredicate={filterGraph}
                onItemSelect={handleGraphItemSelect}
                resetOnClose={true}
                resetOnQuery={true}
                resetOnSelect={true}
                popoverProps={{ minimal: true, portalClassName: 'graphSearch' }}
                inputValueRenderer={(item: IGraphSearch) => item.name}
              />
              <div
                style={{
                  visibility: isNodeSearchVisible ? undefined : 'hidden',
                  position: 'relative',
                  left: `${contextMenuPosition[0]}px`,
                  top: `${contextMenuPosition[1]}px`,
                }}
              >
                <NodeSearch
                  className={styles.nodeSearch}
                  inputProps={{
                    inputRef: (el) => {
                      nodeSearchInput.current = el;
                      setNodeSearchRendered(!!el);
                    },
                    large: true,
                    placeholder: 'Search Nodes',
                  }}
                  itemRenderer={renderNodeItem}
                  items={getNodes()}
                  itemPredicate={filterNode}
                  onItemSelect={handleNodeItemSelect}
                  resetOnClose={true}
                  resetOnQuery={true}
                  resetOnSelect={true}
                  popoverProps={{ minimal: true }}
                  inputValueRenderer={(node: INodeSearch) => node.title}
                  createNewItemFromQuery={createNewItemFromQuery}
                  createNewItemRenderer={renderCreateNodeOption}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;

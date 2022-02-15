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
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ThemeProvider,
  createFilterOptions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Color from 'color';
import { hri } from 'human-readable-ids';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {
  GraphSearchInput,
  GraphSearchPopper,
  NodeSearchInput,
} from './components/Search';
import GraphOverlay from './components/GraphOverlay';
import ErrorFallback from './components/ErrorFallback';
import PixiContainer from './PixiContainer';
import { Image as ImageNode } from './nodes/image/image';
import { GraphContextMenu, NodeContextMenu } from './components/ContextMenus';
import { GraphDatabase } from './utils/indexedDB';
import PPGraph from './classes/GraphClass';
import {
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
  DRAGANDDROP_GRID_MARGIN,
  NODE_WIDTH,
  PLUGANDPLAY_ICON,
  RANDOMMAINCOLOR,
  customTheme,
} from './utils/constants';
import { IGraphSearch, INodeSearch } from './utils/interfaces';
import {
  convertBlobToBase64,
  downloadFile,
  formatDate,
  getLoadedGraphId,
  getRemoteGraph,
  getRemoteGraphsList,
  getSelectionBounds,
  isEventComingFromWithinTextInput,
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

const isMac = navigator.platform.indexOf('Mac') != -1;
const controlOrMetaKey = isMac ? '⌘' : 'Ctrl';
console.log('isMac: ', isMac);

const randomMainColorLightHex = PIXI.utils.string2hex(
  Color(RANDOMMAINCOLOR).mix(Color('white'), 0.9).hex()
);

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
  const nodeSearchInput = useRef<HTMLInputElement | null>(null);
  const [isGraphSearchOpen, setIsGraphSearchOpen] = useState(false);
  const [isNodeSearchVisible, setIsNodeSearchVisible] = useState(false);
  const [isGraphContextMenuOpen, setIsGraphContextMenuOpen] = useState(false);
  const [isNodeContextMenuOpen, setIsNodeContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState([0, 0]);
  const [isCurrentGraphLoaded, setIsCurrentGraphLoaded] = useState(false);
  const [actionObject, setActionObject] = useState(null); // id and name of graph to edit/delete
  const [showComments, setShowComments] = useState(false);
  const [remoteGraphs, setRemoteGraphs, remoteGraphsRef] = useStateRef([]);
  const [graphSearchItems, setGraphSearchItems] = useState<
    IGraphSearch[] | null
  >([{ id: '', name: '' }]);
  const [nodeSearchActiveItem, setNodeSearchActiveItem] =
    useState<INodeSearch | null>(null);
  const [graphSearchActiveItem, setGraphSearchActiveItem] =
    useState<IGraphSearch | null>(null);

  const filterOptionGraph = createFilterOptions<IGraphSearch>();
  const filterOptionNode = createFilterOptions<INodeSearch>();

  // dialogs
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteGraph, setShowDeleteGraph] = useState(false);

  let lastTimeTicked = 0;

  // react-dropzone
  const onDrop = useCallback((acceptedFiles, fileRejections, event) => {
    console.log(acceptedFiles, fileRejections);

    const dropPoint = viewport.current.toWorld(
      new PIXI.Point(event.clientX, event.clientY)
    );
    let nodePosX = dropPoint.x;
    const nodePosY = dropPoint.y;
    const newNodeSelection: PPNode[] = [];

    (async function () {
      for (let index = 0; index < acceptedFiles.length; index++) {
        const file = acceptedFiles[index];

        // const reader = new FileReader();
        const objectURL = URL.createObjectURL(file);

        const extension = file.name
          .slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2)
          .toLowerCase();

        // select what node to create
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
              nodePosX,
              nodePosY,
              data,
            });
            break;
          case 'txt':
            data = await response.text();
            newNode = currentGraph.current.createAndAddNode('Text', {
              nodePosX,
              nodePosY,
              initialData: data,
            });
            break;
          case 'jpg':
          case 'png':
            data = await response.blob();
            const base64 = await convertBlobToBase64(data).catch((err) => {
              console.error(err);
            });
            if (base64) {
              if (
                currentGraph.current.selection.selectedNodes?.[index]?.type ===
                'Image'
              ) {
                const existingNode = currentGraph.current.selection
                  .selectedNodes[index] as ImageNode;
                existingNode.updateTexture(base64 as string);
                existingNode.setMinNodeHeight(existingNode.nodeWidth);
              } else {
                newNode = currentGraph.current.createAndAddNode('Image', {
                  nodePosX,
                  nodePosY,
                  defaultArguments: { Image: base64 },
                });
                newNode.resetNodeSize();
              }
            }
            break;
          default:
            break;
        }

        // update postion if there are more than one
        if (newNode) {
          newNodeSelection.push(newNode);
          nodePosX = nodePosX + NODE_WIDTH + DRAGANDDROP_GRID_MARGIN;
        }
      }
      // select the newly added nodes
      if (newNodeSelection.length > 0) {
        // currentGraph.current.selection.selectedNodes = newNodeSelection;
        currentGraph.current.selection.selectNodes(newNodeSelection);
        zoomToFitSelection();
      }
    })();
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
            backgroundColor: RANDOMMAINCOLOR,
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
      backgroundColor: randomMainColorLightHex,
      backgroundAlpha: 1,
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

    // disable default context menu for pixi only
    pixiApp.current.view.addEventListener(
      'contextmenu',
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
        Math.min(window.innerWidth - 248, event.data.global.x),
        Math.min(window.innerHeight - 530, event.data.global.y),
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
        Math.min(window.innerWidth - 248, event.data.global.x),
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
      if (!isEventComingFromWithinTextInput(e)) {
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'a') {
          e.preventDefault();
          currentGraph.current.selection.selectAllNodes();
        }
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'f') {
          e.preventDefault();
          openNodeSearch(mousePosition);
        }
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'd') {
          e.preventDefault();
          currentGraph.current.duplicateSelection();
        }
      }
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        setIsGraphSearchOpen((prevState) => !prevState);
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
        zoomToFitSelection(true);
      }
      if (e.shiftKey && e.code === 'Digit2') {
        zoomToFitSelection();
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
    if (!graphSearchInput?.current) {
      return;
    }
    console.log('add eventlistener to graphSearchInput');
    graphSearchInput.current.addEventListener('focus', updateGraphSearchItems);
    // }
  }, [graphSearchInput?.current]);

  useEffect(() => {
    if (graphSearchInput.current != null) {
      if (isGraphSearchOpen) {
        graphSearchInput.current.focus();
      }
    }
  }, [isGraphSearchOpen]);

  useEffect(() => {
    if (!nodeSearchInput?.current) {
      return;
    }
    console.log('add eventlistener to nodeSearchInput');
    nodeSearchInput.current.addEventListener('blur', nodeSearchInputBlurred);
    // }
  }, [nodeSearchInput?.current]);

  useEffect(() => {
    if (isNodeSearchVisible) {
      nodeSearchInput.current.focus();
      nodeSearchInput.current.select();
      console.dir(nodeSearchInput.current);
    } else {
      // TODO remove timeout here
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

  const moveToCenter = (bounds: PIXI.Rectangle) => {
    viewport.current.moveCenter(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2
    );
  };

  const zoomToFitSelection = (fitAll = false) => {
    let boundsToZoomTo: PIXI.Rectangle;
    let zoomOutFactor: number;

    if (fitAll || currentGraph.current.selection.selectedNodes.length < 1) {
      boundsToZoomTo = currentGraph.current.nodeContainer.getLocalBounds(); // get bounds of the whole nodeContainer
      zoomOutFactor = -0.2;
    } else {
      boundsToZoomTo = getSelectionBounds(
        currentGraph.current.selection.selectedNodes // get bounds of the selectedNodes
      );
      zoomOutFactor = -0.3;
    }

    moveToCenter(boundsToZoomTo);
    viewport.current.fit(true, boundsToZoomTo.width, boundsToZoomTo.height);
    viewport.current.zoomPercent(zoomOutFactor, true); // zoom out a bit more
    currentGraph.current.selection.drawRectanglesFromSelection();
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

  const handleGraphItemSelect = (event, selected: IGraphSearch) => {
    console.log(selected);
    setIsGraphSearchOpen(false);

    if (selected.isRemote) {
      cloneRemoteGraph(selected.id);
    } else {
      if (selected.isNew) {
        currentGraph.current.clear();
        saveNewGraph(selected.name);
        // remove selection flag
        selected.isNew = undefined;
      } else {
        loadGraph(selected.id);
      }
      setGraphSearchActiveItem(selected);
    }
  };

  const handleNodeItemSelect = (event, selected: INodeSearch) => {
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
    if (selected.isNew) {
      selected.isNew = undefined;
    }
    setNodeSearchActiveItem(selected);
    setIsNodeSearchVisible(false);
  };

  const getNodes = (): INodeSearch[] => {
    const addLink = currentGraph.current.clickedSocketRef;
    const tempItems = Object.entries(currentGraph.current.registeredNodeTypes)
      .map(([title, obj]) => {
        return {
          title,
          name: obj.name,
          key: title,
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
        Math.min(window.innerWidth - 408, pos.x),
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
      console.log(allGraphSearchItems);
      setGraphSearchItems(allGraphSearchItems);

      const loadedGraphId = await getLoadedGraphId(db);
      const loadedGraphIndex = allGraphSearchItems.findIndex(
        (graph) => graph.id === loadedGraphId
      );
      setGraphSearchActiveItem(newGraphSearchItems[loadedGraphIndex]);
    }
  };

  const filterGraph = (options, params) => {
    const filtered = filterOptionGraph(options, params);
    if (params.inputValue !== '') {
      filtered.push({
        id: hri.random(),
        name: params.inputValue,
        isNew: true,
      });
    }
    return filtered;
  };

  const filterNode = (options, params) => {
    const filtered = filterOptionNode(options, params);
    if (params.inputValue !== '') {
      filtered.push({
        title: params.inputValue,
        key: params.inputValue,
        name: params.inputValue,
        description: '',
        hasInputs: '',
        isNew: true,
      });
    }
    return filtered;
  };

  const renderGraphItem = (props, option, state) => {
    const isRemote = option.isRemote;
    const text = option.name;
    const title = isRemote // hover title tag
      ? `${option.name}
NOTE: opening a remote playground creates a local copy`
      : option.name;
    const optionLabel = option.label;
    const itemToReturn = option.isDisabled ? (
      <Box {...props} key={option.id} component="li">
        {text}
      </Box>
    ) : (
      <Box
        {...props}
        component="li"
        key={option.id}
        title={title}
        sx={{
          position: 'relative',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          <Box component="div" sx={{ display: 'inline', opacity: '0.5' }}>
            {option.isNew && 'Create empty playground: '}
          </Box>
          {text}
        </Box>
        <Box
          sx={{
            fontSize: '12px',
            opacity: '0.75',
            visibility: 'visible',
            '.Mui-focused &': {
              visibility: 'hidden',
            },
          }}
        >
          {optionLabel}
        </Box>
        {isRemote && (
          <Box
            sx={{
              py: 1,
              px: 2,
              fontSize: '12px',
              fontStyle: 'italic',
              opacity: '0.75',
              position: 'absolute',
              right: '0px',
              visibility: 'hidden',
              '.Mui-focused &': {
                visibility: 'visible',
              },
            }}
          >
            Creates a local copy
          </Box>
        )}
        {!isRemote && (
          <ButtonGroup
            size="small"
            sx={{
              position: 'absolute',
              right: '0px',
              visibility: 'hidden',
              '.Mui-focused &': {
                visibility: 'visible',
              },
            }}
          >
            <IconButton
              size="small"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                console.log(option.name);
                setIsGraphSearchOpen(false);
                setActionObject(option);
                setShowEdit(true);
              }}
              title="Rename playground"
              className="menuItemButton"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              title="Delete playground"
              className="menuItemButton"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                console.log(option.name);
                setIsGraphSearchOpen(false);
                setActionObject(option);
                setShowDeleteGraph(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </ButtonGroup>
        )}
      </Box>
    );

    return itemToReturn;
  };

  const renderNodeItem = (props, option, { selected }) => {
    return (
      <li {...props} key={option.title}>
        <Stack
          sx={{
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box
              title={option.description}
              sx={{
                flexGrow: 1,
              }}
            >
              <Box component="div" sx={{ display: 'inline', opacity: '0.5' }}>
                {option.isNew && 'Create custom node: '}
              </Box>
              {option.name}
            </Box>
            <Box
              sx={{
                fontSize: '12px',
                opacity: '0.75',
              }}
            >
              {option.title}
            </Box>
          </Box>
          <Box
            sx={{
              fontSize: '12px',
              opacity: '0.75',
              textOverflow: 'ellipsis',
            }}
          >
            {option.description}
          </Box>
        </Stack>
      </li>
    );
  };

  const submitEditDialog = (): void => {
    const name = (
      document.getElementById('playground-name-input') as HTMLInputElement
    ).value;
    setShowEdit(false);
    renameGraph(actionObject.id, name);
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider theme={customTheme}>
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
            <Dialog
              open={showDeleteGraph}
              onClose={() => setShowDeleteGraph(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle id="alert-dialog-title">
                {'Delete Graph?'}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Are you sure you want to delete
                  <br />
                  <b>{`${actionObject?.name}`}</b>?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowDeleteGraph(false)} autoFocus>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteGraph(false);
                    deleteGraph(actionObject.id);
                  }}
                >
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
            <Dialog
              open={showEdit}
              onClose={() => setShowEdit(false)}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>Edit playground details</DialogTitle>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitEditDialog();
                }}
              >
                <DialogContent>
                  <TextField
                    id="playground-name-input"
                    autoFocus
                    margin="dense"
                    label="Name of playground"
                    fullWidth
                    variant="standard"
                    defaultValue={`${actionObject?.name}`}
                    placeholder={`${actionObject?.name}`}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setShowEdit(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      submitEditDialog();
                    }}
                  >
                    Save
                  </Button>
                </DialogActions>
              </form>
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
                zoomToFitSelection={zoomToFitSelection}
              />
            )}
            {isNodeContextMenuOpen && (
              <NodeContextMenu
                controlOrMetaKey={controlOrMetaKey}
                contextMenuPosition={contextMenuPosition}
                currentGraph={currentGraph}
                zoomToFitSelection={zoomToFitSelection}
              />
            )}
            <PixiContainer ref={pixiContext} />
            <GraphOverlay
              currentGraph={currentGraph.current}
              randomMainColor={RANDOMMAINCOLOR}
            />
            <img
              className={styles.plugAndPlaygroundIcon}
              style={{
                backgroundColor: RANDOMMAINCOLOR,
              }}
              src={PLUGANDPLAY_ICON}
              onClick={() => {
                setContextMenuPosition([80, 40]);
                setIsGraphContextMenuOpen(true);
              }}
            />
            {isCurrentGraphLoaded && (
              <>
                <Autocomplete
                  className={styles.graphSearch}
                  freeSolo
                  openOnFocus
                  selectOnFocus
                  autoHighlight
                  clearOnBlur
                  isOptionEqualToValue={(option, value) =>
                    option.title === value.title
                  }
                  // open
                  PopperComponent={(props) => <GraphSearchPopper {...props} />}
                  value={graphSearchActiveItem}
                  getOptionDisabled={(option) => option.isDisabled}
                  getOptionLabel={(option) => option.name}
                  options={graphSearchItems}
                  sx={{ width: 'calc(65vw - 120px)' }}
                  onChange={handleGraphItemSelect}
                  filterOptions={filterGraph}
                  renderOption={renderGraphItem}
                  renderInput={(props) => (
                    <GraphSearchInput
                      {...props}
                      inputRef={graphSearchInput}
                      randommaincolor={RANDOMMAINCOLOR}
                    />
                  )}
                />
                <div
                  style={{
                    visibility: isNodeSearchVisible ? undefined : 'hidden',
                    position: 'relative',
                    left: `${contextMenuPosition[0]}px`,
                    top: `${contextMenuPosition[1]}px`,
                  }}
                >
                  <Autocomplete
                    freeSolo
                    openOnFocus
                    selectOnFocus
                    autoHighlight
                    clearOnBlur
                    // open
                    isOptionEqualToValue={(option, value) =>
                      option.title === value.title
                    }
                    value={nodeSearchActiveItem} // does not seem to work. why?
                    getOptionLabel={(option) => option.name}
                    options={getNodes()}
                    sx={{ maxWidth: '50vw', width: '400px', minWidth: '200px' }}
                    onChange={handleNodeItemSelect}
                    filterOptions={filterNode}
                    renderOption={renderNodeItem}
                    renderInput={(props) => (
                      <NodeSearchInput
                        {...props}
                        inputRef={nodeSearchInput}
                        randommaincolor={RANDOMMAINCOLOR}
                      />
                    )}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

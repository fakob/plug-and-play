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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  TextField,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import Color from 'color';
import { hri } from 'human-readable-ids';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {
  GraphSearchInput,
  GraphSearchPopper,
  NodeSearchInput,
  filterOptionsGraph,
  filterOptionsNode,
  getNodes,
  renderGraphItem,
  renderNodeItem,
} from './components/Search';
import GraphOverlay from './components/GraphOverlay';
import ErrorFallback from './components/ErrorFallback';
import PixiContainer from './PixiContainer';
import { Image as ImageNode } from './nodes/image/image';
import {
  GraphContextMenu,
  NodeContextMenu,
  SocketContextMenu,
} from './components/ContextMenus';
import { GraphDatabase } from './utils/indexedDB';
import PPGraph from './classes/GraphClass';
import {
  BASIC_VERTEX_SHADER,
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
  COMMENT_TEXTSTYLE,
  CONTEXTMENU_WIDTH,
  DRAGANDDROP_GRID_MARGIN,
  GESTUREMODE,
  GRID_SHADER,
  PLUGANDPLAY_ICON,
  RANDOMMAINCOLOR,
} from './utils/constants';
import { IGraphSearch, INodeSearch } from './utils/interfaces';
import {
  connectNodeToSocket,
  convertBlobToBase64,
  downloadFile,
  formatDate,
  getDataFromClipboard,
  getNodeDataFromHtml,
  getNodeDataFromText,
  getRemoteGraph,
  getRemoteGraphsList,
  getSetting,
  isEventComingFromWithinTextInput,
  removeExtension,
  roundNumber,
  useStateRef,
  writeDataToClipboard,
} from './utils/utils';
import { ensureVisible, zoomToFitNodes } from './pixi/utils-pixi';
import { getAllNodeTypes } from './nodes/allNodes';
import PPSocket from './classes/SocketClass';
import PPNode from './classes/NodeClass';
import { InputParser } from './utils/inputParser';
import styles from './utils/style.module.css';
import { ActionHandler } from './utils/actionHandler';
import InterfaceController, { ListenEvent } from './InterfaceController';
import PPSelection from './classes/SelectionClass';

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

fetch('https://plugandplayground.dev/buildInfo')
  .then((response) => response.json())
  .then((data) => console.log(data));

const App = (): JSX.Element => {
  document.title = 'Your Plug and Playground';

  // remote playground database
  const githubBaseURL =
    'https://api.github.com/repos/fakob/plug-and-play-examples';
  const githubBranchName = 'dev';

  const mousePosition = { x: 0, y: 0 };
  const pixiDebugRef = new PIXI.Text('', COMMENT_TEXTSTYLE);
  pixiDebugRef.resolution = 1;
  pixiDebugRef.x = 4;

  const db = new GraphDatabase();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const pixiApp = useRef<PIXI.Application | null>(null);
  const currentGraph = useRef<PPGraph | null>(null);
  const pixiContext = useRef<HTMLDivElement | null>(null);
  const viewport = useRef<Viewport | null>(null);
  const overlayCommentContainer = useRef<PIXI.Container | null>(null);
  const graphSearchInput = useRef<HTMLInputElement | null>(null);
  const nodeSearchInput = useRef<HTMLInputElement | null>(null);
  const [isGraphSearchOpen, setIsGraphSearchOpen] = useState(false);
  const [isNodeSearchVisible, setIsNodeSearchVisible] = useState(false);
  const [nodeSearchCount, setNodeSearchCount] = useState(0);
  const [isGraphContextMenuOpen, setIsGraphContextMenuOpen] = useState(false);
  const [isNodeContextMenuOpen, setIsNodeContextMenuOpen] = useState(false);
  const [isSocketContextMenuOpen, setIsSocketContextMenuOpen] = useState(false);
  const [selectedSocket, setSelectedSocket] = useState<PPSocket | null>(null);
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

  // dialogs
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteGraph, setShowDeleteGraph] = useState(false);

  let lastTimeTicked = 0;

  // get/set mouse position and also update debug text
  const setMousePosition = (mouseMoveEvent) => {
    mousePosition.x = mouseMoveEvent?.pageX ?? 0;
    mousePosition.y = mouseMoveEvent?.pageY ?? 0;
    const mouseWorld = viewport.current.toWorld(mousePosition);
    const mouseWorldX = Math.round(mouseWorld.x);
    const mouseWorldY = Math.round(mouseWorld.y);
    const viewportScreenX = Math.round(viewport.current.x);
    const viewportScreenY = Math.round(viewport.current.y);
    const viewportScale = roundNumber(viewport.current.scale.x);
    pixiDebugRef.text = `Mouse position (world): ${mousePosition.x}, ${mousePosition.y
      } (${mouseWorldX}, ${mouseWorldY})
Viewport position (scale): ${viewportScreenX}, ${Math.round(
        viewportScreenY
      )} (${viewportScale})`;
  };

  // react-dropzone
  const onDrop = useCallback((acceptedFiles, fileRejections, event) => {
    console.log(acceptedFiles, fileRejections);

    const dropPoint = viewport.current.toWorld(
      // no event exists in case graph gets loaded from file
      new PIXI.Point(event?.clientX ?? 0, event?.clientY ?? 0)
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
            await currentGraph.current.configure(JSON.parse(data), false);
            saveNewGraph(removeExtension(file.name));
            break;
          case 'csv':
          case 'ods':
          case 'numbers':
          case 'xls':
          case 'xlsm':
          case 'xlsb':
          case 'xlsx':
            /* data is an ArrayBuffer */
            data = await response.arrayBuffer();
            newNode = currentGraph.current.addNewNode('Table', {
              nodePosX,
              nodePosY,
              initialData: data,
            });
            break;
          case 'txt':
            data = await response.text();
            newNode = currentGraph.current.addNewNode('TextEditor', {
              nodePosX,
              nodePosY,
              initialData: { plain: data },
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
              } else {
                newNode = await currentGraph.current.addNewNode('Image', {
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
          nodePosX = nodePosX + newNode.nodeWidth + DRAGANDDROP_GRID_MARGIN;
        }
      }
      // select the newly added nodes
      if (newNodeSelection.length > 0) {
        currentGraph.current.selection.selectNodes(newNodeSelection);
        ensureVisible(currentGraph.current.selection.selectedNodes);
        enqueueSnackbar(
          `${newNodeSelection.length} new ${newNodeSelection.length === 1 ? 'node was' : 'nodes were'
          } added`
        );
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
    document.addEventListener(
      'wheel',
      (event) => {
        const { ctrlKey } = event;
        if (ctrlKey) {
          event.preventDefault();
          return;
        }
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

    document.addEventListener('copy', async (e: ClipboardEvent) => {
      const selection = document.getSelection();
      // if text selection is empty
      // prevent default and copy selected nodes
      if (selection.toString() === '') {
        e.preventDefault();
        const serializeSelection = currentGraph.current.serializeSelection();
        writeDataToClipboard(serializeSelection);
        console.log(serializeSelection);
      }
    });

    document.addEventListener('paste', async (e) => {
      if (!isEventComingFromWithinTextInput(e)) {
        const clipboardBlobs = await getDataFromClipboard();

        const tryGettingDataAndAdd = async (mimeType) => {
          const mouseWorld = viewport.current.toWorld(mousePosition);
          let data;
          try {
            // check if it is node data
            if (mimeType === 'text/html') {
              data = getNodeDataFromHtml(clipboardBlobs[mimeType]);
            } else {
              data = getNodeDataFromText(clipboardBlobs[mimeType]);
            }
            e.preventDefault();
            await currentGraph.current.pasteNodes(data, {
              x: mouseWorld.x,
              y: mouseWorld.y,
            });
            return true;
          } catch (e) {
            console.log(`No node data in ${mimeType}`, e);
          }
          try {
            data = clipboardBlobs[mimeType];
            e.preventDefault();
            if (currentGraph.current.selection.selectedNodes.length < 1) {
              currentGraph.current.addNewNode('TextEditor', {
                nodePosX: mouseWorld.x,
                nodePosY: mouseWorld.y,
                initialData: {
                  ...(mimeType === 'text/html'
                    ? { html: data }
                    : { plain: data }),
                },
              });
            }
            return true;
          } catch (e) {
            console.log(`No text data in ${mimeType}`, e);
          }
        };

        let result = false;
        if (clipboardBlobs['text/html']) {
          result = await tryGettingDataAndAdd('text/html');
        }
        if (!result && clipboardBlobs['text/plain']) {
          await tryGettingDataAndAdd('text/plain');
        }
      }
    });

    window.addEventListener('mousemove', setMousePosition, false);

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

    // add global listen events to zoom
    viewport.current.on('zoomed', () =>
      InterfaceController.notifyListeners(ListenEvent.ViewportZoom, true)
    );
    viewport.current.on('zoomed-end', () =>
      InterfaceController.notifyListeners(ListenEvent.ViewportZoom, false)
    );

    viewport.current.on('pointerupoutside', (event: PIXI.InteractionEvent) =>
      InterfaceController.notifyListeners(ListenEvent.GlobalPointerUp, event)
    );
    viewport.current.on('pointerup', (event: PIXI.InteractionEvent) => {
      InterfaceController.notifyListeners(ListenEvent.GlobalPointerUp, event);
    });

    // configure viewport
    viewport.current
      .drag({
        clampWheel: false,
        mouseButtons: 'middle-right',
      })
      .pinch()
      .wheel({ smooth: 3, trackpadPinch: true, wheelZoom: false })
      .decelerate({
        friction: 0.8,
      })
      .clampZoom({
        minScale: 0.05,
        maxScale: 4,
      });

    // add overlayCommentContainer to the stage
    overlayCommentContainer.current = new PIXI.Container();
    overlayCommentContainer.current.name = 'OverlayContainer';

    pixiApp.current.stage.addChild(overlayCommentContainer.current);
    overlayCommentContainer.current.addChild(pixiDebugRef);

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
    viewport.current.on('moved', (event) => {
      background.tilePosition.y = -viewport.current.top;
      background.tilePosition.x = -viewport.current.left;
      background.y = viewport.current.top;
      background.x = viewport.current.left;

      background.width = innerWidth / viewport.current.scale.x;
      background.height = innerHeight / viewport.current.scale.y;

      setMousePosition(event);
    });

    background.alpha = CANVAS_BACKGROUND_ALPHA;

    const geometry = new PIXI.Geometry()
      .addAttribute('aVertexPosition', [0, 0, 1000, 0, 1000, 1000, 0, 1000], 2)
      .addAttribute('aUvs', [0, 0, 1, 0, 1, 1, 0, 1], 2)
      .addIndex([0, 1, 2, 0, 2, 3]);

    const gridUniforms = {
      x: 0,
      y: 0,
      zoom: 5,
    };
    const gridShader = PIXI.Shader.from(
      BASIC_VERTEX_SHADER,
      GRID_SHADER,
      gridUniforms
    );
    const gridQuad = new PIXI.Mesh(geometry, gridShader);
    gridQuad.name = 'debugGrid';
    gridQuad.visible = showComments;
    viewport.current.addChild(gridQuad);

    // add graph to pixiApp
    currentGraph.current = new PPGraph(pixiApp.current, viewport.current);

    pixiApp.current.ticker.add(() => {
      const currentTime: number = new Date().getTime();
      const delta = currentTime - lastTimeTicked;
      lastTimeTicked = currentTime;
      currentGraph.current.tick(currentTime, delta);
    });

    // load plug and playground settings
    applyGestureMode(viewport.current);

    const urlParams = new URLSearchParams(window.location.search);
    const loadURL = urlParams.get('loadURL');
    console.log('loadURL: ', loadURL);
    if (loadURL) {
      loadGraphFromURL(loadURL);
    } else {
      loadGraph();
    }

    setIsCurrentGraphLoaded(true);
    console.log('currentGraph.current:', currentGraph.current);

    getRemoteGraphsList(githubBaseURL, githubBranchName).then(
      (arrayOfFileNames) => {
        console.log(arrayOfFileNames);
        setRemoteGraphs(
          arrayOfFileNames.filter((file) => file.endsWith('.ppgraph'))
        );
      }
    );

    InterfaceController.onOpenNodeSearch = openNodeSearch;

    InterfaceController.onRightClick = (
      event: PIXI.InteractionEvent,
      target: PIXI.DisplayObject
    ) => {
      setIsGraphContextMenuOpen(false);
      setIsNodeContextMenuOpen(false);
      setIsSocketContextMenuOpen(false);
      console.log(event, target, event.data.global);
      const contextMenuPosX = Math.min(
        window.innerWidth - (CONTEXTMENU_WIDTH + 8),
        event.data.global.x
      );
      const contextMenuPosY = (offset: number) => {
        return Math.min(window.innerHeight - offset, event.data.global.y);
      };
      switch (true) {
        case target.parent instanceof PPSocket &&
          target instanceof PIXI.Graphics:
        case target.parent instanceof PPSocket && target instanceof PIXI.Text:
          console.log('app right click, socket');
          setContextMenuPosition([contextMenuPosX, contextMenuPosY(80)]);
          setSelectedSocket(target.parent as PPSocket);
          setIsSocketContextMenuOpen(true);
          break;
        case target instanceof PPNode:
          console.log('app right click, node');
          setContextMenuPosition([contextMenuPosX, contextMenuPosY(220)]);
          setIsNodeContextMenuOpen(true);
          break;
        case target instanceof Viewport:
          console.log('app right click, viewport');
          setContextMenuPosition([contextMenuPosX, contextMenuPosY(600)]);
          setIsGraphContextMenuOpen(true);
          break;
        case target instanceof PPSelection:
          setContextMenuPosition([
            Math.min(
              window.innerWidth - (CONTEXTMENU_WIDTH + 8),
              event.data.global.x
            ),
            Math.min(window.innerHeight - 432, event.data.global.y),
          ]);
          setIsNodeContextMenuOpen(true);
          break;
        default:
          console.log('app right click, something else');
          break;
      }
    };


    // register key events
    const keysDown = (e: KeyboardEvent): void => {
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (!isEventComingFromWithinTextInput(e)) {
        if (modKey && !e.shiftKey) {
          switch (e.key.toLowerCase()) {
            case 'a':
              currentGraph.current.selection.selectAllNodes();
              e.preventDefault();
              break;
            case 'f':
              openNodeSearch(mousePosition);
              e.preventDefault();
              break;
            case 'd':
              currentGraph.current.duplicateSelection();
              e.preventDefault();
              break;
            case 'o':
              setIsGraphSearchOpen((prevState) => !prevState);
              e.preventDefault();
              break;
            case 'e':
              setShowEdit((prevState) => !prevState);
              e.preventDefault();
              break;
            case 'z':
              ActionHandler.undo();
              e.preventDefault();
              break;
          }
        } else if (modKey && e.shiftKey) {
          switch (e.key.toLowerCase()) {
            case 'y':
              setShowComments((prevState) => !prevState);
              break;
            case 'x':
              currentGraph.current.showExecutionVisualisation =
                !currentGraph.current.showExecutionVisualisation;
              break;
            case 'z':
              ActionHandler.redo();
              break;
          }
        } else if (e.shiftKey) {
          switch (e.code) {
            case 'Digit1':
              zoomToFitNodes();
              break;
            case 'Digit2':
              zoomToFitNodes(currentGraph.current.selection.selectedNodes);
              break;
          }
        } else if (e.altKey) {
          switch (e.code) {
            case 'KeyA':
              console.log('alt a');
              e.preventDefault();
              currentGraph.current.sendKeyEvent(e);
              break;
          }
        }
      }
      if (modKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          saveNewGraph();
        } else {
          saveGraph();
        }
      } else if (e.key === 'Escape') {
        setIsGraphSearchOpen(false);
        setIsNodeSearchVisible(false);
        setIsGraphContextMenuOpen(false);
        setIsNodeContextMenuOpen(false);
        setIsSocketContextMenuOpen(false);
      }
    };
    window.addEventListener('keydown', keysDown.bind(this));

    window.addEventListener('keydown', (e: KeyboardEvent) =>
      InputParser.parseKeyDown(e, currentGraph.current)
    );

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      InputParser.parseKeyUp(e);
    });

    return () => {
      // Passing the same reference
      graphSearchInput.current.removeEventListener(
        'focus',
        updateGraphSearchItems
      );
    };
  }, []);

  useEffect(() => {
    InterfaceController.showSnackBar = enqueueSnackbar;
  });

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
      // console.dir(nodeSearchInput.current);
    } else {
      // TODO remove timeout here
      // wait before clearing clickedSocketRef
      // so handleNodeItemSelect has access
      setTimeout(() => {
        currentGraph.current.stopConnecting();
      }, 100);
    }
  }, [isNodeSearchVisible]);

  useEffect(() => {
    currentGraph.current.showComments = showComments;
    overlayCommentContainer.current.visible = showComments;
  }, [showComments]);

  function setGestureModeOnViewport(
    viewport: Viewport,
    gestureMode = undefined
  ) {
    viewport.wheel({
      smooth: 3,
      trackpadPinch: true,
      wheelZoom: gestureMode === GESTUREMODE.TRACKPAD ? false : true,
    });
  }

  function detectTrackPad(event) {
    let isTrackpad = false;
    if (event.wheelDeltaY) {
      if (event.wheelDeltaY === event.deltaY * -3) {
        isTrackpad = true;
      }
    } else if (event.deltaMode === 0) {
      isTrackpad = true;
    }

    const gestureMode = isTrackpad ? GESTUREMODE.TRACKPAD : GESTUREMODE.MOUSE;
    setGestureModeOnViewport(viewport.current, gestureMode);
    enqueueSnackbar(`${gestureMode} detected`);

    // unsubscribe from mousewheel again
    window.removeEventListener('mousewheel', detectTrackPad);
    window.removeEventListener('DOMMouseScroll', detectTrackPad);
  }

  function applyGestureMode(viewport: Viewport, newGestureMode = undefined) {
    db.transaction('rw', db.settings, async () => {
      let gestureMode = newGestureMode;
      if (gestureMode) {
        // save newGestureMode
        await db.settings.put({
          name: 'gestureMode',
          value: gestureMode,
        });
      } else {
        // get saved gestureMode
        gestureMode = await getSetting(db, 'gestureMode');
        console.log(gestureMode);
      }

      if (
        gestureMode === GESTUREMODE.MOUSE ||
        gestureMode === GESTUREMODE.TRACKPAD
      ) {
        setGestureModeOnViewport(viewport, gestureMode);
        enqueueSnackbar(`GestureMode is set to: ${gestureMode}`);
      } else {
        // subscribe to mousewheel event to detect pointer device
        window.addEventListener('mousewheel', detectTrackPad, false);
        window.addEventListener('DOMMouseScroll', detectTrackPad, false);
      }
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function downloadGraph() {
    db.transaction('rw', db.graphs, db.settings, async () => {
      const loadedGraphId = await getSetting(db, 'loadedGraphId');
      const graph = await db.graphs.where('id').equals(loadedGraphId).first();

      const serializedGraph = currentGraph.current.serialize();
      downloadFile(
        JSON.stringify(serializedGraph, null, 2),
        `${graph?.name} - ${formatDate()}.ppgraph`,
        'text/plain'
      );
      enqueueSnackbar('Playground was saved to your Download folder');
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
      updateGraphSearchItems();
      console.log(`Renamed graph: ${id} to ${newName}`);
      enqueueSnackbar(`Playground was renamed to ${newName}`);
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function deleteGraph(graphId: string) {
    console.log(graphId);
    db.transaction('rw', db.graphs, db.settings, async () => {
      const loadedGraphId = await getSetting(db, 'loadedGraphId');

      const id = await db.graphs.where('id').equals(graphId).delete();
      updateGraphSearchItems();
      console.log(`Deleted graph: ${id}`);
      enqueueSnackbar('Playground was deleted');

      // if the current graph was deleted load last saved graph
      if (loadedGraphId === graphId) {
        loadGraph();
      }
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function saveGraph(saveNew = false, newName = undefined) {
    const serializedGraph = currentGraph.current.serialize();
    console.log(serializedGraph);
    db.transaction('rw', db.graphs, db.settings, async () => {
      const graphs = await db.graphs.toArray();
      const loadedGraphId = await getSetting(db, 'loadedGraphId');

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
        enqueueSnackbar('New playground was saved');
      } else {
        const indexId = await db.graphs
          .where('id')
          .equals(loadedGraphId)
          .modify({
            date: new Date(),
            graphData: serializedGraph,
          });
        console.log(`Updated currentGraph: ${indexId}`);
        enqueueSnackbar('Playground was saved');
      }
    }).catch((e) => {
      console.log(e.stack || e);
    });
  }

  function saveNewGraph(newName = undefined) {
    saveGraph(true, newName);
  }

  async function loadGraph(id = undefined) {
    let loadedGraph;
    await db
      .transaction('rw', db.graphs, db.settings, async () => {
        const graphs = await db.graphs.toArray();
        const loadedGraphId = await getSetting(db, 'loadedGraphId');

        if (graphs.length > 0) {
          loadedGraph = graphs.find(
            (graph) => graph.id === (id || loadedGraphId)
          );

          // check if graph exists and load last saved graph if it does not
          if (loadedGraph === undefined) {
            loadedGraph = graphs.reduce((a, b) => {
              return new Date(a.date) > new Date(b.date) ? a : b;
            });
          }

          // update loadedGraphId
          await db.settings.put({
            name: 'loadedGraphId',
            value: loadedGraph.id,
          });
        } else {
          console.log('No saved graphData');
        }
      })
      .catch((e) => {
        console.log(e.stack || e);
      });

    if (loadedGraph) {
      const graphData = loadedGraph.graphData;
      await currentGraph.current.configure(graphData, false);

      setActionObject({
        id: loadedGraph.id,
        name: loadedGraph.name,
      });
      setGraphSearchActiveItem({
        id: loadedGraph.id,
        name: loadedGraph.name,
      });
      enqueueSnackbar(`${loadedGraph.name} was loaded`);
    }
  }

  async function loadGraphFromURL(loadURL: string) {
    try {
      const file = await fetch(loadURL, {});
      const fileData = await file.json();
      console.log(fileData);
      currentGraph.current.configure(fileData);

      // unset loadedGraphId
      await db.settings.put({
        name: 'loadedGraphId',
        value: undefined,
      });

      const newName = hri.random();
      enqueueSnackbar('Playground from link in URL was loaded', {
        variant: 'default',
        autoHideDuration: 20000,
        action: (key) => (
          <>
            <Button size="small" onClick={() => saveNewGraph(newName)}>
              Save
            </Button>
            <Button size="small" onClick={() => closeSnackbar(key)}>
              Dismiss
            </Button>
          </>
        ),
      });
      return fileData;
    } catch (error) {
      enqueueSnackbar(
        `Loading playground from link in URL failed: ${loadURL}`,
        {
          variant: 'error',
          autoHideDuration: 20000,
        }
      );
      return undefined;
    }
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

    // unset loadedGraphId
    await db.settings.put({
      name: 'loadedGraphId',
      value: undefined,
    });

    const newName = `${removeExtension(remoteGraphsRef.current[id])} - copy`; // remove .ppgraph extension and add copy
    enqueueSnackbar('Remote playground was loaded', {
      variant: 'default',
      autoHideDuration: 20000,
      action: (key) => (
        <>
          <Button size="small" onClick={() => saveNewGraph(newName)}>
            Save
          </Button>
          <Button size="small" onClick={() => closeSnackbar(key)}>
            Dismiss
          </Button>
        </>
      ),
    });
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

  const action_AddOrReplaceNode = async (event, selected: INodeSearch) => {
    const referenceID = hri.random();
    const addLink = currentGraph.current.selectedSourceSocket;

    if (currentGraph.current.selection.selectedNodes.length === 1 && !addLink) {
      // replace node if there is exactly one node selected
      const newNodeType = selected.title;
      const oldNode = PPGraph.currentGraph.selection.selectedNodes[0];
      const serializedNode = oldNode.serialize();

      const action = async () => {
        PPGraph.currentGraph.replaceNode(
          serializedNode,
          serializedNode.id,
          referenceID,
          newNodeType
        );
        setNodeSearchActiveItem(selected);
        setIsNodeSearchVisible(false);
      };
      const undoAction = async () => {
        PPGraph.currentGraph.replaceNode(
          serializedNode,
          referenceID,
          serializedNode.id
        );
      };
      await ActionHandler.performAction(action, undoAction);
    } else {
      // add node
      // store link before search gets hidden and temp connection gets reset
      const nodePos =
        currentGraph.current.overrideNodeCursorPosition ??
        viewport.current.toWorld(
          new PIXI.Point(contextMenuPosition[0], contextMenuPosition[1])
        );

      const action = async () => {
        let addedNode: PPNode;
        const nodeExists = getAllNodeTypes()[selected.title] !== undefined;
        if (nodeExists) {
          addedNode = await currentGraph.current.addNewNode(selected.title, {
            overrideId: referenceID,
            nodePosX: nodePos.x,
            nodePosY: nodePos.y,
          });
        } else {
          addedNode = await currentGraph.current.addNewNode('CustomFunction', {
            overrideId: referenceID,
            nodePosX: nodePos.x,
            nodePosY: nodePos.y,
          });
          addedNode.nodeName = selected.title;
        }
        if (addLink) {
          connectNodeToSocket(addLink, addedNode);
        }

        setNodeSearchActiveItem(selected);
        setIsNodeSearchVisible(false);
      };
      const undoAction = async () => {
        PPGraph.currentGraph.removeNode(
          PPGraph.currentGraph.nodes[referenceID]
        );
      };
      await ActionHandler.performAction(action, undoAction);
    }
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
    currentGraph.current.selectedSourceSocket = null;
  };

  const ResultsWithHeader = ({ children, ...other }) => {
    return (
      <Paper
        {...other}
        sx={{
          '.MuiAutocomplete-listbox': {
            padding: '0 0 8px',
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 0.5,
            pb: 0.25,
            fontSize: '10px',
            opacity: '0.5',
          }}
        >
          {`${nodeSearchCount} of ${Object.keys(getAllNodeTypes()).length}`}
        </Box>
        {children}
      </Paper>
    );
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

      const loadedGraphId = await getSetting(db, 'loadedGraphId');
      const loadedGraphIndex = allGraphSearchItems.findIndex(
        (graph) => graph.id === loadedGraphId
      );
      setGraphSearchActiveItem(newGraphSearchItems[loadedGraphIndex]);
    }
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
      <div
        // close open context menu again on click
        onClick={() => {
          setIsGraphContextMenuOpen(false);
          setIsNodeContextMenuOpen(false);
          setIsSocketContextMenuOpen(false);
          setIsGraphSearchOpen(false);
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
            <DialogTitle id="alert-dialog-title">{'Delete Graph?'}</DialogTitle>
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
              applyGestureMode={applyGestureMode}
              zoomToFitNodes={zoomToFitNodes}
            />
          )}
          {isNodeContextMenuOpen && (
            <NodeContextMenu
              controlOrMetaKey={controlOrMetaKey}
              contextMenuPosition={contextMenuPosition}
              currentGraph={currentGraph}
              openNodeSearch={openNodeSearch}
              zoomToFitSelection={zoomToFitNodes}
            />
          )}
          {isSocketContextMenuOpen && (
            <SocketContextMenu
              controlOrMetaKey={controlOrMetaKey}
              contextMenuPosition={contextMenuPosition}
              currentGraph={currentGraph}
              selectedSocket={selectedSocket}
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
                  option.name === value.name
                }
                // open
                PopperComponent={(props) => <GraphSearchPopper {...props} />}
                value={graphSearchActiveItem}
                getOptionDisabled={(option) => option.isDisabled}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.name
                }
                options={graphSearchItems}
                sx={{ width: 'calc(65vw - 120px)' }}
                onChange={handleGraphItemSelect}
                filterOptions={filterOptionsGraph}
                renderOption={(props, option, state) =>
                  renderGraphItem(
                    props,
                    option,
                    state,
                    setIsGraphSearchOpen,
                    setActionObject,
                    setShowEdit,
                    setShowDeleteGraph
                  )
                }
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
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.name
                  }
                  options={getNodes()}
                  sx={{
                    maxWidth: '50vw',
                    width: '400px',
                    minWidth: '200px',
                  }}
                  onChange={action_AddOrReplaceNode}
                  filterOptions={(options, state) =>
                    filterOptionsNode(options, state, setNodeSearchCount)
                  }
                  PaperComponent={ResultsWithHeader}
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
        <div
          id="portal"
          style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999 }}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;

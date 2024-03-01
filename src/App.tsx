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
import { Autocomplete, Box, Paper, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import Color from 'color';
import {
  NodeSearchInput,
  filterOptionsNode,
  getNodes,
  renderGroupItem,
  renderNodeItem,
} from './components/Search';
import GraphOverlay from './components/GraphOverlay';
import ErrorFallback from './components/ErrorFallback';
import PixiContainer from './PixiContainer';
import { dragAndDrop } from './dragAndDrop';
import { Tooltip } from './components/Tooltip';
import {
  GraphContextMenu,
  NodeContextMenu,
  SocketContextMenu,
} from './components/ContextMenus';
import {
  EditDialog,
  DeleteConfirmationDialog,
  ShareDialog,
} from './components/Dialogs';
import PPGraph from './classes/GraphClass';
import {
  BASIC_VERTEX_SHADER,
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
  COMMENT_TEXTSTYLE,
  CONTEXTMENU_GRAPH_HEIGHT,
  CONTEXTMENU_WIDTH,
  GRID_SHADER,
  RANDOMMAINCOLOR,
} from './utils/constants';
import { IGraphSearch, INodeSearch } from './utils/interfaces';
import {
  controlOrMetaKey,
  cutOrCopyClipboard,
  isPhone,
  loadGraph,
  pasteClipboard,
  roundNumber,
} from './utils/utils';
import { zoomToFitNodes } from './pixi/utils-pixi';
import { getAllNodeTypes } from './nodes/allNodes';
import PPSocket from './classes/SocketClass';
import PPNode from './classes/NodeClass';
import { InputParser } from './utils/inputParser';
import InterfaceController, { ListenEvent } from './InterfaceController';
import PPStorage from './PPStorage';
import PPSelection from './classes/SelectionClass';
import TestController from './TestController';

const randomMainColorLightHex = new PIXI.Color(
  Color(RANDOMMAINCOLOR).mix(Color('white'), 0.9).hex(),
).toNumber();

fetch('/buildInfo')
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));

fetch('/listExamples')
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));

(window as any).testController = new TestController(); // this is for cypress tests to be able to access everything in here
const App = (): JSX.Element => {
  console.log('FULL APP REDRAW');
  document.title = 'Your Plug and Playground';

  const mousePosition = { x: 0, y: 0 };
  const pixiDebugRef = new PIXI.Text('', COMMENT_TEXTSTYLE);
  pixiDebugRef.resolution = 1;
  pixiDebugRef.x = 4;

  const theme = useTheme();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const pixiApp = useRef<PIXI.Application | null>(null);
  const pixiContext = useRef<HTMLDivElement | null>(null);
  const viewport = useRef<Viewport | null>(null);
  const overlayCommentContainer = useRef<PIXI.Container | null>(null);
  const nodeSearchInput = useRef<HTMLInputElement | null>(null);
  const [isNodeSearchVisible, setIsNodeSearchVisible] = useState(false);
  const [showRightSideDrawer, setShowRightSideDrawer] = useState(false);
  const [showLeftSideDrawer, setShowLeftSideDrawer] = useState(true);
  const nodeSearchCountRef = useRef(0);
  const [isGraphContextMenuOpen, setIsGraphContextMenuOpen] = useState(false);
  const [isNodeContextMenuOpen, setIsNodeContextMenuOpen] = useState(false);
  const [isSocketContextMenuOpen, setIsSocketContextMenuOpen] = useState(false);
  const [selectedSocket, setSelectedSocket] = useState<PPSocket | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState([0, 0]);
  const [graphToBeModified, setGraphToBeModified] =
    useState<IGraphSearch>(null); // id and name of graph to edit/delete
  const [showComments, setShowComments] = useState(false);
  const [nodeSearchActiveItem, setNodeSearchActiveItem] = useState<
    INodeSearch[]
  >([]);

  // dialogs
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteGraph, setShowDeleteGraph] = useState(false);
  const [showSharePlayground, setShowSharePlayground] = useState(false);

  let lastTimeTicked = 0;

  // get/set mouse position and also update debug text
  const setMousePosition = (mouseMoveEvent) => {
    const { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize } = (
      window.performance as any
    ).memory;
    mousePosition.x = mouseMoveEvent?.pageX ?? 0;
    mousePosition.y = mouseMoveEvent?.pageY ?? 0;
    const mouseWorld = viewport.current.toWorld(mousePosition);
    const mouseWorldX = Math.round(mouseWorld.x);
    const mouseWorldY = Math.round(mouseWorld.y);
    const viewportScreenX = Math.round(viewport.current.x);
    const viewportScreenY = Math.round(viewport.current.y);
    const viewportScale = roundNumber(viewport.current.scale.x);
    pixiDebugRef.text = `Mouse position: ${mousePosition.x}, ${mousePosition.y}
Mouse position world: ${mouseWorldX}, ${mouseWorldY}
Viewport position (scale): ${viewportScreenX}, ${Math.round(
      viewportScreenY,
    )} (${viewportScale})
Memory (heap, total, used in MB): ${(jsHeapSizeLimit / 1048576).toFixed(2)}, ${(totalJSHeapSize / 1048576).toFixed(2)}, ${(usedJSHeapSize / 1048576).toFixed(2)}`;
  };

  // react-dropzone
  const onDrop = useCallback((acceptedFiles, fileRejections, event) => {
    dragAndDrop(acceptedFiles, fileRejections, event);
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
    [isDragActive, isDragReject, isDragAccept],
  ) as any;

  useEffect(() => {
    console.log('isDragActive');
  }, [isDragActive]);

  // on mount
  useEffect(() => {
    console.time('main_app_mount');
    if (process.env.NODE_ENV !== 'development') {
      (async function () {
        const res = await fetch('/api/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const { sessionExpired } = await res.json();
        if (!sessionExpired) {
          setIsLoggedIn(true);
        }
      })();
    }

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
    pixiApp.current.stage.eventMode = 'static';
    pixiApp.current.stage.cursor = 'pointer';

    globalThis.__PIXI_APP__ = pixiApp.current;

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
      { passive: false },
    );

    // disable default context menu for pixi only
    pixiApp.current.view.addEventListener(
      'contextmenu',
      (e: Event) => {
        e.preventDefault();
      },
      { passive: false },
    );

    document.addEventListener('cut', cutOrCopyClipboard);
    document.addEventListener('copy', cutOrCopyClipboard);
    document.addEventListener('paste', pasteClipboard);

    window.addEventListener(
      'pointermove',
      (event: PIXI.FederatedPointerEvent) => {
        InterfaceController.notifyListeners(
          ListenEvent.GlobalPointerMove,
          event,
        );
        setMousePosition(event);
      },
    );

    window.addEventListener('popstate', () => {
      const urlParams = new URLSearchParams(window.location.search);
      loadGraph(urlParams);
    });

    // create viewport
    viewport.current = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: window.innerWidth,
      worldHeight: window.innerHeight,
      events: pixiApp.current.renderer.events,
    });
    viewport.current.name = 'pixiViewport';

    globalThis.__VIEWPORT__ = viewport.current;

    // add the viewport to the stage
    pixiApp.current.stage.addChild(viewport.current);

    // add global listen events to zoom
    viewport.current.addEventListener('zoomed', () =>
      InterfaceController.notifyListeners(ListenEvent.ViewportZoom, true),
    );
    viewport.current.addEventListener('zoomed-end', () =>
      InterfaceController.notifyListeners(ListenEvent.ViewportZoom, false),
    );

    viewport.current.addEventListener(
      'pointerupoutside',
      (event: PIXI.FederatedPointerEvent) =>
        InterfaceController.notifyListeners(
          ListenEvent.GlobalPointerUpAndUpOutside,
          event,
        ),
    );

    viewport.current.addEventListener(
      'pointerup',
      (event: PIXI.FederatedPointerEvent) => {
        InterfaceController.notifyListeners(
          ListenEvent.GlobalPointerUpAndUpOutside,
          event,
        );
      },
    );

    viewport.current.addEventListener(
      'pointerup',
      (event: PIXI.FederatedPointerEvent) => {
        InterfaceController.notifyListeners(ListenEvent.GlobalPointerUp, event);
      },
    );

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
    pixiContext.current.appendChild(pixiApp.current.view as any);

    // add background tiles
    const texture = PIXI.Texture.from(CANVAS_BACKGROUND_TEXTURE);
    const background = new PIXI.TilingSprite(
      texture,
      pixiApp.current.screen.width,
      pixiApp.current.screen.height,
    );
    background.tileScale.x = 0.5;
    background.tileScale.y = 0.5;
    viewport.current.addChild(background);
    viewport.current.addEventListener('moved', (event) => {
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
      gridUniforms,
    );
    const gridQuad = new PIXI.Mesh(geometry, gridShader);
    gridQuad.name = 'debugGrid';
    gridQuad.visible = showComments;
    viewport.current.addChild(gridQuad);

    // add graph to pixiApp
    PPGraph.currentGraph = new PPGraph(pixiApp.current, viewport.current);

    pixiApp.current.ticker.add(() => {
      const currentTime: number = new Date().getTime();
      const delta = currentTime - lastTimeTicked;
      lastTimeTicked = currentTime;
      PPGraph.currentGraph.tick(currentTime, delta);
    });

    // load plug and playground settings
    PPStorage.getInstance().applyGestureMode(viewport.current);

    const urlParams = new URLSearchParams(window.location.search);
    loadGraph(urlParams);

    console.log('PPGraph.currentGraph:', PPGraph.currentGraph);

    const toggleInputValue = (open) => (prev) => open ?? !prev;

    InterfaceController.toggleShowEdit = (open) =>
      setShowEdit(toggleInputValue(open));
    InterfaceController.toggleLeftSideDrawer = (open) =>
      setShowLeftSideDrawer(toggleInputValue(open));
    InterfaceController.toggleRightSideDrawer = (open) =>
      setShowRightSideDrawer(toggleInputValue(open));
    InterfaceController.toggleShowComments = (open) =>
      setShowComments(toggleInputValue(open));

    InterfaceController.openNodeSearch = openNodeSearch;
    InterfaceController.setIsNodeSearchVisible = setIsNodeSearchVisible;
    InterfaceController.setIsGraphContextMenuOpen = setIsGraphContextMenuOpen;
    InterfaceController.setIsNodeContextMenuOpen = setIsNodeContextMenuOpen;
    InterfaceController.setIsSocketContextMenuOpen = setIsSocketContextMenuOpen;

    InterfaceController.setGraphToBeModified = setGraphToBeModified;
    InterfaceController.setShowGraphDelete = setShowDeleteGraph;
    InterfaceController.setShowGraphEdit = setShowEdit;
    InterfaceController.setShowSharePlayground = setShowSharePlayground;
    InterfaceController.setNodeSearchActiveItem = setNodeSearchActiveItem;

    // register key events
    window.addEventListener('keydown', InterfaceController.keysDown);

    window.addEventListener('keydown', (e: KeyboardEvent) =>
      InputParser.parseKeyDown(e, PPGraph.currentGraph),
    );

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      InputParser.parseKeyUp(e);
    });

    // very hacky, but if we finish loading the graph while the window is hidden the nodes wont have information, so refresh when we tab in, this is only a problem for hybrid nodes
    window.addEventListener('visibilitychange', () => {
      setTimeout(() => {
        //console.log("firing viz change");
        const isVisible = document.visibilityState === 'visible';
        if (isVisible && PPGraph.currentGraph) {
          Object.values(PPGraph.currentGraph.nodes).forEach((node) =>
            node.refreshNodeDragOrViewportMove(),
          );
        }
      }, 100);
    });

    window.dispatchEvent(new Event('pointermove')); // to initialise event values
    console.timeEnd('main_app_mount');
    InterfaceController.spamToast('startup_complete');
  }, []);
  InterfaceController.showSnackBar = enqueueSnackbar;
  InterfaceController.hideSnackBar = closeSnackbar;

  useEffect(() => {
    // data has id and name
    const ids = [];
    ids.push(
      InterfaceController.addListener(ListenEvent.GraphChanged, (data: any) => {
        setGraphToBeModified(data as IGraphSearch);
      }),
    );

    InterfaceController.onOpenFileBrowser = open;

    InterfaceController.onRightClick = (
      event: PIXI.FederatedPointerEvent,
      target: PIXI.DisplayObject,
    ) => {
      setIsGraphContextMenuOpen(false);
      setIsNodeContextMenuOpen(false);
      setIsSocketContextMenuOpen(false);
      const contextMenuPosX = Math.min(
        window.innerWidth - (CONTEXTMENU_WIDTH + 8),
        event.global.x,
      );
      const contextMenuPosY = (offset: number) => {
        return Math.min(window.innerHeight - offset, event.global.y);
      };
      switch (true) {
        case target.parent instanceof PPSocket:
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
          setContextMenuPosition([
            contextMenuPosX,
            contextMenuPosY(CONTEXTMENU_GRAPH_HEIGHT + 8),
          ]);
          setIsGraphContextMenuOpen(true);
          break;
        case target instanceof PPSelection:
          setContextMenuPosition([
            Math.min(
              window.innerWidth - (CONTEXTMENU_WIDTH + 8),
              event.global.x,
            ),
            Math.min(window.innerHeight - 432, event.global.y),
          ]);
          setIsNodeContextMenuOpen(true);
          break;
        default:
          console.log('app right click, something else');
          break;
      }
    };

    return () => {
      ids.forEach((id) => InterfaceController.removeListener(id));
    };
  }, []);

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
        PPGraph.currentGraph.stopConnecting();
      }, 100);
    }
  }, [isNodeSearchVisible]);

  useEffect(() => {
    PPGraph.currentGraph.showComments = showComments;
    overlayCommentContainer.current.visible = showComments;
  }, [showComments]);

  function uploadGraph() {
    open();
  }

  const openNodeSearch = () => {
    console.log('openNodeSearch');
    const pos = mousePosition;
    if (pos !== undefined) {
      setContextMenuPosition([pos.x, pos.y]);
    }
    setIsNodeSearchVisible(true);
  };

  const nodeSearchInputBlurred = () => {
    console.log('nodeSearchInputBlurred');
    setIsNodeSearchVisible(false);
    PPGraph.currentGraph.selectedSocket = null;
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
          {`${nodeSearchCountRef.current} of ${
            Object.keys(getAllNodeTypes()).length
          }`}
        </Box>
        {children}
      </Paper>
    );
  };

  const toReturn = (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div
        // close open context menu again on click
        onClick={() => {
          setIsGraphContextMenuOpen(false);
          setIsNodeContextMenuOpen(false);
          setIsSocketContextMenuOpen(false);
        }}
        style={{
          overflow: 'hidden',
          width: '100%',
          height: '100vh',
        }}
      >
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          {!isPhone() && (
            <Tooltip
              pixiApp={pixiApp.current}
              isContextMenuOpen={
                isGraphContextMenuOpen ||
                isNodeContextMenuOpen ||
                isSocketContextMenuOpen
              }
            />
          )}
          <ShareDialog
            showSharePlayground={showSharePlayground}
            setShowSharePlayground={setShowSharePlayground}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
          <DeleteConfirmationDialog
            showDeleteGraph={showDeleteGraph}
            setShowDeleteGraph={setShowDeleteGraph}
            graphToBeModified={graphToBeModified}
          />
          <EditDialog
            showEdit={showEdit}
            setShowEdit={setShowEdit}
            graphId={graphToBeModified?.id}
            graphName={graphToBeModified?.name}
          />
          {isGraphContextMenuOpen && (
            <GraphContextMenu
              controlOrMetaKey={controlOrMetaKey()}
              contextMenuPosition={contextMenuPosition}
              setShowEdit={setShowEdit}
              uploadGraph={uploadGraph}
              showComments={showComments}
              setShowComments={setShowComments}
              zoomToFitNodes={zoomToFitNodes}
              setShowSharePlayground={setShowSharePlayground}
              isLoggedIn={isLoggedIn}
            />
          )}
          {isNodeContextMenuOpen && (
            <NodeContextMenu
              controlOrMetaKey={controlOrMetaKey()}
              contextMenuPosition={contextMenuPosition}
              currentGraph={PPGraph.currentGraph}
              openNodeSearch={openNodeSearch}
              zoomToFitSelection={zoomToFitNodes}
            />
          )}
          {isSocketContextMenuOpen && (
            <SocketContextMenu
              controlOrMetaKey={controlOrMetaKey()}
              contextMenuPosition={contextMenuPosition}
              currentGraph={PPGraph.currentGraph}
              selectedSocket={selectedSocket}
            />
          )}
          <PixiContainer ref={pixiContext} />
          <GraphOverlay
            setContextMenuPosition={setContextMenuPosition}
            setIsGraphContextMenuOpen={setIsGraphContextMenuOpen}
            toggle={showRightSideDrawer}
            toggleLeft={showLeftSideDrawer}
            currentGraph={PPGraph.currentGraph}
            randomMainColor={RANDOMMAINCOLOR}
          />
          {PPGraph.currentGraph && (
            <div
              style={{
                visibility: isNodeSearchVisible ? undefined : 'hidden',
                position: 'relative',
                left: `${contextMenuPosition[0]}px`,
                top: `${contextMenuPosition[1]}px`,
              }}
            >
              <Autocomplete
                id="node-search"
                ListboxProps={{ style: { maxHeight: '50vh' } }}
                sx={{
                  maxWidth: '50vw',
                  width: '400px',
                  minWidth: '200px',
                  [theme.breakpoints.down('sm')]: {
                    maxWidth: '90vw',
                    width: '90vw',
                  },
                }}
                freeSolo
                openOnFocus
                selectOnFocus
                autoHighlight
                clearOnBlur
                autoComplete
                // open
                disablePortal
                defaultValue={null}
                isOptionEqualToValue={(option, value) =>
                  option.title === value.title
                }
                value={null}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.name
                }
                groupBy={(option) => option.group}
                options={getNodes(nodeSearchActiveItem)}
                onChange={PPGraph.currentGraph.addOrReplaceNode}
                filterOptions={(options, state) => {
                  const filteredOptions = filterOptionsNode(options, state);
                  nodeSearchCountRef.current = filteredOptions.length;
                  return filteredOptions;
                }}
                renderOption={renderNodeItem}
                renderInput={(props) => (
                  <NodeSearchInput
                    {...props}
                    inputRef={nodeSearchInput}
                    randomMainColor={RANDOMMAINCOLOR}
                  />
                )}
                renderGroup={renderGroupItem}
                PaperComponent={ResultsWithHeader}
              />
            </div>
          )}
        </div>
        <div
          id="portal"
          style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999 }}
        />
      </div>
    </ErrorBoundary>
  );
  return toReturn;
};

export default App;

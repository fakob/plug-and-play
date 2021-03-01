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
import fs from 'fs';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Alignment, Button, MenuItem, Navbar } from '@blueprintjs/core';
import { Omnibar, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import InspectorContainer from './InspectorContainer';
import PixiContainer from './PixiContainer';
import { GraphDatabase } from './indexedDB';
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
import PPNode from './NodeClass';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

const ffmpeg = createFFmpeg({
  log: true,
  corePath: './node_modules/@ffmpeg/core/dist/ffmpeg-core.js',
});
(async () => {
  await ffmpeg.load();
})();

const NodeSearch = Omnibar.ofType<INodes>();

const App = (): JSX.Element => {
  const db = new GraphDatabase();
  const pixiApp = useRef<PIXI.Application | null>(null);
  const currentGraph = useRef<PPGraph | null>(null);
  const runGraph = useRef<boolean>(false);
  const pixiContext = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCurrentGraphLoaded, setIsCurrentGraphLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedNode, setSelectedNode] = useState<PPNode | null>(null);

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
      switch (extension) {
        case 'txt':
          fetch(objectURL)
            .then((r) => {
              console.log(r);
              return r.text();
            })
            .then((data) => {
              console.log(data);
              const newNode = currentGraph.current.createAndAddNode('Note');
              (newNode as any).setCleanText(data);
            });
          break;
        case 'jpg':
        case 'png':
          currentGraph.current.createAndAddNode('PPImage', '', {
            objectURL,
          });
          break;
        case 'mp4':
          (async () => {
            // await ffmpeg.load();
            ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(objectURL));
            await ffmpeg.run(
              '-ss', // seek position (start)
              '00:00:00',
              '-i', // input file url
              'test.mp4',
              '-vf', // create video filtergraph
              'scale=-2:200', // scale w:h
              // '-c:v', // encoder
              // 'png'
              '-f', // force input or output file format
              'image2',
              '-vframes', // number of video frames to output
              '1',
              '-q:v', // quality video stream
              '10',
              'output.png'
            );
            const data = ffmpeg.FS('readFile', 'output.png');
            const objectUrlFromStill = URL.createObjectURL(
              new Blob([data.buffer], { type: 'image/png' })
            );
            ffmpeg.FS('unlink', 'test.mp4');
            console.log(objectUrlFromStill);
            currentGraph.current.createAndAddNode('PPImage', '', {
              objectURL: objectUrlFromStill,
            });
          })();
          break;
        default:
          break;
      }
    });
  }, []);
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
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
      if (runGraph.current) {
        currentGraph.current.runStep();
      }
    });

    loadCurrentGraph();
    setIsCurrentGraphLoaded(true);
    console.log('currentGraph.current:', currentGraph.current);

    // register callbacks
    currentGraph.current.onSelectionChange = (selectedNodes: string[]) => {
      console.log(selectedNodes);
      if (selectedNodes.length === 0) {
        setSelectedNode(null);
      } else {
        selectedNodes.forEach((nodeId) => {
          console.log(
            currentGraph.current.nodes.find((node) => node.id === nodeId)
          );
          setSelectedNode(
            currentGraph.current.nodes.find((node) => node.id === nodeId)
          );
        });
      }
    };

    // register key events
    const keysDown = (e: KeyboardEvent): void => {
      console.log(e);
      console.log(e.key);
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsOpen((prevState) => !prevState);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', keysDown.bind(this));

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

  // useEffect(() => {
  //   console.log(selectedNode);
  //   if (selectedNode) {
  //     const selectedNodeType = selectedNode.type;
  //     const codeString = currentGraph.current.customNodeTypes[selectedNodeType];
  //     console.log(codeString);
  //     setEditorData(codeString || '');
  //     currentGraph.current.showComments = showComments;
  //   }
  // }, [selectedNode]);

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
    currentGraph.current.createAndAddNode(selected.title);
    setIsOpen(false);
  };

  return (
    <div>
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        {/* </div> */}
        <PixiContainer ref={pixiContext} />
        {selectedNode && (
          <InspectorContainer
            currentGraph={currentGraph.current}
            selectedNode={selectedNode}
            onSave={createOrUpdateNodeFromCode}
          />
        )}
        <Navbar className="bp3-dark">
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading>Plug and Playground</Navbar.Heading>
            <Navbar.Divider />
            <Button
              onClick={() => {
                setIsOpen((prevState) => !prevState);
              }}
              icon="search"
            >
              Search nodes
            </Button>
            <Button
              onClick={() => {
                currentGraph.current.runStep();
              }}
            >
              Run step
            </Button>
            <Button
              onClick={() => {
                runGraph.current = !runGraph.current;
              }}
            >
              {runGraph.current ? 'Stop' : 'Run'}
            </Button>
            <Button
              onClick={() => {
                currentGraph.current.duplicateSelection();
              }}
            >
              Duplicate selection
            </Button>
            <Button
              onClick={() => {
                serializeGraph();
              }}
            >
              Save graph
            </Button>
            <Button
              onClick={() => {
                loadCurrentGraph();
              }}
            >
              Load graph
            </Button>
            <Button
              onClick={() => {
                setShowComments((prevState) => !prevState);
              }}
            >
              {showComments ? 'Hide Comments' : 'Show Comments'}
            </Button>
            <Button
              onClick={() => {
                createOrUpdateNodeFromCode(DEFAULT_EDITOR_DATA);
              }}
            >
              Add custom node
            </Button>
          </Navbar.Group>
        </Navbar>
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

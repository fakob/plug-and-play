import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Grid, ThemeProvider, Typography } from '@mui/material';
import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import { ErrorBoundary } from 'react-error-boundary';
import InterfaceController from '../../InterfaceController';
import PPStorage from '../../PPStorage';
import ErrorFallback from '../../components/ErrorFallback';
import PPGraph from '../../classes/GraphClass';
import PPSocket from '../../classes/SocketClass';
import HybridNode2 from '../../classes/HybridNode2';
import { StringType } from '../datatypes/stringType';
import { TriggerType } from '../datatypes/triggerType';
import { ImageType } from '../datatypes/imageType';
import { ArrayType } from '../datatypes/arrayType';

import { TNodeSource, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
  customTheme,
} from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { BooleanType } from '../datatypes/booleanType';
import { NumberType } from '../datatypes/numberType';

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number }
) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

export const inputResourceIdSocketName = 'Local resource ID';
export const inputFileNameSocketName = 'File name';
const getFrameSocketName = 'Get current frame';
const getFramesIntervalSocketName = 'Get frames (interval)';
const intervalSocketName = 'Interval (s)';
const getFramesCountSocketName = 'Get frames (count)';
const countSocketName = 'Count';
const transcodeSocketName = 'Transcode video';
const playSocketName = 'Play/Pause';
const loopSocketName = 'Loop';
const speedSocketName = 'Speed';
const muteSocketName = 'Mute';
const volumeSocketName = 'Volume';
const posTimeSocketName = 'Position (s)';
const posPercSocketName = 'Position (%)';
const outputDetailsSocketName = 'Details';
const outputSocketName = 'Frame';
const outputArraySocketName = 'FrameArray';

const IMPORT_NAME = [
  '@editorjs/editorjs',
  '@editorjs/header',
  '@editorjs/image',
  '@editorjs/code',
  '@editorjs/list',
  '@editorjs/delimiter',
  '@editorjs/table',
  '@editorjs/warning',
  '@editorjs/checklist',
  '@editorjs/link',
  '@editorjs/raw',
  '@editorjs/embed',
  '@editorjs/inline-code',
  '@editorjs/marker',
];

const EDITOR_ID = 'Editorjs';

export class TextEditor2 extends HybridNode2 {
  module;
  editor;
  Header;
  Image;
  CodeTool;
  List;
  Delimiter;
  Table;
  Warning;
  Checklist;
  LinkTool;
  RawTool;
  Embed;
  InlineCode;
  Marker;

  public getName(): string {
    return 'TT';
  }

  public getDescription(): string {
    return 'A better text editor';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  public hasExample(): boolean {
    return true;
  }

  getShowLabels(): boolean {
    return false;
  }

  getOpacity(): number {
    return 0.01;
  }

  getPreferredInputSocketName(): string {
    return inputResourceIdSocketName;
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.IN,
        inputResourceIdSocketName,
        new StringType(),
        '',
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputFileNameSocketName,
        new StringType(),
        '',
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        playSocketName,
        new BooleanType(),
        true,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        loopSocketName,
        new BooleanType(),
        true,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        speedSocketName,
        new NumberType(false, 0, 10),
        1.0,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        muteSocketName,
        new BooleanType(),
        false,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        volumeSocketName,
        new NumberType(false, 0, 1),
        1.0,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        posTimeSocketName,
        new NumberType(),
        undefined,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        posPercSocketName,
        new NumberType(false, 0, 100),
        undefined,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        transcodeSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'transcode'),
        0,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        getFrameSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'getFrame'),
        0,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        getFramesIntervalSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'getFramesInterval'),
        0,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        intervalSocketName,
        new NumberType(false, 1, 100),
        10,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        getFramesCountSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'getFramesCount'),
        0,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        countSocketName,
        new NumberType(false, 1, 100),
        10,
        false
      ),
      new PPSocket(SOCKET_TYPE.OUT, outputSocketName, new ImageType()),
      new PPSocket(
        SOCKET_TYPE.OUT,
        outputArraySocketName,
        new ArrayType(),
        [],
        false
      ),
      new PPSocket(SOCKET_TYPE.OUT, outputDetailsSocketName, new JSONType()),
    ];
  }

  public getMinNodeHeight(): number {
    return 30;
  }

  public getDefaultNodeWidth(): number {
    return 400;
  }

  public getDefaultNodeHeight(): number {
    return 200;
  }

  public onNodeAdded = async (source?: TNodeSource): Promise<void> => {
    this.module = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[0]].default;
    this.Header = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[1]].default;
    this.Image = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[2]].default;
    this.CodeTool = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[3]].default;
    this.List = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[4]].default;
    this.Delimiter =
      PPGraph.currentGraph.dynamicImports[IMPORT_NAME[5]].default;
    this.Table = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[6]].default;
    this.Warning = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[7]].default;
    this.Checklist =
      PPGraph.currentGraph.dynamicImports[IMPORT_NAME[8]].default;
    this.LinkTool = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[9]].default;
    this.RawTool = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[10]].default;
    this.Embed = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[11]].default;
    this.InlineCode =
      PPGraph.currentGraph.dynamicImports[IMPORT_NAME[12]].default;
    this.Marker = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[13]].default;
    console.log(this.module);

    super.onNodeAdded(source);
  };

  public getDynamicImports(): string[] {
    return [...IMPORT_NAME];
  }

  // small presentational component
  protected getParentComponent(props: any): any {
    const node = props.node;
    const [isModuleLoaded, setIsModuleLoaded] = useState(false);

    useEffect(() => {
      console.log(node.module, node.Header, node.Image);
      if (node.module) {
        node.editor = new node.module({
          logLevel: 'VERBOSE',
          holder: `${EDITOR_ID}-${node.id}`,
          onReady: () => {
            setIsModuleLoaded(true);
            console.log('Editor.js is ready to work!');
          },
          onChange: (api, event) => {
            console.log("Now I know that Editor's content changed!", event);
          },
          // defaultBlock: 'myOwnParagraph',
          placeholder: 'Let`s write an awesome story!',
          // readOnly: true,
          tools: {
            header: {
              class: node.Header,
              // inlineToolbar: true,
              inlineToolbar: ['marker', 'inlineCode'],
              config: {
                placeholder: '',
              },
            },

            // // image: {
            // //   class: node.Image,
            // //   inlineToolbar: true,
            // //   config: {
            // //     types: 'image/*, video/mp4',
            // //     endpoints: {
            // //       byFile: '/api/transport/image',
            // //       byUrl: '/api/transport/fetch',
            // //     },
            // //   },
            // // },

            // // linkTool: {
            // //   class: node.LinkTool,
            // //   config: {
            // //     endpoint: '/api/fetchUrl',
            // //   },
            // // },

            // // code: {
            // //   class: node.CodeTool,
            // //   shortcut: 'CMD+SHIFT+D',
            // // },

            // // list: {
            // //   class: node.List,
            // //   inlineToolbar: true,
            // // },

            // // delimiter: node.Delimiter,

            // // table: {
            // //   class: node.Table,
            // //   inlineToolbar: true,
            // // },

            // // warning: {
            // //   class: node.Warning,
            // //   inlineToolbar: true,
            // // },

            // // checklist: {
            // //   class: node.Checklist,
            // //   inlineToolbar: true,
            // // },

            // /**
            //  * Inline Tools
            //  */
            // // inlineCode: {
            // //   class: node.InlineCode,
            // //   shortcut: 'CMD+SHIFT+C',
            // // },

            // // marker: {
            // //   class: node.Marker,
            // //   shortcut: 'CMD+SHIFT+M',
            // // },

            // // raw: node.RawTool,

            // // embed: node.Embed,
          },
          data: {
            // blocks: [
            //   {
            //     type: 'paragraph',
            //     data: { text: '<p>a</p>' },
            //   },
            // ],
          },
        });
      }
    }, [node.module]);

    // useEffect(() => {
    //   if (props.doubleClicked) {
    //     node.editor.readOnly.toggle();
    //   }
    // }, [props.doubleClicked]);

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider theme={customTheme}>
          <Box
            sx={{
              bgcolor: 'background.paper',
            }}
            id={`${EDITOR_ID}-${node.id}`}
          >
            {/* <Grid
              container
              alignItems="center"
              justifyContent="center"
              direction="column"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                pointerEvents: 'none',
              }}
            >
              {progress !== 100 && (
                <>
                  <CircularProgressWithLabel value={progress} />
                  <Button
                    sx={{
                      pointerEvents: 'auto',
                    }}
                    variant="text"
                    onClick={() => {
                      node.restartWorker();
                      setProgress(100);
                      waitForWorkerBeingLoaded();
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {!videoSrc && (
                <Button
                  sx={{
                    pointerEvents: 'auto',
                  }}
                  variant="outlined"
                  onClick={() => {
                    PPGraph.currentGraph.selection.selectNodes(
                      [node],
                      false,
                      true
                    );
                    InterfaceController.onOpenFileBrowser();
                  }}
                >
                  Select video
                </Button>
              )}
            </Grid> */}
          </Box>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}

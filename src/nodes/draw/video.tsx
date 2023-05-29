import React, { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from '@mui/material';
import { Box, Typography } from '@mui/material';
import LinearProgress, {
  LinearProgressProps,
} from '@mui/material/LinearProgress';
import { ErrorBoundary } from 'react-error-boundary';
import PPStorage from '../../PPStorage';
import ErrorFallback from '../../components/ErrorFallback';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import PPSocket from '../../classes/SocketClass';
import HybridNode2 from '../../classes/HybridNode2';
import { StringType } from '../datatypes/stringType';
import { VideoType } from '../datatypes/videoType';

import { CustomArgs, TNodeSource, TRgba } from '../../utils/interfaces';
import { ensureVisible } from '../../pixi/utils-pixi';
import {
  DRAGANDDROP_GRID_MARGIN,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  customTheme,
} from '../../utils/constants';

function LinearProgressWithLabel(
  props: LinearProgressProps & { value: number }
) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

const inputSocketName = 'Video';
const inputPathName = 'Path';

export class Video extends HybridNode2 {
  worker: Worker;

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    // if (this.initialData) {
    //   this.setInputData(inputSocketName, this.initialData);
    // }
  }

  public getName(): string {
    return 'Video player';
  }

  public getDescription(): string {
    return 'Plays a video';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  getShowLabels(): boolean {
    return false;
  }

  getOpacity(): number {
    return 0.01;
  }

  // getPreferredInputSocketName(): string {
  //   return inputSocketName;
  // }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.IN, inputPathName, new StringType(), '', false),
      new PPSocket(SOCKET_TYPE.OUT, inputSocketName, new VideoType()),
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
    this.worker = new Worker(
      new URL(
        /* webpackIgnore: true */ './ffmpeg.worker.js',
        import.meta.url
      ).href
    );
    console.log(this.worker);

    super.onNodeAdded(source);
  };

  onRemoved(): void {
    super.onRemoved();
    this.worker.terminate();
  }

  // protected getActivateByDoubleClick(): boolean {
  //   return false;
  // }

  // small presentational component
  protected getParentComponent(props: any): any {
    const resizeObserver = useRef(null);
    const videoRef = useRef();
    const node = props.node;
    let nodePosX = node.x + node.nodeWidth;
    const newNodeSelection: PPNode[] = [];

    const [progress, setProgress] = useState(0);
    const [path, setPath] = useState(props[inputPathName]);
    const [videoSrc, setVideoSrc] = useState(props[inputSocketName]);
    const [contentHeight, setContentHeight] = useState(0);

    const loadResource = async () => {
      return await PPStorage.getInstance().loadResource(path);
    };

    useEffect(() => {
      const waitForWorker = () => {
        if (node.worker) {
          node.worker.onmessage = (event) => {
            const { data } = event;
            switch (data.type) {
              case 'result':
                console.log('Complete transcoding');
                const videoSrc = URL.createObjectURL(
                  new Blob([data.buffer], { type: 'video/mp4' })
                );
                console.timeEnd('createObjectURL');
                console.timeEnd('loadMovie');

                console.log(videoSrc);
                setVideoSrc(videoSrc);
                break;
              case 'frame':
                console.log('Complete one frame');
                const base64 = arrayBufferToBase64(data.buffer);
                const newNode = PPGraph.currentGraph.addNewNode('Image', {
                  nodePosX,
                  nodePosY: node.y,
                  defaultArguments: {
                    Image: base64,
                  },
                });
                newNodeSelection.push(newNode);
                nodePosX =
                  nodePosX + newNode.nodeWidth + DRAGANDDROP_GRID_MARGIN;
                if (data.isLast) {
                  // select the newly added nodes
                  if (newNodeSelection.length > 0) {
                    PPGraph.currentGraph.selection.selectNodes(
                      newNodeSelection
                    );
                    ensureVisible(PPGraph.currentGraph.selection.selectedNodes);
                  }
                }
                break;
              case 'progress':
                setProgress(Math.ceil(data.data * 100));
              default:
                break;
            }
          };
          node.worker.onerror = (error) => console.error(error);
        } else {
          console.log('wait');
          setTimeout(waitForWorker, 100);
        }
      };
      waitForWorker();

      if (videoRef.current) {
        (videoRef.current as any).loop = true;
        (videoRef.current as any).addEventListener('error', () => {
          console.error(`Error loading: ${path}`);
        });
        loadResource().then((blob) => {
          console.log(blob);
          setVideoSrc(URL.createObjectURL(blob));
        });
      }

      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.borderBoxSize[0].blockSize);
        }
      });
      const target = document.getElementById('video');
      resizeObserver.current.observe(target);

      return () => resizeObserver.current.unobserve(target);
    }, []);

    useEffect(() => {
      node.resizeAndDraw(node.nodeWidth, contentHeight);
    }, [contentHeight]);

    useEffect(() => {
      console.log('inputSocketName has changed');
      loadResource().then((blob) => {
        console.log(blob);
        setVideoSrc(URL.createObjectURL(blob));
      });

      const waitForWorker = () => {
        if (node.worker) {
          const buffer = props[inputSocketName].buffer;

          const loadMovie = async () => {
            const oldName = path.split('.');
            const inType = oldName.pop();
            const name = oldName.join();
            const outType = 'mp4';
            console.log(name, inType, outType);

            node.worker.postMessage(
              { name, type: 'getStills', inType, outType, buffer },
              [buffer]
            );

            console.log('Start transcoding');
          };

          loadMovie(); // Call the async function immediately

          // update output
          node.setOutputData(inputSocketName, props[inputSocketName]);
          node.executeChildren();
        } else {
          console.log('wait');
          setTimeout(waitForWorker, 100);
        }
      };

      // waitForWorker();
    }, [props[inputSocketName]]);

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider theme={customTheme}>
          <LinearProgressWithLabel value={progress} />
          <video
            autoPlay
            id="video"
            ref={videoRef}
            style={{ width: '100%' }}
            src={videoSrc}
            controls
          ></video>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:image/png;base64,' + window.btoa(binary);
}

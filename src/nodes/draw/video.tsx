import React, { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from '@mui/material';
import { Box, Button, Grid, Typography } from '@mui/material';
import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import { ErrorBoundary } from 'react-error-boundary';
import InterfaceController from '../../InterfaceController';
import PPStorage from '../../PPStorage';
import ErrorFallback from '../../components/ErrorFallback';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import PPSocket from '../../classes/SocketClass';
import HybridNode2 from '../../classes/HybridNode2';
import { StringType } from '../datatypes/stringType';
import { TriggerType } from '../datatypes/triggerType';
import { VideoType } from '../datatypes/videoType';

import { CustomArgs, TNodeSource, TRgba } from '../../utils/interfaces';
import { ensureVisible } from '../../pixi/utils-pixi';
import {
  DRAGANDDROP_GRID_MARGIN,
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
const getMultipleFramesSocketName = 'Get multiple frames';
const transcodeSocketName = 'Transcode video';
const playSocketName = 'Play/Pause';
const loopSocketName = 'Loop';
const speedSocketName = 'Speed';
const muteSocketName = 'Mute';
const volumeSocketName = 'Volume';
const posTimeSocketName = 'Position (s)';
const posPercSocketName = 'Position (%)';
const outputDetailsSocketName = 'Details';
const outputSocketName = 'Still';

export class Video extends HybridNode2 {
  worker: Worker;
  eventTarget: EventTarget;

  public getName(): string {
    return 'Video player';
  }

  public getDescription(): string {
    return 'Play a video or grab a frame. The video is stored locally.';
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
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        loopSocketName,
        new BooleanType(),
        true,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        speedSocketName,
        new NumberType(false, 0, 10),
        1.0,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        muteSocketName,
        new BooleanType(),
        false,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        volumeSocketName,
        new NumberType(false, 0, 1),
        1.0,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        posTimeSocketName,
        new NumberType(),
        undefined,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        posPercSocketName,
        new NumberType(false, 0, 100),
        undefined,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        transcodeSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'transcode'),
        0,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        getMultipleFramesSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'getMultipleFrames'),
        0,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        getFrameSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'getFrame'),
        0,
        true
      ),
      new PPSocket(SOCKET_TYPE.OUT, outputDetailsSocketName, new JSONType()),
      new PPSocket(SOCKET_TYPE.OUT, outputSocketName, new VideoType()),
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
    this.eventTarget = new EventTarget();

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

  updateAndExecute = (localResourceId: string, path: string): void => {
    this.setInputData(inputResourceIdSocketName, localResourceId);
    this.setInputData(inputFileNameSocketName, path);
    this.executeOptimizedChain();
  };

  loadResource = async (resourceId) => {
    return await PPStorage.getInstance().loadResource(resourceId);
  };

  transcode = async () => {
    await this.workerAction('transcode');
  };

  getMultipleFrames = async () => {
    // await this.workerAction('getMultipleFrames');
    this.eventTarget.dispatchEvent(new Event('getMultipleFrames'));
  };

  getFrame = async () => {
    this.eventTarget.dispatchEvent(new Event('getFrame'));
  };

  workerAction = async (type) => {
    const blob = await this.loadResource(
      this.getInputData(inputResourceIdSocketName)
    );
    const fileName = this.getInputData(inputFileNameSocketName);

    const waitForWorker = async () => {
      if (this.worker) {
        const buffer = await blob.arrayBuffer();
        const oldName = fileName.split('.');
        const inType = oldName.pop();
        const name = oldName.join();
        const outType = 'mp4';

        this.worker.postMessage({ name, type, inType, outType, buffer }, [
          buffer,
        ]);

        console.log(`Start ${type}`);
        this.executeChildren();
      } else {
        console.log('Wait');
        setTimeout(waitForWorker, 100);
      }
    };

    waitForWorker();
  };

  // small presentational component
  protected getParentComponent(props: any): any {
    const resizeObserver = useRef(null);
    const videoRef = useRef<HTMLVideoElement>();
    const node = props.node;
    let nodePosX = node.x + node.nodeWidth;
    const newNodeSelection: PPNode[] = [];

    const [progress, setProgress] = useState(100);
    const [path, setPath] = useState(props[inputFileNameSocketName]);
    const [videoSrc, setVideoSrc] = useState(undefined);
    const [contentHeight, setContentHeight] = useState(0);

    useEffect(() => {
      const waitForWorker = () => {
        if (node.worker) {
          node.worker.onmessage = (event) => {
            const { data } = event;
            switch (data.type) {
              case 'transcodingResult':
                console.log('Completed transcoding');
                const blob = new Blob([data.buffer], { type: 'video/mp4' });
                const size = blob.size;
                const localResourceId = `${data.name}-${size}`;
                PPStorage.getInstance().storeResource(
                  localResourceId,
                  size,
                  blob,
                  data.name
                );
                node.setInputData(inputResourceIdSocketName, localResourceId);
                console.timeEnd('createObjectURL');
                console.timeEnd('loadMovie');
                break;
              case 'frame':
                if (data.i === 0) {
                  // reset values
                  newNodeSelection.length = 0; // clear node selection
                  nodePosX = node.x + node.nodeWidth;
                }
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
                console.log(data);
                setProgress(Math.ceil(data.data * 100));
                break;
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
        // (videoRef.current as any).loop = true;
        videoRef.current.addEventListener('error', () => {
          console.error(`Error loading: ${path}`);
        });
        videoRef.current.addEventListener('loadedmetadata', () => {
          const details = {
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
            duration: videoRef.current.duration,
          };
          node.setOutputData(outputDetailsSocketName, details);
          node.executeChildren();
        });
      }

      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.borderBoxSize[0].blockSize);
        }
      });
      const videoTarget = document.getElementById(node.id);
      resizeObserver.current.observe(videoTarget);

      node.eventTarget.addEventListener('getMultipleFrames', () => {
        captureFrame();
      });
      node.eventTarget.addEventListener('getFrame', () => {
        captureFrame();
      });

      return () => resizeObserver.current.unobserve(videoTarget);
    }, []);

    const captureFrame = () => {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL('image/png');
      node.setOutputData(outputSocketName, base64Image);
      node.executeChildren();
    };

    useEffect(() => {
      node.resizeAndDraw(node.nodeWidth, contentHeight);
    }, [contentHeight]);

    useEffect(() => {
      if (props[inputResourceIdSocketName]) {
        node
          .loadResource(props[inputResourceIdSocketName])
          .then((blob) => {
            setVideoSrc(URL.createObjectURL(blob));
          })
          .catch((e) => {
            console.error(e.message);
          });
      }
    }, [props[inputResourceIdSocketName]]);

    useEffect(() => {
      if (videoRef.current) {
        if (props[playSocketName]) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
    }, [props[playSocketName]]);

    useEffect(() => {
      videoRef.current && (videoRef.current.loop = props[loopSocketName]);
    }, [props[loopSocketName]]);

    useEffect(() => {
      videoRef.current &&
        (videoRef.current.playbackRate = props[speedSocketName]);
    }, [props[speedSocketName]]);

    useEffect(() => {
      videoRef.current && (videoRef.current.muted = props[muteSocketName]);
    }, [props[muteSocketName]]);

    useEffect(() => {
      videoRef.current && (videoRef.current.volume = props[volumeSocketName]);
    }, [props[volumeSocketName]]);

    useEffect(() => {
      videoRef.current &&
        (videoRef.current.currentTime = props[posTimeSocketName]);
    }, [props[posTimeSocketName]]);

    useEffect(() => {
      if (videoRef.current && videoRef.current.duration) {
        videoRef.current.currentTime =
          (props[posPercSocketName] / 100) * videoRef.current.duration;
      }
    }, [props[posPercSocketName]]);

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider theme={customTheme}>
          <Box
            sx={{
              bgcolor: 'background.default',
            }}
          >
            <video
              autoPlay={props[playSocketName]}
              id={node.id}
              ref={videoRef}
              style={{
                width: '100%',
                opacity: progress !== 100 ? 0.3 : 1,
                visibility: videoSrc ? 'visible' : 'hidden',
              }}
              src={videoSrc}
              controls
            ></video>
            <Grid
              container
              alignItems="center"
              justifyContent="center"
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
                <CircularProgressWithLabel value={progress} />
              )}
              {!videoSrc && (
                <Button
                  sx={{
                    pointerEvents: 'auto',
                  }}
                  variant="outlined"
                  onClick={() => {
                    PPGraph.currentGraph.selection.selectNodes([node], false);
                    InterfaceController.onOpenFileBrowser();
                  }}
                >
                  Select video
                </Button>
              )}
            </Grid>
          </Box>
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

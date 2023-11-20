import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Grid, ThemeProvider, Typography } from '@mui/material';
import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import { ErrorBoundary } from 'react-error-boundary';
import InterfaceController, { ListenEvent } from '../../InterfaceController';
import PPStorage from '../../PPStorage';
import ErrorFallback from '../../components/ErrorFallback';
import PPGraph from '../../classes/GraphClass';
import PPSocket from '../../classes/SocketClass';
import HybridNode2 from '../../classes/HybridNode2';
import { FileType } from '../datatypes/fileType';
import { TriggerType } from '../datatypes/triggerType';
import { ImageType } from '../datatypes/imageType';
import { ArrayType } from '../datatypes/arrayType';

import { TNodeSource, TRgba } from '../../utils/interfaces';
import {
  constructLocalResourceId,
  getFileNameFromLocalResourceId,
} from '../../utils/utils';
import {
  LOADING_STATE,
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
  customTheme,
} from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { BooleanType } from '../datatypes/booleanType';
import { NumberType } from '../datatypes/numberType';

function CircularProgressWithLabel(
  props: CircularProgressProps & { variant: string; value?: number },
) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant={props.variant} {...props} />
      {props.value && (
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
      )}
    </Box>
  );
}

export const inputResourceIdSocketName = 'Local resource ID';
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

  public hasExample(): boolean {
    return true;
  }

  getShowLabels(): boolean {
    return false;
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
        new FileType([
          '3gp',
          'avi',
          'flv',
          'mov',
          'mkv',
          'm4v',
          'mp4',
          'ogg',
          'qt',
          'swf',
          'webm',
          'wmv',
        ]),
        '',
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        playSocketName,
        new BooleanType(),
        true,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        loopSocketName,
        new BooleanType(),
        true,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        speedSocketName,
        new NumberType(false, 0, 10),
        1.0,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        muteSocketName,
        new BooleanType(),
        false,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        volumeSocketName,
        new NumberType(false, 0, 1),
        1.0,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        posTimeSocketName,
        new NumberType(),
        undefined,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        posPercSocketName,
        new NumberType(false, 0, 100),
        undefined,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        transcodeSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'transcode'),
        0,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        getFrameSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'getFrame'),
        0,
        true,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        getFramesIntervalSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'getFramesInterval'),
        0,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        intervalSocketName,
        new NumberType(false, 1, 100),
        10,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        getFramesCountSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'getFramesCount'),
        0,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        countSocketName,
        new NumberType(false, 1, 100),
        10,
        false,
      ),
      new PPSocket(SOCKET_TYPE.OUT, outputSocketName, new ImageType()),
      new PPSocket(
        SOCKET_TYPE.OUT,
        outputArraySocketName,
        new ArrayType(),
        [],
        false,
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
    super.onNodeAdded(source);
    this.eventTarget = new EventTarget();

    this.restartWorker();
  };

  async onRemoved(): Promise<void> {
    await super.onRemoved();
    this.worker.terminate();
  }

  restartWorker(): void {
    this.worker?.terminate();
    this.worker = new Worker(
      new URL(
        /* webpackIgnore: true */ './ffmpeg.worker.js',
        import.meta.url,
      ).href,
    );
  }

  updateAndExecute = (localResourceId: string): void => {
    this.setInputData(inputResourceIdSocketName, localResourceId);
    this.executeOptimizedChain().catch((error) => {
      console.error(error);
    });
  };

  loadResource = async (resourceId) => {
    return await PPStorage.getInstance().loadResource(resourceId);
  };

  transcode = async () => {
    await this.workerAction('transcode');
  };

  getFramesInterval = async () => {
    this.eventTarget.dispatchEvent(new Event('getFramesInterval'));
  };

  getFramesCount = async () => {
    this.eventTarget.dispatchEvent(new Event('getFramesCount'));
  };

  getFrame = async () => {
    this.eventTarget.dispatchEvent(new Event('getFrame'));
  };

  workerAction = async (type) => {
    const localResourceId = this.getInputData(inputResourceIdSocketName);
    const blob = await this.loadResource(localResourceId);
    const fileName = getFileNameFromLocalResourceId(localResourceId);

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

        await this.executeChildren();
      } else {
        setTimeout(waitForWorker, 100);
      }
    };

    await waitForWorker();
  };

  // small presentational component
  protected getParentComponent(props: any): React.ReactElement {
    const resizeObserver = useRef(null);
    const videoRef = useRef<HTMLVideoElement>();
    const node = props.node;

    const [progress, setProgress] = useState(100);
    const [localResourceId, setLocalResourceId] = useState(
      props[inputResourceIdSocketName],
    );
    const [videoSrc, setVideoSrc] = useState(undefined);
    const [contentHeight, setContentHeight] = useState(0);
    const [loadingState, setLoadingState] = useState(LOADING_STATE.ISLOADING);

    const waitForWorkerBeingLoaded = () => {
      if (node.worker) {
        node.worker.onmessage = (event) => {
          const { data } = event;
          switch (data.type) {
            case 'transcodingResult':
              const blob = new Blob([data.buffer], { type: 'video/mp4' });
              const size = blob.size;
              const newResourceId = constructLocalResourceId(data.name, size);
              PPStorage.getInstance().storeResource(
                newResourceId,
                size,
                blob,
                data.name,
              );
              node.setInputData(inputResourceIdSocketName, newResourceId);
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
        setTimeout(waitForWorkerBeingLoaded, 100);
      }
    };

    useEffect(() => {
      waitForWorkerBeingLoaded();

      if (videoRef.current) {
        videoRef.current.addEventListener('error', () => {
          console.error(`Error loading video`);
          setVideoSrc(undefined);
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

      node.eventTarget.addEventListener('getFrame', () => {
        captureCurrentFrame();
      });

      return () => resizeObserver.current.unobserve(videoTarget);
    }, []);

    const getCanvasAndContext = (): [
      HTMLCanvasElement,
      CanvasRenderingContext2D,
    ] => {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      return [canvas, context];
    };

    const captureFrame = () => {
      const [canvas, context] = getCanvasAndContext();
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL();
    };

    const captureCurrentFrame = () => {
      node.setOutputData(outputSocketName, captureFrame());
      node.executeChildren();
    };

    const captureMultipleFramesCount = useCallback(async () => {
      const interval =
        videoRef.current.duration / (Math.max(1, props[countSocketName]) * 1.0);
      await captureMultipleFrames(interval);
    }, [props[countSocketName]]);

    const captureMultipleFrames = async (interval: number) => {
      const [canvas, context] = getCanvasAndContext();

      const imageArray = [];
      node.setOutputData(outputArraySocketName, imageArray);

      let seekResolve;
      videoRef.current.addEventListener('seeked', async function () {
        if (seekResolve) seekResolve();
      });

      let currentTime = 0;
      const duration = videoRef.current.duration;

      while (currentTime <= duration) {
        videoRef.current.currentTime = currentTime;
        await new Promise((r) => (seekResolve = r));

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64ImageData = canvas.toDataURL();
        imageArray.push(base64ImageData);
        node.executeChildren();

        currentTime += interval;
      }
    };

    useEffect(() => {
      // needed in combination with useCallback
      node.eventTarget.addEventListener(
        'getFramesInterval',
        captureMultipleFramesInterval,
      );
      return () => {
        node.eventTarget.removeEventListener(
          'getFramesInterval',
          captureMultipleFramesInterval,
        );
      };
    }, [props[intervalSocketName]]);

    const captureMultipleFramesInterval = useCallback(async () => {
      await captureMultipleFrames(props[intervalSocketName]);
    }, [props[intervalSocketName]]);

    useEffect(() => {
      // needed in combination with useCallback
      node.eventTarget.addEventListener(
        'getFramesCount',
        captureMultipleFramesCount,
      );
      return () => {
        node.eventTarget.removeEventListener(
          'getFramesCount',
          captureMultipleFramesCount,
        );
      };
    }, [props[countSocketName]]);

    useEffect(() => {
      node.resizeAndDraw(node.nodeWidth, contentHeight);
    }, [contentHeight]);

    useEffect(() => {
      const resourceId = props[inputResourceIdSocketName];
      setLocalResourceId(resourceId);
      if (resourceId) {
        setLoadingState(LOADING_STATE.ISLOADING);
        node
          .loadResource(resourceId)
          .then((blob) => {
            if (blob) {
              setVideoSrc(URL.createObjectURL(blob));
              setLoadingState(LOADING_STATE.LOADED);
            } else {
              // video is being saved, listen to the ResourceUpdated event
              const listenID = InterfaceController.addListener(
                ListenEvent.ResourceUpdated,
                (data: any) => {
                  if (data.id === resourceId) {
                    node
                      .loadResource(resourceId)
                      .then((blob) => {
                        setVideoSrc(URL.createObjectURL(blob));
                        setLoadingState(LOADING_STATE.LOADED);
                        InterfaceController.removeListener(listenID);
                      })
                      .catch((e) => {
                        console.error(e.message);
                        setLoadingState(LOADING_STATE.FAILED);
                      });
                  }
                },
              );
            }
          })
          .catch((e) => {
            console.error(e.message);
            setLoadingState(LOADING_STATE.FAILED);
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
      if (videoRef.current?.duration) {
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
              direction="column"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                pointerEvents: 'none',
                rowGap: '8px',
              }}
            >
              {progress !== 100 && (
                <>
                  <CircularProgressWithLabel
                    value={progress}
                    variant="determinate"
                  />
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
              <>
                {localResourceId &&
                  loadingState === LOADING_STATE.ISLOADING && (
                    <CircularProgressWithLabel variant="indeterminate" />
                  )}
                {localResourceId &&
                  !videoSrc &&
                  loadingState === LOADING_STATE.LOADED && (
                    <Button
                      sx={{
                        pointerEvents: 'auto',
                      }}
                      variant="outlined"
                      onClick={() => {
                        node.transcode();
                      }}
                    >
                      Transcode
                    </Button>
                  )}
                {loadingState === LOADING_STATE.ISLOADING && (
                  <Button
                    sx={{
                      pointerEvents: 'auto',
                    }}
                    variant="outlined"
                    onClick={() => {
                      PPGraph.currentGraph.selection.selectNodes(
                        [node],
                        false,
                        true,
                      );
                      InterfaceController.onOpenFileBrowser();
                    }}
                  >
                    Select video
                  </Button>
                )}
              </>
            </Grid>
          </Box>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}

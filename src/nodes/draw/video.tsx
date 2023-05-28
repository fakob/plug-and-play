import React, { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from '@mui/material';
import { Box, Typography } from '@mui/material';
import LinearProgress, {
  LinearProgressProps,
} from '@mui/material/LinearProgress';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import { VideoType } from '../datatypes/videoType';

import { CustomArgs, TNodeSource, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  customTheme,
} from '../../utils/constants';
import HybridNode2 from '../../classes/HybridNode2';

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

export class Video extends HybridNode2 {
  worker: Worker;

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    if (this.initialData) {
      this.setInputData(inputSocketName, this.initialData);
    }
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
    return 0.05;
  }

  getPreferredInputSocketName(): string {
    return inputSocketName;
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketName,
        new VideoType(),
        undefined,
        false
      ),
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
    if (process.env.NODE_ENV === 'development') {
      this.worker = new Worker(
        new URL('./ffmpeg.worker.js', import.meta.url).href
      );
    } else {
      this.worker = new Worker(
        new URL(
          /* webpackIgnore: true */ './ffmpeg.worker.js',
          import.meta.url
        ).href
      );
    }
    console.log(this.worker);

    super.onNodeAdded(source);
  };

  public onRemoved = (): void => {
    super.onRemoved();
    this.worker.terminate();
    // this.worker.removeEventListener('message', handleWorkerMessage);
  };

  // small presentational component
  protected getParentComponent(props: any): any {
    const resizeObserver = useRef(null);
    const videoRef = useRef();
    const node = props.node;
    const inName = 'importedVideo.mp4';

    const [progress, setProgress] = useState(0);
    const [dataURL, setDataURL] = useState(props[inputSocketName]);
    const [contentHeight, setContentHeight] = useState(0);

    // workaround to get ref of editor to be used as mounted/ready check
    useEffect(() => {
      const waitForVariable = () => {
        if (node.worker) {
          node.worker.onmessage = (event) => {
            const { data } = event;
            switch (data.type) {
              case 'result':
                console.log('Complete transcoding');
                const dataURLL = URL.createObjectURL(
                  new Blob([data.buffer], { type: 'video/mp4' })
                );
                console.timeEnd('createObjectURL');
                console.timeEnd('loadMovie');

                console.log(dataURLL);
                setDataURL(dataURLL);
                break;
              case 'progress':
                console.log(data);
                setProgress(Math.ceil(data * 100));
              default:
                break;
            }
          };
          node.worker.onerror = (error) => console.error(error);
        } else {
          console.log('wait');
          setTimeout(waitForVariable, 100);
        }
      };
      waitForVariable();

      if (videoRef.current) {
        (videoRef.current as any).loop = true;
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
      console.log('uint8Array has changed');

      const waitForVariable = () => {
        if (node.worker) {
          const buffer = props[inputSocketName].buffer;

          // ffmpeg.setProgress(({ ratio }) => {
          //   setProgress(Math.ceil(ratio * 100));
          //   console.log(ratio);
          // });

          const loadMovie = async () => {
            const oldName = inName.split('.');
            const inType = oldName.pop();
            const name = oldName.join();
            const outType = 'mp4';
            console.log(name, inType, outType);
            // console.log(buffer);

            node.worker.postMessage({ name, inType, outType, buffer }, [
              buffer,
            ]);

            console.log('Start transcoding');
          };

          loadMovie(); // Call the async function immediately

          // update output
          node.setOutputData(inputSocketName, props[inputSocketName]);
          node.executeChildren();
        } else {
          console.log('wait');
          setTimeout(waitForVariable, 100);
        }
      };

      waitForVariable();
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
            src={dataURL}
            controls
          ></video>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}

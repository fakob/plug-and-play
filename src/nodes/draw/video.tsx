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
  FFmpeg: any;

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
      new PPSocket(SOCKET_TYPE.IN, inputSocketName, new VideoType(), '', false),
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
    console.time('import');
    const packageName = '@ffmpeg/ffmpeg';
    const url = 'https://esm.sh/' + packageName;
    console.log(url);
    this.FFmpeg = await import(/* webpackIgnore: true */ url);
    console.log(this.FFmpeg);
    console.timeEnd('import');

    super.onNodeAdded(source);
  };

  // small presentational component
  protected getParentComponent(props: any): any {
    const resizeObserver = useRef(null);
    const videoRef = useRef();
    const node = props.node;
    const name = 'importedVideo.mp4';
    let ffmpeg;

    const [progress, setProgress] = useState(0);
    const [dataURL, setDataURL] = useState(props[inputSocketName]);
    const [contentHeight, setContentHeight] = useState(0);

    // workaround to get ref of editor to be used as mounted/ready check
    useEffect(() => {
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

    // on load
    useEffect(() => {
      console.log('useEffect node.FFmpeg triggered');
      if (node.FFmpeg) {
        const loadffmpeg = async () => {
          console.time('loadFFmpeg');
          const { createFFmpeg } = node.FFmpeg;
          ffmpeg = createFFmpeg({
            mainName: 'main',
            corePath:
              'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
            log: true,
          });
          try {
            console.log(ffmpeg);
            await ffmpeg.load();
          } catch (error) {
            // Handle any errors that occur during the asynchronous operations
            console.error('Error loading ffmpeg:', error);
          }
          console.timeEnd('loadFFmpeg');
        };

        loadffmpeg(); // Call the async function immediately
      }
    }, [node.FFmpeg]);

    useEffect(() => {
      console.log('uint8Array has changed');

      const waitForVariable = () => {
        if (ffmpeg.isLoaded()) {
          // Perform your desired operation with the variable
          console.log('myVariable is now defined:', ffmpeg.isLoaded());

          const uint8Array = props[inputSocketName];

          ffmpeg.setProgress(({ ratio }) => {
            setProgress(Math.ceil(ratio * 100));
            console.log(ratio);
          });

          const loadMovie = async () => {
            try {
              console.time('loadMovie');
              console.time('writeFile');
              ffmpeg.FS('writeFile', name, uint8Array);
              console.timeEnd('writeFile');

              console.log(ffmpeg.FS('stat', name));
              console.log(ffmpeg.FS('readdir', '/'));

              console.time('transcode');
              await ffmpeg.run('-i', name, 'output.mp4');
              console.timeEnd('transcode');

              console.time('readFile');
              const data = ffmpeg.FS('readFile', 'output.mp4', {
                encoding: 'binary',
              });
              console.timeEnd('readFile');
              console.time('createObjectURL');
              const dataURLL = URL.createObjectURL(
                new Blob([data.buffer], { type: 'video/mp4' })
              );
              console.timeEnd('createObjectURL');
              console.timeEnd('loadMovie');
              console.log(ffmpeg.FS('readdir', '/'));

              console.log(dataURLL);
              setDataURL(dataURLL);
              // if (videoRef.current) {
              //   (videoRef.current as any).src = URL.createObjectURL(
              //     new Blob([data.buffer], { type: 'video/mp4' })
              //   );
              // }
            } catch (error) {
              // Handle any errors that occur during the asynchronous operations
              console.error('Error loading movie:', error);
            }
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
          {dataURL && (
            <video
              id="video"
              ref={videoRef}
              style={{ width: '100%' }}
              src={dataURL}
              controls
            ></video>
          )}
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}

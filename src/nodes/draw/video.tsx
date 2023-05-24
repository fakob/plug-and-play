import React, { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import { MovieType } from '../datatypes/movieType';

import { CustomArgs, TNodeSource, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  customTheme,
} from '../../utils/constants';
import HybridNode2 from '../../classes/HybridNode2';

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
      new PPSocket(SOCKET_TYPE.IN, inputSocketName, new MovieType(), '', false),
      new PPSocket(SOCKET_TYPE.OUT, inputSocketName, new MovieType()),
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
    const packageName = '@ffmpeg/ffmpeg';
    const url = 'https://esm.sh/' + packageName;
    console.log(url);
    this.FFmpeg = await import(/* webpackIgnore: true */ url);
    console.log(this.FFmpeg);

    super.onNodeAdded(source);
  };

  // small presentational component
  protected getParentComponent(props: any): any {
    const videoRef = useRef();
    const node = props.node;
    const name = 'importedVideo.mp4';
    let ffmpeg;

    const [dataURL, setDataURL] = useState(props[inputSocketName]);

    // on load
    useEffect(() => {
      if (node.FFmpeg) {
        const loadffmpeg = async () => {
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
            console.log(ratio);
          });

          const loadMovie = async () => {
            try {
              ffmpeg.FS('writeFile', name, uint8Array);
              console.log(ffmpeg.FS('stat', name));
              console.log(ffmpeg.FS('readdir', '/'));
              await ffmpeg.run('-i', name, 'output.mp4');
              // const data = ffmpeg.FS('readFile', 'output.mp4');
              const data = ffmpeg.FS('readFile', 'output.mp4', {
                // const data = ffmpeg.FS('readFile', name, {
                encoding: 'binary',
              });
              const dataURLL = URL.createObjectURL(
                new Blob([data.buffer], { type: 'video/mp4' })
              );
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
          <video
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

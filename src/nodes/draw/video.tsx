import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import { CodeType } from '../datatypes/codeType';

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
      new PPSocket(SOCKET_TYPE.IN, inputSocketName, new CodeType(), '', false),
      new PPSocket(SOCKET_TYPE.OUT, inputSocketName, new CodeType(), '', true),
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
    this.FFmpeg = await import(url);
    console.log(this.FFmpeg);

    super.onNodeAdded(source);
  };

  // small presentational component
  protected getParentComponent(props: any): any {
    const node = props.node;
    const [dataURL, setDataURL] = useState(props[inputSocketName]);

    // on load
    useEffect(() => {}, []);

    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });
    const transcode = async ({ target: { files } }) => {
      const { name } = files[0];
      await ffmpeg.load();
      ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
      await ffmpeg.run('-i', name, 'output.mp4');
      const data = ffmpeg.FS('readFile', 'output.mp4');
      const video = document.getElementById('player');
      video.src = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' })
      );
    };

    useEffect(() => {
      console.log('dataURL has changed');
      setDataURL(props[inputSocketName]);
      // update output
      node.setOutputData(inputSocketName, props[inputSocketName]);
      node.executeChildren();
    }, [props[inputSocketName]]);

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider theme={customTheme}>
          <video style={{ width: '100%' }} src={dataURL} controls></video>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}

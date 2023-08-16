import React, { useEffect, useRef, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import * as perspective from '@finos/perspective';
import {
  PerspectiveViewerConfig,
  HTMLPerspectiveViewerElement,
} from '@finos/perspective-viewer';
import '@finos/perspective-viewer/dist/css/pro.css';
import ErrorFallback from '../../components/ErrorFallback';
import PPGraph from '../../classes/GraphClass';
import PPSocket from '../../classes/SocketClass';
import HybridNode2 from '../../classes/HybridNode2';

import { TNodeSource, TRgba } from '../../utils/interfaces';
import { NODE_TYPE_COLOR, customTheme } from '../../utils/constants';

export const inputResourceIdSocketName = 'Local resource ID';
export const inputFileNameSocketName = 'File name';

const perspectiveImports = [
  '@finos/perspective',
  '@finos/perspective-viewer',
  '@finos/perspective-viewer-datagrid',
  '@finos/perspective-viewer-d3fc',
];

const SCHEMA = {
  Title: 'string',
  'US Gross': 'float',
  'Worldwide Gross': 'float',
  'US DVD Sales': 'float',
  'Production Budget': 'float',
  'Release Date': 'date',
  'MPAA Rating': 'string',
  'Running Time min': 'integer',
  Distributor: 'string',
  Source: 'string',
  'Major Genre': 'string',
  'Creative Type': 'string',
  Director: 'string',
  'Rotten Tomatoes Rating': 'integer',
  'IMDB Rating': 'float',
  'IMDB Votes': 'integer',
};

const MOVIES_URL = 'https://vega.github.io/editor/data/movies.json';

// const datasource = async () => {
//   const request = fetch(MOVIES_URL);
//   const worker = perspective.worker();
//   const response = await request;
//   const json = await response.json();
//   for (const row of json) {
//     row['Release Date'] = row['Release Date']
//       ? new Date(row['Release Date']) || null
//       : null;
//   }
//   const table = await worker.table(SCHEMA);
//   table.update(json);
//   return table;
// };

export class Perspective extends HybridNode2 {
  perspective;
  worker;
  table;
  eventTarget: EventTarget;

  public getName(): string {
    return 'Perspective player';
  }

  public getDescription(): string {
    return '';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
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
    return [];
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
    this.perspective =
      PPGraph.currentGraph.dynamicImports['@finos/perspective'];

    console.log(this.perspective);
    this.worker = this.perspective.worker();
    // this.worker = this.perspective.default.shared_worker();

    super.onNodeAdded(source);
  };

  onRemoved(): void {
    super.onRemoved();
    this.worker.terminate();
  }

  public getDynamicImports(): string[] {
    return perspectiveImports;
  }

  getTable = async (): Promise<perspective.Table> => {
    const request = fetch(MOVIES_URL);
    const worker = this.perspective.worker();
    const response = await request;
    const json = await response.json();
    for (const row of json) {
      row['Release Date'] = row['Release Date']
        ? new Date(row['Release Date']) || null
        : null;
    }
    this.table = await worker.table(SCHEMA);
    this.table.update(json);
    return this.table;
  };

  // config: PerspectiveViewerConfig = {
  //   group_by: ['State'],
  // };

  // small presentational component
  protected getParentComponent(props: any): any {
    // const resizeObserver = useRef(null);
    // const videoRef = useRef<HTMLVideoElement>();
    // const node = props.node;

    // const [progress, setProgress] = useState(100);
    // const [path] = useState(props[inputFileNameSocketName]);
    // // const [videoSrc, setVideoSrc] = useState(undefined);
    // // const [contentHeight, setContentHeight] = useState(0);

    // const waitForWorkerBeingLoaded = () => {
    //   if (node.worker) {
    //     node.worker.onmessage = (event) => {
    //       const { data } = event;
    //       switch (data.type) {
    //         case 'transcodingResult':
    //           const blob = new Blob([data.buffer], { type: 'video/mp4' });
    //           const size = blob.size;
    //           const localResourceId = `${data.name}-${size}`;
    //           PPStorage.getInstance().storeResource(
    //             localResourceId,
    //             size,
    //             blob,
    //             data.name,
    //           );
    //           node.setInputData(inputResourceIdSocketName, localResourceId);
    //           break;
    //         case 'progress':
    //           console.log(data);
    //           setProgress(Math.ceil(data.data * 100));
    //           break;
    //         default:
    //           break;
    //       }
    //     };
    //     node.worker.onerror = (error) => console.error(error);
    //   } else {
    //     setTimeout(waitForWorkerBeingLoaded, 100);
    //   }
    // };

    // useEffect(() => {
    //   waitForWorkerBeingLoaded();

    //   if (videoRef.current) {
    //     videoRef.current.addEventListener('error', () => {
    //       console.error(`Error loading: ${path}`);
    //     });
    //     videoRef.current.addEventListener('loadedmetadata', () => {
    //       const details = {
    //         videoWidth: videoRef.current.videoWidth,
    //         videoHeight: videoRef.current.videoHeight,
    //         duration: videoRef.current.duration,
    //       };
    //       node.setOutputData(outputDetailsSocketName, details);
    //       node.executeChildren();
    //     });
    //   }

    //   resizeObserver.current = new ResizeObserver((entries) => {
    //     for (const entry of entries) {
    //       setContentHeight(entry.borderBoxSize[0].blockSize);
    //     }
    //   });
    //   const videoTarget = document.getElementById(node.id);
    //   resizeObserver.current.observe(videoTarget);

    //   return () => resizeObserver.current.unobserve(videoTarget);
    // }, []);
    const viewer = useRef<HTMLPerspectiveViewerElement>(null);

    React.useEffect(() => {
      props.node.getTable().then((table) => {
        if (viewer.current) {
          viewer.current.load(Promise.resolve(table));
          // viewer.current.restore(props.node.config);
        }
      });
    }, []);

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider theme={customTheme}>
          <Box
            sx={{
              bgcolor: 'background.default',
              height: '100%',
            }}
          >
            <perspective-viewer
              ref={viewer}
              style={{ height: '100%' }}
            ></perspective-viewer>
          </Box>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}

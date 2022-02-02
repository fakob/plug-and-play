import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Box } from '@mui/material';
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPSocket from '../classes/SocketClass';
import FloatingSocketInspector from './FloatingSocketInspector';
import ErrorFallback from './ErrorFallback';

type GraphOverlaySocketInspectorProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
};

const GraphOverlaySocketInspector: React.FunctionComponent<
  GraphOverlaySocketInspectorProps
> = (props) => {
  const [socketInspectorPosition, setSocketInspectorPosition] =
    useState<PIXI.Point>(new PIXI.Point(0, 0));
  const [socketToInspect, setSocketToInspect] = useState<PPSocket | undefined>(
    undefined
  );

  useEffect(() => {
    if (props.currentGraph) {
      // register callbacks when currentGraph mounted
      props.currentGraph.onOpenSocketInspector = (
        pos: PIXI.Point,
        socket: PPSocket
      ) => {
        openSocketInspector(pos, socket);
      };

      props.currentGraph.onCloseSocketInspector = () => {
        closeSocketInspector();
      };
    }
  }, [props.currentGraph]);

  const openSocketInspector = (pos = null, socket = null) => {
    console.log('openSocketInspector');
    setSocketInspectorPosition(pos);
    setSocketToInspect(socket);
  };

  const closeSocketInspector = () => {
    setSocketInspectorPosition(null);
    setSocketToInspect(null);
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box sx={{ position: 'relative' }}>
        {socketToInspect && (
          <FloatingSocketInspector
            socketInspectorPosition={socketInspectorPosition}
            socketToInspect={socketToInspect}
            randomMainColor={props.randomMainColor}
            closeSocketInspector={closeSocketInspector}
          />
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default GraphOverlaySocketInspector;

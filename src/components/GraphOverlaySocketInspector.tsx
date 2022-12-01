import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import * as PIXI from 'pixi.js';
import PPSocket from '../classes/SocketClass';
import FloatingSocketInspector from './FloatingSocketInspector';
import InterfaceController from '../InterfaceController';

type GraphOverlaySocketInspectorProps = {
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
    InterfaceController.onOpenSocketInspector = openSocketInspector;
    InterfaceController.onCloseSocketInspector = closeSocketInspector;
  });

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
    <Box sx={{ position: 'relative' }}>
      {socketToInspect && socketToInspect.parent && (
        <FloatingSocketInspector
          socketInspectorPosition={socketInspectorPosition}
          socketToInspect={socketToInspect}
          randomMainColor={props.randomMainColor}
          closeSocketInspector={closeSocketInspector}
        />
      )}
    </Box>
  );
};

export default GraphOverlaySocketInspector;

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
  const [socketsToInspect, setSocketsToInspect] = useState<PPSocket[]>([]);

  useEffect(() => {
    InterfaceController.onOpenSocketInspector = openSocketInspector;
    InterfaceController.onCloseSocketInspector = closeSocketInspector;
  });

  const openSocketInspector = (pos = null, socket = null) => {
    console.log('openSocketInspector', socketsToInspect);
    setSocketInspectorPosition(pos);
    setSocketsToInspect([...socketsToInspect, socket]);
  };

  const closeSocketInspector = () => {
    console.log('closeSocketInspector');
    setSocketInspectorPosition(null);
    setSocketsToInspect([]);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {socketsToInspect.length > 0 && socketsToInspect[0].getNode() && (
        <FloatingSocketInspector
          socketInspectorPosition={socketInspectorPosition}
          socketsToInspect={socketsToInspect}
          randomMainColor={props.randomMainColor}
          closeSocketInspector={closeSocketInspector}
        />
      )}
    </Box>
  );
};

export default GraphOverlaySocketInspector;

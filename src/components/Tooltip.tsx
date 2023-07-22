import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { Box, Paper } from '@mui/material';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import PPSelection from '../classes/SelectionClass';

export const Tooltip = (props) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [pos, setPos] = useState([0, 0]);
  const getObjectAtPoint = (point) => {
    const boundary = new PIXI.EventBoundary(PPGraph.currentGraph.app.stage);
    const objectsUnderPoint = boundary.hitTest(point.x, point.y);

    switch (true) {
      case objectsUnderPoint.parent instanceof PPSocket:
      case objectsUnderPoint.parent instanceof PPSocket &&
        objectsUnderPoint instanceof PIXI.Text:

      case objectsUnderPoint instanceof PPNode:
        console.log('app right click, node');
        break;
      case objectsUnderPoint instanceof Viewport:
        console.log('app right click, viewport');
        break;
      case objectsUnderPoint instanceof PPSelection:
        break;
      default:
        console.log('app right click, something else');
        break;
    }
    return objectsUnderPoint.parent.name;
  };

  useEffect(() => {
    // subscribe to pointermove
    const ids = [];
    let timeout;
    ids.push(
      InterfaceController.addListener(
        ListenEvent.GlobalPointerMove,
        (event: PIXI.FederatedPointerEvent) => {
          clearTimeout(timeout);
          setShowTooltip(false);
          timeout = setTimeout(function () {
            setPos([event.clientX, event.clientY]);
            setShowTooltip(true);
            console.log(PPGraph.currentGraph.app);
            setTooltipText(
              getObjectAtPoint(new PIXI.Point(event.clientX, event.clientY))
            );
            console.log(
              getObjectAtPoint(new PIXI.Point(event.clientX, event.clientY))
            );
          }, 100);
        }
      )
    );

    return () => {
      ids.forEach((id) => InterfaceController.removeListener(id));
    };
  }, []);

  if (!showTooltip) {
    return null;
  }
  return (
    <Paper
      sx={{
        minWidth: 240,
        maxWidth: '100%',
        position: 'absolute',
        zIndex: 400,
        left: pos[0] + 16,
        top: pos[1] - 16,
        p: 1,
      }}
    >
      <Box>{tooltipText}</Box>
    </Paper>
  );
};

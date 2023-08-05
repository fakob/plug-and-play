import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Box, Paper, ThemeProvider, Typography } from '@mui/material';
import { SocketContainer } from '../SocketContainer';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import { getTooltipPositionForSocket } from '../utils/utils';
import { TOOLTIP_WIDTH, customTheme } from '../utils/constants';

function isSocket(object) {
  return (
    object?.parent instanceof PPSocket ||
    (object?.parent instanceof PPSocket && object instanceof PIXI.Text)
  );
}

function isNode(object) {
  return object instanceof PPNode;
}

function shouldShow(object) {
  return isSocket(object) || isNode(object);
}

function Item(props) {
  const object: PIXI.DisplayObject = props.object;
  switch (true) {
    case isSocket(object):
      const socket = object?.parent as PPSocket;
      return (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              px: '8px',
              py: '4px',
            }}
          >
            Shift+Click to pin
          </Typography>
          <SocketContainer
            triggerScrollIntoView={false}
            key={0}
            property={socket}
            index={0}
            dataType={socket.dataType}
            isInput={socket.isInput()}
            hasLink={socket.hasLink()}
            data={socket.data}
            randomMainColor={props.randomMainColor}
            selectedNode={socket.parent as PPNode}
          />
        </>
      );
    case isNode(object):
      const node = object as PPNode;
      return <Box>{node.name}</Box>;
    default:
      return null;
  }
}

export const Tooltip = (props) => {
  let timeout;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipObject, setTooltipObject] =
    useState<PIXI.DisplayObject | null>();
  const [pos, setPos] = useState([0, 0]);

  const getObjectAtPoint = (point) => {
    const boundary = new PIXI.EventBoundary(PPGraph.currentGraph.app.stage);
    const objectsUnderPoint = boundary.hitTest(point.x, point.y);
    return objectsUnderPoint;
  };

  const getPositionBasedOnType = (object: PIXI.DisplayObject, event) => {
    switch (true) {
      case isSocket(object):
        const socket = object?.parent as PPSocket;
        const pos = getTooltipPositionForSocket(socket);
        return [pos.x, pos.y];
      default:
        return [event.clientX + 16, event.clientY - 8];
    }
  };

  useEffect(() => {
    // subscribe to pointermove
    const id = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      (event: PIXI.FederatedPointerEvent) => {
        clearTimeout(timeout);
        setShowTooltip(false);
        timeout = setTimeout(function () {
          const object = getObjectAtPoint(
            new PIXI.Point(event.clientX, event.clientY)
          );
          setPos(getPositionBasedOnType(object, event));
          setShowTooltip(shouldShow(object));
          setTooltipObject(object);
        }, 300);
      }
    );
    return () => {
      InterfaceController.removeListener(id);
    };
  }, []);

  return (
    <ThemeProvider theme={customTheme}>
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          zIndex: 1400,
          p: 1,
          width: TOOLTIP_WIDTH,
          left: Math.min(window.innerWidth - TOOLTIP_WIDTH, pos[0]),
          top: pos[1],
          pointerEvents: 'none',
          transition: 'opacity 0.1s ease-out',
          visibility:
            showTooltip && !props.isContextMenuOpen ? 'visible' : 'hidden',
          opacity: showTooltip && !props.isContextMenuOpen ? 1 : 0,
        }}
      >
        <Item object={tooltipObject} />
      </Paper>
    </ThemeProvider>
  );
};

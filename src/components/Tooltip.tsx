import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Box, Paper, Typography } from '@mui/material';
import { SocketContainer } from '../SocketContainer';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';

const tooltipWidth = 320;

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
          // showHeader={false}
          selectedNode={socket.parent as PPNode}
        />
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
        const absPos = socket.getGlobalPosition();
        const scale = PPGraph.currentGraph.viewportScaleX;
        const distanceX = 32 * scale;
        const nodeWidthScaled = socket.getNode()._BackgroundRef.width * scale;
        if (socket.isInput()) {
          return [Math.max(0, absPos.x - tooltipWidth - distanceX), absPos.y];
        }
        return [Math.max(0, absPos.x + nodeWidthScaled + distanceX), absPos.y];
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
    <Paper
      sx={{
        width: tooltipWidth,
        position: 'absolute',
        zIndex: 1400,
        left: Math.min(window.innerWidth - tooltipWidth, pos[0]),
        top: pos[1],
        p: 1,
        visibility:
          showTooltip && !props.isContextMenuOpen ? 'visible' : 'hidden',
      }}
    >
      <Item object={tooltipObject} />
      <Typography variant="body2" color="text.secondary">
        Shift + click to edit
      </Typography>
    </Paper>
  );
};

import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Box, Paper, Typography } from '@mui/material';
import { SocketContainer } from '../SocketContainer';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipObject, setTooltipObject] =
    useState<PIXI.DisplayObject | null>();
  const [pos, setPos] = useState([0, 0]);

  const getObjectAtPoint = (point) => {
    const boundary = new PIXI.EventBoundary(PPGraph.currentGraph.app.stage);
    const objectsUnderPoint = boundary.hitTest(point.x, point.y);
    return objectsUnderPoint;
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
            const object = getObjectAtPoint(
              new PIXI.Point(event.clientX, event.clientY)
            );
            setShowTooltip(shouldShow(object));
            setTooltipObject(object);
          }, 300);
        }
      )
    );

    return () => {
      ids.forEach((id) => InterfaceController.removeListener(id));
    };
  }, []);

  return (
    <Paper
      sx={{
        minWidth: 240,
        maxWidth: '100%',
        position: 'absolute',
        zIndex: 400,
        left: pos[0] + 32,
        top: pos[1] - 32,
        p: 1,
        visibility: showTooltip ? 'visible' : 'hidden',
      }}
    >
      <Item object={tooltipObject} />
      <Typography variant="body2" color="text.secondary">
        Shift + click to edit
      </Typography>
    </Paper>
  );
};

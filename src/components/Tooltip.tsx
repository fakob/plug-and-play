import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Box, Paper, ThemeProvider } from '@mui/material';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import PPSelection from '../classes/SelectionClass';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import { SocketContainer } from '../SocketContainer';
import { CodeEditor } from '../components/Editor';
import {
  getNodeTooltipData,
  getSelectionTooltipData,
  getTypeAtPoint,
  getTooltipPositionBasedOnType,
  isNode,
  isSocket,
  isSelection,
} from '../utils/utils';
import { TPPType } from '../utils/interfaces';
import { TOOLTIP_DELAY, TOOLTIP_WIDTH, customTheme } from '../utils/constants';

function shouldShow(object) {
  return (
    isSocket(object) ||
    (isNode(object) && !(object as PPNode).doubleClicked) ||
    isSelection(object)
  );
}

function Content(props) {
  const object: TPPType = props.object;
  switch (true) {
    case isSocket(object):
      const socket = object as PPSocket;
      return (
        <>
          <Box
            sx={{
              p: '8px',
              py: '9px',
              color: 'text.primary',
              fontWeight: 'medium',
              fontSize: 'small',
              fontStyle: 'italic',
            }}
          >
            Shift+Click to pin
          </Box>
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
      return (
        <>
          <Box
            sx={{
              p: '8px',
              py: '9px',
              color: 'text.primary',
              fontWeight: 'medium',
              fontSize: 'small',
            }}
          >
            Node: {node.name}
          </Box>
          <CodeEditor
            value={getNodeTooltipData(node)}
            randomMainColor={props.randomMainColor}
          />
        </>
      );
    case isSelection(object):
      const selection = (object as PPSelection).selectedNodes;
      return (
        <>
          <Box
            sx={{
              p: '8px',
              py: '9px',
              color: 'text.primary',
              fontWeight: 'medium',
              fontSize: 'small',
            }}
          >
            {(object as PPSelection).selectedNodes.length} nodes selected
          </Box>
          <CodeEditor
            value={getSelectionTooltipData(selection)}
            randomMainColor={props.randomMainColor}
          />
        </>
      );
    default:
      return null;
  }
}

export const Tooltip = (props) => {
  let timeout;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipObject, setTooltipObject] = useState<TPPType>();
  const [pos, setPos] = useState([0, 0]);

  const getPosition = (object: TPPType, event) => {
    const pos =
      getTooltipPositionBasedOnType(object) ||
      new PIXI.Point(event.clientX + 16, event.clientY - 8);
    return [pos.x, pos.y];
  };

  useEffect(() => {
    // subscribe to pointermove
    const id = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      (event: PIXI.FederatedPointerEvent) => {
        clearTimeout(timeout);
        setShowTooltip(false);
        timeout = setTimeout(function () {
          const object = getTypeAtPoint(
            new PIXI.Point(event.clientX, event.clientY)
          );
          setPos(getPosition(object, event));
          setShowTooltip(shouldShow(object));
          setTooltipObject(object);
        }, TOOLTIP_DELAY);
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
          zIndex: 1210,
          px: 1,
          pb: 1,
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
        <Content object={tooltipObject} />
      </Paper>
    </ThemeProvider>
  );
};

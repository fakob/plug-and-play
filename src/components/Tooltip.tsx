import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Paper, ThemeProvider } from '@mui/material';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import { getObjectAtPoint } from '../utils/utils';
import { TPPType } from '../utils/interfaces';
import { TOOLTIP_DELAY, TOOLTIP_WIDTH, customTheme } from '../utils/constants';

export abstract class Tooltipable {
  getTooltipContent(props): React.ReactElement {
    return <></>;
  }

  getTooltipPosition(): PIXI.Point {
    return new PIXI.Point(0, 0);
  }
}

function shouldShow(object): boolean {
  return object !== undefined && object.doubleClicked !== true;
}

function getClassWithTooltipContent(object): TPPType {
  if (object === undefined) {
    return;
  }

  if (typeof object?.getTooltipContent === 'function') {
    return object;
  }

  // If not found, get parent object and check again
  const parent = object?.parent;
  if (!parent) {
    return;
  }
  return getClassWithTooltipContent(parent);
}

function Content(props): React.ReactElement {
  const object: TPPType = props.object;
  if (object) {
    return object.getTooltipContent({ randomMainColor: props.randomMainColor });
  }
  return <></>;
}

export const Tooltip = (props) => {
  let timeout;
  const [tooltipObject, setTooltipObject] = useState<TPPType>();
  const [pos, setPos] = useState<PIXI.Point>(new PIXI.Point(0, 0));

  const getPosition = (object: TPPType, event): PIXI.Point => {
    if (object) {
      return object.getTooltipPosition();
    }
    return new PIXI.Point(event.clientX + 16, event.clientY - 8);
  };

  useEffect(() => {
    // subscribe to pointermove
    const id = InterfaceController.addListener(
      ListenEvent.GlobalPointerMove,
      (event: PIXI.FederatedPointerEvent) => {
        clearTimeout(timeout);
        setTooltipObject(undefined);
        timeout = setTimeout(function () {
          const object = getObjectAtPoint(
            new PIXI.Point(event.clientX, event.clientY)
          );
          const PPObject = getClassWithTooltipContent(object);
          setPos(getPosition(PPObject, event));
          setTooltipObject(getClassWithTooltipContent(PPObject));
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
        id="tooltip-container"
        elevation={8}
        sx={{
          position: 'absolute',
          zIndex: 1210,
          px: 1,
          pb: 1,
          width: TOOLTIP_WIDTH,
          left: Math.min(window.innerWidth - TOOLTIP_WIDTH, pos.x),
          top: pos.y,
          pointerEvents: 'none',
          transition: 'opacity 0.1s ease-out',
          visibility:
            shouldShow(tooltipObject) && !props.isContextMenuOpen
              ? 'visible'
              : 'hidden',
          opacity:
            shouldShow(tooltipObject) && !props.isContextMenuOpen ? 1 : 0,
        }}
      >
        <Content object={tooltipObject} />
      </Paper>
    </ThemeProvider>
  );
};

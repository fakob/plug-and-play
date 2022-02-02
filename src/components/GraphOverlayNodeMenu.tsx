import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Box } from '@mui/material';
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import FloatingNodeMenu from './FloatingNodeMenu';
import ErrorFallback from './ErrorFallback';

type GraphOverlayNodeMenuProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
  selectedNodes: PPNode[];
};

const GraphOverlayNodeMenu: React.FunctionComponent<
  GraphOverlayNodeMenuProps
> = (props) => {
  const [selectionPos, setSelectionPos] = useState<PIXI.Point>(
    new PIXI.Point(0, 0)
  );

  useEffect(() => {
    if (props.currentGraph) {
      // register callbacks when currentGraph mounted
      props.currentGraph.selection.onSelectionRedrawn = (
        screenPoint: PIXI.Point
      ) => {
        setSelectionPos(screenPoint);
      };
    }
  }, [props.currentGraph]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box sx={{ position: 'relative' }}>
        {props.selectedNodes.length > 0 && selectionPos && (
          <FloatingNodeMenu
            x={
              selectionPos.x +
              props.currentGraph.selection.selectionGraphics.width / 2
            }
            y={Math.max(0, selectionPos.y - 40)}
            selectedNodes={props.selectedNodes}
          />
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default GraphOverlayNodeMenu;

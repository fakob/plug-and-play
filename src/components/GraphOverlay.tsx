import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Box, Button } from '@mui/material';
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import FloatingNodeMenu from './FloatingNodeMenu';
import ErrorFallback from './ErrorFallback';

type GraphOverlayProps = {
  currentGraph: PPGraph;
  selectedNodes: PPNode[];
  selectionPos: PIXI.Point;
  randomMainColor: string;
};

const GraphOverlay: React.FunctionComponent<GraphOverlayProps> = (props) => {
  // const [loadAll, setLoadAll] = useState(valueLength < maxStringLength);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box sx={{ position: 'relative' }}>
        {props.selectedNodes.length > 0 && props.selectionPos && (
          <FloatingNodeMenu
            x={
              props.selectionPos.x +
              props.currentGraph.selection.selectionGraphics.width / 2
            }
            y={Math.max(0, props.selectionPos.y - 40)}
            selectedNodes={props.selectedNodes}
          />
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default GraphOverlay;

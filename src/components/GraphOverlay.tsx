import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Box, Button } from '@mui/material';
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import FloatingNodeMenu from './FloatingNodeMenu';
import ErrorFallback from './ErrorFallback';
import ResponsiveDrawer from './ResponsiveDrawer';

type GraphOverlayProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
};

const GraphOverlay: React.FunctionComponent<GraphOverlayProps> = (props) => {
  const [selectedNodes, setSelectedNodes] = useState<PPNode[]>([]);
  const [selectionPos, setSelectionPos] = useState<PIXI.Point>(
    new PIXI.Point(0, 0)
  );

  // drawer
  const defaultDrawerWidth = 320;
  const [drawerWidth, setDrawerWidth] = useState(defaultDrawerWidth);

  useEffect(() => {
    if (props.currentGraph) {
      // register callbacks when currentGraph mounted
      props.currentGraph.selection.onSelectionChange = setSelectedNodes;
      props.currentGraph.selection.onSelectionRedrawn = (
        screenPoint: PIXI.Point
      ) => {
        setSelectionPos(screenPoint);
      };
    }
  }, [props.currentGraph]);

  function createOrUpdateNodeFromCode(code) {
    props.currentGraph.createOrUpdateNodeFromCode(code);
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box sx={{ position: 'relative' }}>
        <ResponsiveDrawer
          drawerWidth={drawerWidth}
          setDrawerWidth={setDrawerWidth}
          currentGraph={props.currentGraph}
          selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null}
          isCustomNode={
            selectedNodes.length > 0
              ? props.currentGraph.isCustomNode(selectedNodes[0])
              : false
          }
          onSave={createOrUpdateNodeFromCode}
          randomMainColor={props.randomMainColor}
        />
        {selectedNodes.length > 0 && selectionPos && (
          <FloatingNodeMenu
            x={
              selectionPos.x +
              props.currentGraph.selection.selectionGraphics.width / 2
            }
            y={Math.max(0, selectionPos.y - 40)}
            selectedNodes={selectedNodes}
          />
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default GraphOverlay;

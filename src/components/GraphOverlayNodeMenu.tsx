import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import FloatingNodeMenu from './FloatingNodeMenu';

type GraphOverlayNodeMenuProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
  selectedNodes: PPNode[];
  isDragging: boolean;
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
    <Box sx={{ position: 'relative' }}>
      {props.selectedNodes.length > 0 && selectionPos && !props.isDragging && (
        <FloatingNodeMenu
          x={
            selectionPos.x +
            props.currentGraph.selection.selectionGraphics.width / 2
          }
          y={Math.max(0, selectionPos.y - 40)}
          selectedNodes={props.selectedNodes}
          randomMainColor={props.randomMainColor}
        />
      )}
    </Box>
  );
};

export default GraphOverlayNodeMenu;

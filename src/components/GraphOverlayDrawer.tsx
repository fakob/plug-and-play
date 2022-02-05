import React, { useState } from 'react';
import { Box } from '@mui/material';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import ResponsiveDrawer from './ResponsiveDrawer';

type GraphOverlayDrawerProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
  selectedNodes: PPNode[];
};

const GraphOverlayDrawer: React.FunctionComponent<GraphOverlayDrawerProps> = (
  props
) => {
  // drawer
  const defaultDrawerWidth = 320;
  const [drawerWidth, setDrawerWidth] = useState(defaultDrawerWidth);

  function createOrUpdateNodeFromCode(code) {
    props.currentGraph.createOrUpdateNodeFromCode(code);
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <ResponsiveDrawer
        drawerWidth={drawerWidth}
        setDrawerWidth={setDrawerWidth}
        currentGraph={props.currentGraph}
        selectedNode={
          props.selectedNodes.length > 0 ? props.selectedNodes[0] : null
        }
        isCustomNode={
          props.selectedNodes.length > 0
            ? props.currentGraph.isCustomNode(props.selectedNodes[0])
            : false
        }
        onSave={createOrUpdateNodeFromCode}
        randomMainColor={props.randomMainColor}
      />
    </Box>
  );
};

export default GraphOverlayDrawer;

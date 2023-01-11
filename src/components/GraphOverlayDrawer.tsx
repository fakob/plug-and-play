import React, { useState } from 'react';
import { Box } from '@mui/material';
import PPNode from '../classes/NodeClass';
import ResponsiveDrawer from './ResponsiveDrawer';

type GraphOverlayDrawerProps = {
  randomMainColor: string;
  selectedNodes: PPNode[];
  toggle: boolean;
};

const GraphOverlayDrawer: React.FunctionComponent<GraphOverlayDrawerProps> = (
  props
) => {
  // drawer
  const defaultDrawerWidth = 320;
  const [drawerWidth, setDrawerWidth] = useState(defaultDrawerWidth);

  return (
    <Box sx={{ position: 'relative' }}>
      <ResponsiveDrawer
        drawerWidth={drawerWidth}
        setDrawerWidth={setDrawerWidth}
        toggle={props.toggle}
        selectedNode={
          props.selectedNodes.length > 0 ? props.selectedNodes[0] : null
        }
        randomMainColor={props.randomMainColor}
      />
    </Box>
  );
};

export default GraphOverlayDrawer;

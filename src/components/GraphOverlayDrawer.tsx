import React, { useState } from 'react';
import { Box } from '@mui/material';
import PPNode from '../classes/NodeClass';
import ResponsiveDrawer from './ResponsiveDrawer';

type GraphOverlayDrawerProps = {
  randomMainColor: string;
  selectedNodes: PPNode[];
  toggle: boolean;
  toggleLeft: boolean;
};

const GraphOverlayDrawer: React.FunctionComponent<GraphOverlayDrawerProps> = (
  props,
) => {
  // drawer
  const defaultDrawerWidth = 340;
  const defaultHelpDrawerWidth = 440;
  const [helpDrawerWidth, setHelpDrawerWidth] = useState(
    defaultHelpDrawerWidth,
  );
  const [drawerWidth, setDrawerWidth] = useState(defaultDrawerWidth);

  return (
    <Box sx={{ position: 'relative' }}>
      <ResponsiveDrawer
        isLeft={true}
        drawerWidth={helpDrawerWidth}
        setDrawerWidth={setHelpDrawerWidth}
        toggle={props.toggleLeft}
        selectedNodes={props.selectedNodes}
        randomMainColor={props.randomMainColor}
      />
      <ResponsiveDrawer
        isLeft={false}
        drawerWidth={drawerWidth}
        setDrawerWidth={setDrawerWidth}
        toggle={props.toggle}
        selectedNodes={props.selectedNodes}
        randomMainColor={props.randomMainColor}
      />
    </Box>
  );
};

export default GraphOverlayDrawer;

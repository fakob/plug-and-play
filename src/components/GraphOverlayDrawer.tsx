import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import Color from 'color';
import styles from '../utils/style.module.css';
import InterfaceController from '../InterfaceController';
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
  const defaultDrawerWidth = 340;
  const defaultHelpDrawerWidth = 440;
  const [leftDrawerWidth, setLeftDrawerWidth] = useState(
    defaultHelpDrawerWidth,
  );
  const [rightDrawerWidth, setRightDrawerWidth] = useState(defaultDrawerWidth);

  useEffect(() => {
    console.log('onDrawerSizeChanged');
    InterfaceController.onDrawerSizeChanged(
      props.toggleLeft ? leftDrawerWidth : 0,
      false ? rightDrawerWidth : 0,
    );
  }, [rightDrawerWidth, leftDrawerWidth, props.toggle, props.toggleLeft]);

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        className={props.toggleLeft ? styles.fadeEnter : styles.fadeExit}
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100vh',
          pointerEvents: 'none',
          border: `8px solid ${Color(props.randomMainColor).alpha(0.98)}`,
          zIndex: 10,
          boxShadow: 'inset 0px 0px 20px 20px #00000030',
        }}
      />
      <ResponsiveDrawer
        isLeft={true}
        drawerWidth={leftDrawerWidth}
        setDrawerWidth={setLeftDrawerWidth}
        toggle={props.toggleLeft}
        selectedNodes={props.selectedNodes}
        randomMainColor={props.randomMainColor}
      />
      <ResponsiveDrawer
        isLeft={false}
        drawerWidth={rightDrawerWidth}
        setDrawerWidth={setRightDrawerWidth}
        toggle={props.toggle}
        selectedNodes={props.selectedNodes}
        randomMainColor={props.randomMainColor}
      />
    </Box>
  );
};

export default GraphOverlayDrawer;

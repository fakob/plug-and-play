import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Drawer, IconButton, Paper, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import Color from 'color';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import HelpContainer from '../HelpContainer';
import Socket from '../classes/SocketClass';
import { useIsSmallScreen } from '../utils/utils';
import styles from '../utils/style.module.css';

export function DrawerToggle(props) {
  return (
    <Box>
      <Button
        size="small"
        title={`${props.posLeft ? 'Close help' : 'Open help'}`}
        onClick={props.handleDrawerToggle}
        color="primary"
        sx={{
          position: 'fixed',
          bottom: '40px',
          left: `${props.posLeft ? '320px' : '32px'}`,
        }}
      >
        {props.posLeft ? (
          <ChevronLeftIcon />
        ) : (
          <QuestionMarkIcon
            sx={{
              fontSize: '32px',
            }}
          />
        )}
      </Button>
    </Box>
  );
}

const ResponsiveDrawer = (props) => {
  // leaving this commented here for potential future testing
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState(null);
  const [socketToInspect, setSocketToInspect] = useState<Socket | undefined>(
    undefined,
  );
  const smallScreen = useIsSmallScreen();

  const toggleInspectorAndFocus = ({ filter, socket, open }) => {
    if (open !== undefined) {
      setOpen(open);
    } else {
      handleDrawerToggle();
    }
    if (filter) {
      setFilter(filter);
      setSocketToInspect(undefined);
    } else if (socket) {
      setSocketToInspect(socket);
    }
  };

  useEffect(() => {
    // register callbacks when currentGraph mounted
    const ids = [];
    ids.push(
      InterfaceController.addListener(
        ListenEvent.ToggleInspectorWithFocus,
        toggleInspectorAndFocus,
      ),
    );

    return () => {
      ids.forEach((id) => InterfaceController.removeListener(id));
    };
  }, []);

  const handleDrawerToggle = () => {
    setOpen((prevState) => !prevState);
  };

  const handleMouseDown = (e) => {
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointermove', handlePointerMove, true);
  };

  const handlePointerUp = () => {
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('pointermove', handlePointerMove, true);
  };

  const handlePointerMove = useCallback((e) => {
    const minDrawerWidth = 50;
    const maxDrawerWidth = window.innerWidth - 100;
    const newWidth = document.body.offsetLeft + e.clientX - 8;

    if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) {
      props.setDrawerWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    handleDrawerToggle();
  }, [props.toggle]);

  return (
    <>
      {!open && (
        <DrawerToggle
          areNodesSelected={props.selectedNodes?.length > 0}
          randomMainColor={props.randomMainColor}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}
      <Drawer
        anchor="left"
        variant="persistent"
        hideBackdrop
        open={open}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          elevation: 8,
          style: {
            width: smallScreen ? '100%' : props.drawerWidth,
            border: 0,
            background: `${Color(props.randomMainColor).alpha(0.95)}`,
            overflowY: 'unset',
            height: 'calc(100vh - 16px)',
            marginTop: '8px',
            marginLeft: '8px',
          },
        }}
      >
        <div
          onMouseDown={(e) => handleMouseDown(e)}
          className={styles.draggerLeft}
        ></div>
        <DrawerToggle
          posLeft={true}
          randomMainColor={props.randomMainColor}
          handleDrawerToggle={handleDrawerToggle}
        />
        <HelpContainer
          randomMainColor={props.randomMainColor}
          handleDrawerToggle={handleDrawerToggle}
        />
      </Drawer>
    </>
  );
};

// not neccessary to memoize this for the moment, but can be relevant later so leaving this uncommented
export default React.memo(ResponsiveDrawer, (prevProps, newProps) => {
  return (
    prevProps.selectedNodes === newProps.selectedNodes &&
    prevProps.drawerWidth === newProps.drawerWidth &&
    prevProps.toggle === newProps.toggle
  );
});

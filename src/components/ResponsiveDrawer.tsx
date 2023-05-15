import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Drawer, Paper, Stack } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TuneIcon from '@mui/icons-material/Tune';
import Color from 'color';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import Socket from '../classes/SocketClass';
import InspectorContainer from '../InspectorContainer';
import { COLOR_DARK, COLOR_WHITE_TEXT } from '../utils/constants';
import { useIsSmallScreen } from '../utils/utils';
import styles from '../utils/style.module.css';

export function DrawerToggle(props) {
  return (
    <Box>
      <Button
        title={`${props.posLeft ? 'Close inspector' : 'Open inspector'}`}
        size="small"
        onClick={props.handleDrawerToggle}
        color="primary"
        sx={{
          position: 'absolute',
          top: '40px',
          left: `${props.posLeft ? '-32px' : 'auto'}`,
          right: `${props.posLeft ? 'auto' : '32px'}`,
          width: '32px',
          minWidth: '32px',
          background: `${
            props.areNodesSelected
              ? Color(props.randomMainColor).alpha(0.2)
              : 'unset'
          }`,
        }}
      >
        {props.posLeft ? (
          <ChevronRightIcon />
        ) : (
          props.areNodesSelected && <TuneIcon />
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
    undefined
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
        toggleInspectorAndFocus
      )
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
    const newWidth =
      document.body.offsetLeft + document.body.offsetWidth - e.clientX + 20;

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
        anchor="right"
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
            background: `${Color(props.randomMainColor).alpha(0.8)}`,
            overflowY: 'unset',
            height: '100vh',
          },
        }}
      >
        <div
          onMouseDown={(e) => handleMouseDown(e)}
          className={styles.dragger}
        ></div>
        <DrawerToggle
          posLeft={true}
          randomMainColor={props.randomMainColor}
          handleDrawerToggle={handleDrawerToggle}
        />
        {props.selectedNodes.length ? (
          <InspectorContainer
            selectedNodes={props.selectedNodes}
            socketToInspect={socketToInspect}
            randomMainColor={props.randomMainColor}
            filter={filter}
            setFilter={setFilter}
            handleDrawerToggle={handleDrawerToggle}
          />
        ) : (
          <Paper
            component={Stack}
            direction="column"
            justifyContent="center"
            sx={{ height: '100%', background: 'unset' }}
          >
            <Box
              sx={{
                textAlign: 'center',
                color: Color(props.randomMainColor).isDark()
                  ? COLOR_WHITE_TEXT
                  : COLOR_DARK,
              }}
            >
              No node selected
            </Box>
          </Paper>
        )}
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

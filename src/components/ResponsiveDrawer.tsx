import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Drawer, Paper, Stack } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TuneIcon from '@mui/icons-material/Tune';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import Color from 'color';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import Socket from '../classes/SocketClass';
import InspectorContainer from '../InspectorContainer';
import HelpContainer from '../HelpContainer';
import { COLOR_DARK, COLOR_WHITE_TEXT } from '../utils/constants';
import { useIsSmallScreen } from '../utils/utils';
import styles from '../utils/style.module.css';

function DrawerToggleInspector(props) {
  return (
    <Box id="drawer-toggle-inspector">
      <Button
        title={`${props.open ? 'Close node inspector' : 'Open node inspector'}`}
        size="small"
        onClick={props.handleDrawerToggle}
        color="primary"
        sx={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '32px',
          minWidth: '32px',
          backgroundColor: props.open ? COLOR_DARK : COLOR_WHITE_TEXT,
          zIndex: '1300',
        }}
      >
        {props.open ? <ChevronRightIcon /> : <TuneIcon />}
      </Button>
    </Box>
  );
}

function DrawerToggleHelp(props) {
  return (
    <Box id="drawer-toggle-help">
      <Button
        size="small"
        title={`${props.open ? 'Close help' : 'Open help'}`}
        onClick={props.handleDrawerToggle}
        color="primary"
        sx={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '32px',
          minWidth: '32px',
          backgroundColor: props.open ? COLOR_DARK : COLOR_WHITE_TEXT,
          zIndex: '1300',
        }}
      >
        {props.open ? <ChevronLeftIcon /> : <QuestionMarkIcon />}
      </Button>
    </Box>
  );
}

const ResponsiveDrawer = (props) => {
  // leaving this commented here for potential future testing
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState(null);
  const [helpFilter, setHelpFilter] = useState('create');
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
    console.log(e);

    const minDrawerWidth = 50;
    const maxDrawerWidth = window.innerWidth - 100;
    const newWidth =
      document.body.offsetLeft + props.isLeft
        ? e.clientX - 8
        : document.body.offsetWidth - e.clientX + 20;

    if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) {
      props.setDrawerWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    handleDrawerToggle();
  }, [props.toggle]);

  return (
    <>
      {props.isLeft ? (
        <DrawerToggleHelp
          posLeft={false}
          open={open}
          randomMainColor={props.randomMainColor}
          handleDrawerToggle={handleDrawerToggle}
        />
      ) : (
        <DrawerToggleInspector
          posLeft={true}
          open={open}
          randomMainColor={props.randomMainColor}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}
      <Drawer
        anchor={props.isLeft ? 'left' : 'right'}
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
            background: `${Color(props.randomMainColor).alpha(0.98)}`,
            overflowY: 'unset',
            height: 'calc(100vh - 16px)',
            marginTop: '8px',
            marginRight: props.isLeft ? 'unset' : '8px',
            marginLeft: props.isLeft ? '8px' : 'unset',
          },
        }}
      >
        <div
          onMouseDown={(e) => handleMouseDown(e)}
          className={props.isLeft ? styles.draggerLeft : styles.dragger}
        ></div>
        {props.isLeft ? (
          <HelpContainer
            filter={helpFilter}
            setFilter={setHelpFilter}
            randomMainColor={props.randomMainColor}
          />
        ) : props.selectedNodes.length ? (
          <InspectorContainer
            selectedNodes={props.selectedNodes}
            socketToInspect={socketToInspect}
            randomMainColor={props.randomMainColor}
            filter={filter}
            setFilter={setFilter}
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

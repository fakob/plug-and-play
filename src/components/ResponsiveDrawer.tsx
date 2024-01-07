import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Drawer } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TuneIcon from '@mui/icons-material/Tune';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ViewListIcon from '@mui/icons-material/ViewList';
import Color from 'color';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import Socket from '../classes/SocketClass';
import NodeInspectorContainer from '../NodeInspectorContainer';
import GraphInspectorContainer from '../GraphInspectorContainer';
import LeftsideContainer from '../LeftsideContainer';
import { COLOR_WHITE_TEXT } from '../utils/constants';
import { useIsSmallScreen } from '../utils/utils';
import styles from '../utils/style.module.css';

function DrawerToggleInspector(props) {
  const smallScreen = useIsSmallScreen();

  return (
    <Box id="drawer-toggle-inspector" data-cy="inspector-container">
      <Button
        data-cy="inspector-container-toggle-button"
        title={`${props.open ? 'Close node inspector' : 'Open node inspector'}`}
        size="small"
        onClick={() => {
          InterfaceController.toggleRightSideDrawer();
          if (smallScreen) {
            InterfaceController.toggleLeftSideDrawer(false);
          }
        }}
        sx={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '32px',
          minWidth: '32px',
          color: COLOR_WHITE_TEXT,
          bgcolor: props.open
            ? 'background.default'
            : `${Color(props.randomMainColor).darken(0.4)}`,
          zIndex: '1300',
          '&:hover': {
            backgroundColor: `${Color(props.randomMainColor).darken(0.7)}`,
          },
        }}
      >
        {props.open ? <ChevronRightIcon /> : <TuneIcon />}
      </Button>
    </Box>
  );
}

function DrawerToggleLeftside(props) {
  const smallScreen = useIsSmallScreen();

  return (
    <Box id="drawer-toggle-leftside">
      <Button
        size="small"
        title={`${props.open ? 'Close' : 'Open playground list'}`}
        onClick={() => {
          InterfaceController.toggleLeftSideDrawer();
          if (smallScreen) {
            InterfaceController.toggleRightSideDrawer(false);
          }
        }}
        sx={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '32px',
          height: '32px',
          minWidth: '32px',
          color: COLOR_WHITE_TEXT,
          bgcolor: props.open
            ? 'background.default'
            : `${Color(props.randomMainColor).darken(0.4)}`,
          zIndex: '1300',
          '&:hover': {
            backgroundColor: `${Color(props.randomMainColor).darken(0.7)}`,
          },
        }}
      >
        {props.open ? <ChevronLeftIcon /> : <ViewListIcon />}
      </Button>
    </Box>
  );
}

const ResponsiveDrawer = (props) => {
  // leaving this commented here for potential future testing
  const [nodeFilter, setNodeFilter] = useState(null);
  const [leftsideFilter, setLeftsideFilter] = useState('graphs');
  const [graphFilter, setGraphFilter] = useState('nodes');
  const [graphFilterText, setGraphFilterText] = useState('');
  const [socketToInspect, setSocketToInspect] = useState<Socket | undefined>(
    undefined,
  );
  const smallScreen = useIsSmallScreen();

  const toggleInspectorAndFocus = ({ socket }) => {
    InterfaceController.toggleRightSideDrawer(true);
    if (!props.isLeft) {
      if (socket) {
        setSocketToInspect(socket);
      }
    }
  };

  useEffect(() => {
    if (!props.isLeft) {
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
    }
  }, []);

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
      document.body.offsetLeft + props.isLeft
        ? e.clientX - 8
        : document.body.offsetWidth - e.clientX + 20;

    if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) {
      props.setDrawerWidth(newWidth);
    }
  }, []);

  const margin = props.isLeft ? 0 : 8;

  return (
    <>
      {props.isLeft ? (
        <DrawerToggleLeftside
          open={props.toggle}
          randomMainColor={props.randomMainColor}
        />
      ) : (
        <DrawerToggleInspector
          open={props.toggle}
          randomMainColor={props.randomMainColor}
        />
      )}
      <Drawer
        anchor={props.isLeft ? 'left' : 'right'}
        variant="persistent"
        hideBackdrop
        open={props.toggle}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          elevation: margin,
          style: {
            zIndex: props.isLeft ? 10 : 4,
            width: smallScreen ? '100%' : props.drawerWidth,
            border: 0,
            background: `${Color(props.randomMainColor).alpha(0.98)}`,
            overflowY: 'unset',
            height: smallScreen ? '100vh' : `calc(100vh - ${margin * 2}px)`,
            marginTop: smallScreen ? 0 : `${margin}px`,
            marginRight: props.isLeft || smallScreen ? 'unset' : `${margin}px`,
            marginLeft: props.isLeft && !smallScreen ? `${margin}px` : 'unset',
          },
        }}
      >
        <div
          onMouseDown={(e) => handleMouseDown(e)}
          className={props.isLeft ? styles.draggerLeft : styles.dragger}
        ></div>
        {props.isLeft ? (
          <LeftsideContainer
            filter={leftsideFilter}
            setFilter={setLeftsideFilter}
            randomMainColor={props.randomMainColor}
          />
        ) : props.selectedNodes.length ? (
          <NodeInspectorContainer
            selectedNodes={props.selectedNodes}
            socketToInspect={socketToInspect}
            randomMainColor={props.randomMainColor}
            filter={nodeFilter}
            setFilter={setNodeFilter}
            setSocketToInspect={setSocketToInspect}
          />
        ) : (
          <GraphInspectorContainer
            selectedNodes={props.selectedNodes}
            randomMainColor={props.randomMainColor}
            filter={graphFilter}
            setFilter={setGraphFilter}
            filterText={graphFilterText}
            setFilterText={setGraphFilterText}
          />
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

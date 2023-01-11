import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Drawer, Paper, Stack } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TuneIcon from '@mui/icons-material/Tune';
import Color from 'color';
import InspectorContainer from '../InspectorContainer';
import { COLOR_DARK, COLOR_WHITE_TEXT } from '../utils/constants';
import styles from '../utils/style.module.css';

const ResponsiveDrawer = (props) => {
  // leaving this commented here for potential future testing
  //console.log('redrawing responsivedrawer');
  const [open, setOpen] = useState(true);

  const handleDrawerToggle = () => {
    setOpen((prevState) => !prevState);
  };

  const handleMouseDown = (e) => {
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('mousemove', handleMouseMove, true);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
  };

  const handleMouseMove = useCallback((e) => {
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

  function DrawerToggle(props) {
    return (
      <Box>
        <Button
          title={`${props.posLeft ? 'Close inspector' : 'Open inspector'}`}
          size="small"
          onClick={handleDrawerToggle}
          color="primary"
          sx={{
            position: 'absolute',
            top: '40px',
            left: `${props.posLeft ? '-32px' : 'auto'}`,
            right: `${props.posLeft ? 'auto' : '32px'}`,
            width: '32px',
            minWidth: '32px',
            background: `${
              props.selectedNode
                ? Color(props.randomMainColor).alpha(0.2)
                : 'unset'
            }`,
          }}
        >
          {props.posLeft ? (
            <ChevronRightIcon />
          ) : (
            props.selectedNode && <TuneIcon />
          )}
        </Button>
      </Box>
    );
  }

  return (
    <>
      {!open && (
        <DrawerToggle
          selectedNode={props.selectedNode}
          randomMainColor={props.randomMainColor}
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
            width: props.drawerWidth,
            border: 0,
            background: `${Color(props.randomMainColor).alpha(0.8)}`,
            overflowY: 'visible',
          },
        }}
      >
        <div
          onMouseDown={(e) => handleMouseDown(e)}
          className={styles.dragger}
        ></div>
        <DrawerToggle posLeft={true} randomMainColor={props.randomMainColor} />
        {props.selectedNode ? (
          <InspectorContainer
            selectedNode={props.selectedNode}
            randomMainColor={props.randomMainColor}
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
    prevProps.selectedNode?.id === newProps.selectedNode?.id &&
    prevProps.drawerWidth === newProps.drawerWidth &&
    prevProps.toggle === newProps.toggle
  );
});

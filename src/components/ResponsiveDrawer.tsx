import React, { useState, useCallback, useEffect } from 'react';
import { Drawer } from '@mui/material';
import Color from 'color';
import InspectorContainer from '../InspectorContainer';
import styles from '../utils/style.module.css';

const ResponsiveDrawer = (props) => {
  const [widthPercentage, setWidthPercentage] = useState(
    props.drawerWidth / window.innerWidth
  );

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
    props.setDrawerWidth(window.innerWidth * widthPercentage);
  }, [widthPercentage]);

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      hideBackdrop
      open={props.selectedNode !== null}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        elevation: 8,
        style: {
          width: props.drawerWidth,
          border: 0,
          background: `${Color(props.randomMainColor).alpha(0.8)}`,
        },
      }}
    >
      <div
        onMouseDown={(e) => handleMouseDown(e)}
        className={styles.dragger}
      ></div>
      {props.selectedNode && (
        <InspectorContainer
          currentGraph={props.currentGraph}
          selectedNode={props.selectedNode}
          isCustomNode={props.currentGraph.isCustomNode(props.selectedNode)}
          onSave={props.onSave}
          randomMainColor={props.randomMainColor}
          widthPercentage={widthPercentage}
          setWidthPercentage={setWidthPercentage}
        />
      )}
    </Drawer>
  );
};

export default ResponsiveDrawer;

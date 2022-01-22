import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import {
  Box,
  Paper,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import Draggable from 'react-draggable';
import { getCircularReplacer } from './../utils/utils';
import { PropertyContainer } from '../PropertyArrayContainer';
import styles from './../utils/style.module.css';
import { darkThemeOverride } from './../utils/customTheme';

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-title"
      cancel={'[id=draggable-content]'}
      key={`${props.socketinfo?.parent.id}.${props.socketinfo?.name}`}
    >
      <Paper {...props} />
    </Draggable>
  );
}

const FloatingSocketInspector = (props) => {
  const showFloatingSocketInspector = Boolean(props.socketInfoPosition);

  return (
    <ThemeProvider
      theme={createTheme(darkThemeOverride, {
        palette: {
          primary: { main: props.randomMainColor },
          secondary: { main: `${Color(props.randomMainColor).lighten(0.85)}` },
          background: {
            default: `${Color(props.randomMainColor).darken(0.85)}`,
            paper: `${Color(props.randomMainColor).darken(0.1)}`,
          },
        },
      })}
    >
      <PaperComponent
        className={styles.floatingSocketInspector}
        elevation={3}
        sx={{
          left: props.socketInfoPosition?.x - 32,
          top: props.socketInfoPosition?.y + 16,
          display: showFloatingSocketInspector ? 'auto' : 'none',
        }}
        socketinfo={props.socketInfo}
      >
        <Box
          sx={{ cursor: 'move', fontSize: 'small', px: '8px', py: '4px' }}
          id="draggable-title"
        >
          {props.socketInfo?.parent.name}.{props.socketInfo?.name}
        </Box>
        <Box id="draggable-content">
          {props.socketInfo?.hasLink() && (
            <Typography
              fontFamily="Roboto Mono"
              fontSize="12px"
              sx={{
                p: 2,
                bgcolor: 'background.default',
                color: 'text.primary',
              }}
              className={`${styles.serializedNode} ${styles.scrollablePortal}`}
            >
              {JSON.stringify(props.socketInfo?.data, getCircularReplacer(), 2)}
            </Typography>
          )}
          {!props.socketInfo?.hasLink() && (
            <PropertyContainer
              key={0}
              property={props.socketInfo}
              index={0}
              dataType={props.socketInfo?.dataType}
              isInput={true}
              hasLink={props.socketInfo?.hasLink()}
              data={props.socketInfo?.data}
              randomMainColor={props.randomMainColor}
            />
          )}
        </Box>
      </PaperComponent>
    </ThemeProvider>
  );
};

export default FloatingSocketInspector;

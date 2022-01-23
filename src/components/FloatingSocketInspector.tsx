import React, { useState } from 'react';
import * as PIXI from 'pixi.js';
import Color from 'color';
import {
  Box,
  Icon,
  Paper,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  createTheme,
} from '@mui/material';
import Draggable from 'react-draggable';
import Socket from '../classes/SocketClass';
import { DRAWER60M_ICON, DRAWER30M_ICON } from './../utils/constants';
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

type MyProps = {
  socketInfoPosition: PIXI.Point;
  socketInfo: Socket;
  randomMainColor: string;
};

export const FloatingSocketInspector: React.FunctionComponent<MyProps> = (
  props
) => {
  const showFloatingSocketInspector = Boolean(props.socketInfoPosition);
  const [newWidth, setNewWidth] = useState(undefined);

  const handleWidthPercentage = (
    event: React.MouseEvent<HTMLElement>,
    newWidth: number | null
  ) => {
    setNewWidth(newWidth);
  };

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
        elevation={8}
        sx={{
          left: props.socketInfoPosition?.x + 32,
          top: props.socketInfoPosition?.y,
          display: showFloatingSocketInspector ? 'auto' : 'none',
          width: newWidth ? newWidth : 'undefined',
        }}
        socketinfo={props.socketInfo}
      >
        <Box
          id="draggable-title"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'move',
            fontSize: 'small',
          }}
        >
          <Box
            sx={{
              px: '8px',
              py: '4px',
              color: 'text.primary',
              fontWeight: 'medium',
              flexGrow: 1,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {props.socketInfo?.parent.name}.{props.socketInfo?.name}
          </Box>
          <ToggleButtonGroup
            value={newWidth}
            exclusive
            onChange={handleWidthPercentage}
            size="small"
            sx={{
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
              },
            }}
          >
            <ToggleButton value="0.3">
              <Icon classes={{ root: styles.iconRoot }}>
                <img className={styles.imageIcon} src={DRAWER30M_ICON} />
              </Icon>
            </ToggleButton>
            <ToggleButton value="0.6">
              <Icon classes={{ root: styles.iconRoot }}>
                <img className={styles.imageIcon} src={DRAWER60M_ICON} />
              </Icon>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box id="draggable-content">
          <PropertyContainer
            key={0}
            property={props.socketInfo}
            index={0}
            dataType={props.socketInfo?.dataType}
            isInput={props.socketInfo?.isInput()}
            hasLink={props.socketInfo?.hasLink()}
            data={props.socketInfo?.data}
            randomMainColor={props.randomMainColor}
            showHeader={false}
          />
        </Box>
      </PaperComponent>
    </ThemeProvider>
  );
};

export default FloatingSocketInspector;

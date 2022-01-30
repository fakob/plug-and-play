import React, { useState } from 'react';
import * as PIXI from 'pixi.js';
import {
  Box,
  Icon,
  IconButton,
  Paper,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Draggable from 'react-draggable';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import PPNode from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import {
  DRAWER60M_ICON,
  DRAWER30M_ICON,
  customTheme,
} from './../utils/constants';
import { writeDataToClipboard } from './../utils/utils';
import { PropertyContainer } from '../PropertyArrayContainer';
import styles from './../utils/style.module.css';

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
  socketInspectorPosition: PIXI.Point;
  socketToInspect: Socket;
  randomMainColor: string;
  closeSocketInspector: () => void;
};

export const FloatingSocketInspector: React.FunctionComponent<MyProps> = (
  props
) => {
  const showFloatingSocketInspector = Boolean(props.socketInspectorPosition);
  const [newWidth, setNewWidth] = useState(undefined);

  const handleWidthPercentage = (
    event: React.MouseEvent<HTMLElement>,
    newWidth: number | null
  ) => {
    setNewWidth(newWidth);
  };

  return (
    <ThemeProvider theme={customTheme}>
      <PaperComponent
        className={styles.floatingSocketInspector}
        elevation={8}
        sx={{
          left: props.socketInspectorPosition?.x + 32,
          top: props.socketInspectorPosition?.y,
          display: showFloatingSocketInspector ? 'auto' : 'none',
          width: newWidth ? newWidth : 'undefined',
        }}
        socketinfo={props.socketToInspect}
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
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {props.socketToInspect?.parent?.name}.{props.socketToInspect?.name}
          </Box>
          <Box
            sx={{
              flexGrow: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={() => writeDataToClipboard(props.socketToInspect?.data)}
            >
              <ContentCopyIcon sx={{ fontSize: '16px' }} />
            </IconButton>
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
            <ToggleButton value="0.6">
              <Icon classes={{ root: styles.iconRoot }}>
                <img className={styles.imageIcon} src={DRAWER60M_ICON} />
              </Icon>
            </ToggleButton>
            <ToggleButton value="0.3">
              <Icon classes={{ root: styles.iconRoot }}>
                <img className={styles.imageIcon} src={DRAWER30M_ICON} />
              </Icon>
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton size="small" onClick={props.closeSocketInspector}>
            <CloseIcon sx={{ fontSize: '16px' }} />
          </IconButton>
        </Box>
        <Box id="draggable-content">
          <PropertyContainer
            key={0}
            property={props.socketToInspect}
            index={0}
            dataType={props.socketToInspect?.dataType}
            isInput={props.socketToInspect?.isInput()}
            hasLink={props.socketToInspect?.hasLink()}
            data={props.socketToInspect?.data}
            randomMainColor={props.randomMainColor}
            showHeader={false}
            selectedNode={props.socketToInspect?.parent as PPNode}
          />
        </Box>
      </PaperComponent>
    </ThemeProvider>
  );
};

export default FloatingSocketInspector;

import React from 'react';
import Color from 'color';
import {
  Box,
  Popover,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
// import CodeIcon from '@mui/icons-material/Code';
// import UpdateIcon from '@mui/icons-material/Update';
// import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getCircularReplacer } from './../utils/utils';
// import PPNode from '../classes/NodeClass';
import { PropertyContainer } from '../PropertyArrayContainer';
import styles from './../utils/style.module.css';
import { darkThemeOverride } from './../utils/customTheme';

const FloatingSocketInspector = (props) => {
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
      <Popover
        open={props.socketInfoOpen}
        transitionDuration={0}
        anchorReference="anchorPosition"
        anchorPosition={{
          left: props.socketInfoPosition?.[0],
          top: props.socketInfoPosition?.[1],
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={props.onCloseSocketInfo}
        sx={{
          pointerEvents: 'none',
          '& .MuiPopover-paper': {
            pointerEvents: 'auto',
          },
        }}
        PaperProps={{
          onMouseLeave: props.socketInfoLeave,
        }}
      >
        {/* <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>buttons</Box> */}
        {props.socketInfo.hasLink() && (
          <Typography
            fontFamily="Roboto Mono"
            fontSize="12px"
            sx={{ p: 2, bgcolor: 'background.default' }}
            className={`${styles.serializedNode} ${styles.scrollablePortal}`}
          >
            {JSON.stringify(props.socketInfo.data, getCircularReplacer(), 2)}
          </Typography>
        )}
        {!props.socketInfo.hasLink() && (
          <PropertyContainer
            key={0}
            property={props.socketInfo}
            index={0}
            dataType={props.socketInfo.dataType}
            isInput={true}
            hasLink={props.socketInfo.hasLink()}
            data={props.socketInfo.data}
            randomMainColor={props.randomMainColor}
          />
        )}
      </Popover>
    </ThemeProvider>
  );
};

export default FloatingSocketInspector;

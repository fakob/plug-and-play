import React, { useEffect } from 'react';
import Color from 'color';
import {
  Box,
  Popper,
  PopperProps,
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

function generateGetBoundingClientRect(x = 0, y = 0) {
  console.log(x, y);
  return () =>
    ({
      width: 0,
      height: 0,
      top: y,
      right: x,
      bottom: y,
      left: x,
    } as DOMRect);
}

const FloatingSocketInspector = (props) => {
  const [anchorEl, setAnchorEl] = React.useState<PopperProps['anchorEl']>({
    getBoundingClientRect: generateGetBoundingClientRect(
      props.socketInfoPosition?.[0],
      props.socketInfoPosition?.[1]
    ),
  });

  useEffect(() => {
    setAnchorEl({
      getBoundingClientRect: generateGetBoundingClientRect(
        props.socketInfoPosition?.[0],
        props.socketInfoPosition?.[1]
      ),
    });
  }, [props.socketInfoPosition]);

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
      <Popper
        open={props.socketInfoOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
      >
        {props.socketInfo.hasLink() && (
          <Typography
            fontFamily="Roboto Mono"
            fontSize="12px"
            sx={{ p: 2, bgcolor: 'background.default', color: 'text.primary' }}
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
      </Popper>
    </ThemeProvider>
  );
};

export default FloatingSocketInspector;

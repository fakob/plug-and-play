import * as React from 'react';
import Color from 'color';
import { Popper, TextField } from '@mui/material';

import { COLOR_DARK, COLOR_WHITE_TEXT } from '../utils/constants';
import styles from '../utils/style.module.css';

export const GraphSearchInput = (props) => {
  const backgroundColor = Color(props.randommaincolor).alpha(0.8);
  return (
    <TextField
      {...props}
      hiddenLabel
      // className={styles.brightPlaceholder}
      inputRef={props.inputRef}
      variant="filled"
      placeholder="Search playgrounds"
      InputProps={{
        ...props.InputProps,
        disableUnderline: true,
        endAdornment: null,
      }}
      sx={{
        margin: 0,
        borderRadius: '16px',
        fontSize: '16px',
        height: '40px',
        lineHeight: '40px',
        backgroundColor: `${backgroundColor}`,
        '&&& .MuiInputBase-root': {
          backgroundColor: 'transparent',
        },
        '&&&& input': {
          paddingBottom: '8px',
          paddingTop: '0px',
          // color: COLOR_WHITE_TEXT,
          color: Color(props.randommaincolor).isDark()
            ? COLOR_WHITE_TEXT
            : COLOR_DARK,
        },
      }}
    />
  );
};

export const GraphSearchPopper = (props) => {
  return <Popper {...props} placement="bottom" />;
};

export const NodeSearchInput = (props) => {
  const backgroundColor = Color(props.randommaincolor).alpha(0.9);
  return (
    <TextField
      {...props}
      hiddenLabel
      inputRef={props.inputRef}
      variant="filled"
      placeholder="Search nodes"
      InputProps={{ ...props.InputProps, disableUnderline: true }}
      sx={{
        margin: 0,
        borderRadius: '16px',
        fontSize: '16px',
        height: '40px',
        lineHeight: '40px',
        backgroundColor: `${backgroundColor}`,
        zIndex: 10,
        '&&& .MuiInputBase-root': {
          backgroundColor: 'transparent',
        },
        '&&&& input': {
          paddingBottom: '8px',
          paddingTop: '0px',
          color: Color(props.randommaincolor).isDark()
            ? COLOR_WHITE_TEXT
            : COLOR_DARK,
        },
      }}
    />
  );
};

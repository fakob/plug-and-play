import * as React from 'react';
import Color from 'color';
import { Popper, TextField } from '@mui/material';

import styles from '../utils/style.module.css';

export const GraphSearchInput = (props) => {
  const backgroundColor = Color(props.randommaincolor).alpha(0.5);
  console.log(backgroundColor);
  return (
    <TextField
      {...props}
      hiddenLabel
      className={styles.brightPlaceholder}
      inputRef={props.inputRef}
      variant="filled"
      placeholder="Search playgrounds"
      InputProps={{ ...props.InputProps, disableUnderline: true }}
      sx={{
        margin: 0,
        borderRadius: '16px',
        fontSize: '16px',
        height: '40px',
        lineHeight: '40px',
        backgroundColor: `${backgroundColor}`,
        '& input': {
          paddingBottom: '8px !important',
          paddingTop: '1px !important',
        },
      }}
    />
    // <Paper
    //   component="form"
    //   sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
    // >
    //   <IconButton sx={{ p: '10px' }} aria-label="menu">
    //     <MenuIcon />
    //   </IconButton>
    //   <InputBase
    //     inputRef={props.inputRef}
    //     sx={{ ml: 1, flex: 1 }}
    //     placeholder="Search playgrounds"
    //     inputProps={{ 'aria-label': 'Search playgrounds' }}
    //     {...props.inputProps}
    //   />
    //   <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
    //     <SearchIcon />
    //   </IconButton>
    //   <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
    //   <IconButton color="primary" sx={{ p: '10px' }} aria-label="directions">
    //     <DirectionsIcon />
    //   </IconButton>
    // </Paper>
  );
};

export const GraphSearchPopper = (props) => {
  return <Popper {...props} placement="top" />;
};

export const NodeSearchInput = (props) => {
  return (
    <TextField
      {...props}
      hiddenLabel
      inputRef={props.inputRef}
      variant="filled"
      placeholder="Search nodes"
    />
  );
};

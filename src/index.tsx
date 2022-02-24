import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { customTheme } from './utils/constants';
import App from './App';
import styles from './utils/style.module.css';
import './utils/global.css';

const reactRoot = document.createElement('div');
const child = document.body.appendChild(reactRoot);
child.className = 'rootClass';
child.id = 'container';

ReactDOM.render(
  <ThemeProvider theme={customTheme}>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      classes={{
        containerRoot: styles.snackbarContainerRoot,
      }}
    >
      <App />
    </SnackbarProvider>
  </ThemeProvider>,
  reactRoot
);

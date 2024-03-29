import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { customTheme } from './utils/constants';
import { isPhone } from './utils/utils';
import App from './App';
import './utils/global.css';

const reactElement = document.createElement('div');
const container = document.body.appendChild(reactElement);
const root = createRoot(container!);
container.className = 'rootClass';
container.id = 'container';

root.render(
  <ThemeProvider theme={customTheme}>
    <CssBaseline />
    <SnackbarProvider
      maxSnack={9}
      dense={isPhone() ? true : false}
      anchorOrigin={{
        horizontal: isPhone() ? 'center' : 'right',
        vertical: 'top',
      }}
      autoHideDuration={3000}
    >
      <App />
    </SnackbarProvider>
  </ThemeProvider>,
);

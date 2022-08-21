import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { customTheme } from './utils/constants';
import App from './App';
import styles from './utils/style.module.css';
import './utils/global.css';

const reactElement = document.createElement('div');
const container = document.body.appendChild(reactElement);
const root = createRoot(container!);
container.className = 'rootClass';
container.id = 'container';

main();

async function main() {
  fetch('https://plugandplayground.dev/buildInfo')
    .then((response) => response.json())
    .then((data) => console.log('buildinfo: ' + JSON.stringify(data)));

  root.render(
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
    </ThemeProvider>
  );
}

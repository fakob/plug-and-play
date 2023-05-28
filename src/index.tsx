import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { customTheme } from './utils/constants';
import { isPhone } from './utils/utils';
import App from './App';
import styles from './utils/style.module.css';
import './utils/global.css';

const head = document.querySelector('head');

const title = 'Your Plug and Playground';
const imageURL =
  'https://plugandplayground.dev/assets/PlugAndPlayground-Drawing-a-chart.png';
const url = 'https://plugandplayground.dev';
const description =
  'A visual toolkit for creative prototyping to explore, transform or visualise data.';
const author = 'a plug and player';

const metaTagHTML = `<!-- Google / Search Engine Tags -->
<meta itemprop="name" content="${title}">
<meta itemprop="description" content="${description}">
<meta itemprop="image" content="${imageURL}">
<!-- Facebook Meta Tags -->
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageURL}">
<!-- Twitter Meta Tags -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageURL}">
<meta name="twitter:creator" content="${author}">
`;

head.insertAdjacentHTML('afterbegin', metaTagHTML);

const reactElement = document.createElement('div');
const container = document.body.appendChild(reactElement);
const root = createRoot(container!);
container.className = 'rootClass';
container.id = 'container';

root.render(
  <ThemeProvider theme={customTheme}>
    <SnackbarProvider
      maxSnack={9}
      anchorOrigin={{
        horizontal: 'center',
        vertical: isPhone() ? 'bottom' : 'top',
      }}
      classes={{
        containerRoot: styles.snackbarContainerRoot,
      }}
    >
      <App />
    </SnackbarProvider>
  </ThemeProvider>
);

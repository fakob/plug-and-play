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

// Helper function to create and append a meta tag
const createMetaTag = (attributes) => {
  const meta = document.createElement('meta');
  Object.entries(attributes).forEach(([key, value]) => {
    meta.setAttribute(key, value as any);
  });
  head.appendChild(meta);
};

const title = 'Your Plug and Playground';
const imageURL =
  'https://plugandplayground.dev/assets/PlugAndPlayground-Drawing-a-chart.png';
const url = 'https://plugandplayground.dev';
const description =
  'A visual toolkit for creative prototyping to explore, transform or visualise data.';
const author = 'a plug and player';

// Define the meta tag attributes
const metaTags = [
  // Google
  { itemprop: 'name', content: title },
  { itemprop: 'description', content: description },
  { itemprop: 'image', content: imageURL },
  // LinkedIn, Facebook
  { property: 'og:url', content: url },
  { property: 'og:type', content: 'website' },
  { property: 'og:title', content: title },
  { property: 'og:description', content: description },
  { property: 'og:image', content: imageURL },
  // Twitter
  { name: 'twitter:card', content: 'summary' },
  { name: 'twitter:title', content: title },
  { name: 'twitter:description', content: description },
  { name: 'twitter:image', content: imageURL },
  { name: 'twitter:creator', content: author },
];

// Create and append the meta tags
metaTags.forEach((attributes) => {
  createMetaTag(attributes);
});

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

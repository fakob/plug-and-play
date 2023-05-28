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
const imageURL = 'https://plugandplayground.dev/assets/PlugAndPlayIcon512.png';
const url = 'https://plugandplayground.dev';
const description =
  'A visual toolkit for creative prototyping to explore, transform or visualise data.';
const author = 'a plug and player';

// Define the meta tag attributes
const metaTags = [
  { name: 'title', property: 'og:title', content: title },
  { name: 'type', property: 'og:type', content: 'website' },
  { name: 'image', property: 'og:image', content: imageURL },
  { name: 'url', property: 'og:url', content: url },
  { name: 'description', property: 'og:description', content: description },
  { name: 'author', content: author },
  { name: 'twitte:card', content: 'summary' },
  { name: 'twitter:title', content: title },
  { name: 'twitter:image', content: imageURL },
  { name: 'twitter:description', content: description },
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

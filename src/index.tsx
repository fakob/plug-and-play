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

// Create and append the title meta tag
const titleMeta = document.createElement('meta');
titleMeta.setAttribute('name', 'title');
titleMeta.setAttribute('property', 'og:title');
titleMeta.setAttribute('content', 'Your Plug and Playground');
head.appendChild(titleMeta);

// Create and append the type meta tag
const typeMeta = document.createElement('meta');
typeMeta.setAttribute('property', 'og:type');
typeMeta.setAttribute('content', 'website');
head.appendChild(typeMeta);

// Create and append the image meta tag
const imageMeta = document.createElement('meta');
imageMeta.setAttribute('name', 'image');
imageMeta.setAttribute('property', 'og:image');
imageMeta.setAttribute(
  'content',
  'https://plugandplayground.dev/assets/PlugAndPlayIcon512.png'
);
head.appendChild(imageMeta);

// Create and append the description meta tag
const descriptionMeta = document.createElement('meta');
descriptionMeta.setAttribute('name', 'description');
descriptionMeta.setAttribute('property', 'og:description');
descriptionMeta.setAttribute(
  'content',
  'A visual toolkit for creative prototyping to explore, transform or visualise data.'
);
head.appendChild(descriptionMeta);

// Create and append the author meta tag
const authorMeta = document.createElement('meta');
authorMeta.setAttribute('name', 'author');
authorMeta.setAttribute('content', 'The Plug and Players');
head.appendChild(authorMeta);

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

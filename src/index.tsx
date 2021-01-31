import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import './global.css';

const reactRoot = document.createElement('div');
const child = document.body.appendChild(reactRoot);
child.className = 'rootClass';
child.id = 'container';

ReactDOM.render(<App />, reactRoot);

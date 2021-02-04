import React, { useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import * as dat from 'dat.gui';
import PPGraph from './GraphClass';
import {
  CANVAS_BACKGROUNDCOLOR_HEX,
  CANVAS_BACKGROUND_ALPHA,
  CANVAS_BACKGROUND_TEXTURE,
} from './constants';
import { registerAllNodeTypes } from './nodes/allNodes';

import styles from './style.module.css';

const PixiContainer = React.forwardRef(
  (props, forwardedRef: any | null): JSX.Element => {
    // let pixiApp: PIXI.Application;
    // let currentGraph: PPGraph;
    // const pixiContext = useRef<HTMLDivElement | null>(null);

    // useEffect(() => {}, []);

    return <div ref={forwardedRef} className={styles.pixicontainer}></div>;
  }
);

export default PixiContainer;

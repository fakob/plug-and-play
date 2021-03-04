import React from 'react';

import styles from './utils/style.module.css';

const PixiContainer = React.forwardRef(
  (props, forwardedRef: React.Ref<HTMLDivElement> | null): JSX.Element => {
    return <div ref={forwardedRef} className={styles.pixicontainer}></div>;
  }
);

export default PixiContainer;

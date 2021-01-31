import React from 'react';
import ReactContainer from './ReactContainer';
import PixiContainer from './PixiContainer';
import styles from './style.module.css';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      checked: false,
    };
  }
  render(): JSX.Element {
    return (
      <>
        <PixiContainer />
        <ReactContainer
        // value={editorData || defaultEditorData}
        // onSave={createOrUpdateNodeFromCode}
        />
      </>
    );
  }
}

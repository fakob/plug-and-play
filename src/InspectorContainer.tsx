import React, { useRef, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { H3, H4, H5, Slider } from '@blueprintjs/core';

import styles from './style.module.css';
import PPNode from './NodeClass';
import { InputContainer } from './InputContainer';

type MyProps = {
  selectedNode: PPNode;
  showEditor: boolean;
  value?: string;
  onSave?: (code: string) => void;
};

const ReactContainer: React.FunctionComponent<MyProps> = (props) => {
  const editorRef = useRef<any>();
  console.log(props.selectedNode);
  console.log(props.value);

  const saveCode = () => {
    console.log('Create/Update node command from Editor');
    const model = editorRef.current.getModel();
    const value = model.getValue();
    props.onSave(value);
  };

  const editorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addAction({
      id: 'my-unique-id',
      label: 'Create/Update node',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      contextMenuGroupId: 'Test',
      contextMenuOrder: 1,
      run: function (ed) {
        saveCode();
      },
    });

    console.log('editorDidMount', editor);
    editor.focus();
  };

  return (
    <div className={`${styles.inspectorContainer} bp3-dark`} id="editorwrapper">
      <H3>Inspector</H3>
      <H4>{props.selectedNode?.id}</H4>
      <H5>{props.selectedNode?.name}</H5>
      <InputContainer inputSocketArray={props.selectedNode?.inputSocketArray} />
      {/* <Slider
        min={0}
        max={10}
        stepSize={0.1}
        labelStepSize={10}
        // onChange={this.getChangeHandler('value2')}
        // value={this.state.value2}
        // vertical={vertical}
      /> */}
      <pre>{JSON.stringify(props.selectedNode?.serialize())}</pre>
      {props.showEditor && (
        <MonacoEditor
          language="javascript"
          theme="vs-dark"
          value={props.value}
          options={{
            selectOnLineNumbers: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
          onChange={(newValue, e) => {
            console.log('controlled', newValue, e);
          }}
          editorDidMount={editorDidMount}
        />
      )}
    </div>
  );
};

export default ReactContainer;

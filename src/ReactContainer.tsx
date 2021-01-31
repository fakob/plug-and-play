import React, { useRef, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';

import styles from './style.module.css';

type MyProps = {
  value?: string;
  onSave?: (code: string) => void;
};

const ReactContainer: React.FunctionComponent<MyProps> = (props) => {
  const editorRef = useRef<any>();
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
    <div className={styles.editor} id="editorwrapper">
      <MonacoEditor
        // width="800"
        // height="600"
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
    </div>
  );
};

export default ReactContainer;

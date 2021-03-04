import React, { useRef, useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { H3, H4, H5, H6 } from '@blueprintjs/core';

import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import { InputArrayContainer } from './InputArrayContainer';
import PPGraph from './classes/GraphClass';

type MyProps = {
  currentGraph: PPGraph;
  selectedNode: PPNode;
  onSave?: (code: string) => void;
};

const ReactContainer: React.FunctionComponent<MyProps> = (props) => {
  const editorRef = useRef<any>();
  const [codeString, setCodeString] = useState<string | undefined>(undefined);
  console.log(props.selectedNode);

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
        console.log(ed);
        saveCode();
      },
    });

    console.log('editorDidMount', editor);
    editor.focus();
  };

  useEffect(() => {
    const selectedNodeType = props.selectedNode.type;
    const value = props.currentGraph.customNodeTypes[selectedNodeType];
    console.log(value);
    setCodeString(value);
  }, [codeString]);

  return (
    <div className={`${styles.inspectorContainer} bp3-dark`} id="editorwrapper">
      <H5>{props.selectedNode?.name}</H5>
      <div className="bp3-text-small bp3-text-muted">
        ID: {props.selectedNode?.id}
      </div>
      <InputArrayContainer
        inputSocketArray={props.selectedNode?.inputSocketArray}
      />
      <pre className={styles.serializedNode}>
        {JSON.stringify(props.selectedNode?.serialize(), null, 2)}
      </pre>
      {codeString && (
        <MonacoEditor
          language="javascript"
          theme="vs-dark"
          height="70%"
          value={codeString}
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

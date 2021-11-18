import React, { useRef, useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { Button, H5 } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';

import styles from './utils/style.module.css';
import { getCircularReplacer } from './utils/utils';
import PPNode from './classes/NodeClass';
import { PropertyArrayContainer } from './PropertyArrayContainer';
import PPGraph from './classes/GraphClass';

type MyProps = {
  currentGraph: PPGraph;
  selectedNode: PPNode;
  isCustomNode: boolean;
  onSave?: (code: string) => void;
};

const ReactContainer: React.FunctionComponent<MyProps> = (props) => {
  const editorRef = useRef<any>();
  const [codeString, setCodeString] = useState<string | undefined>(
    props.currentGraph.customNodeTypes[props.selectedNode.type]
  );

  const saveCode = () => {
    console.log('Create/Update node command from Editor');
    const model = editorRef.current.getModel();
    const value = model.getValue();
    setCodeString(value);
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
    // update codeString when the type changes
    const selectedNodeType = props.selectedNode.type;
    const value = props.currentGraph.customNodeTypes[selectedNodeType];
    setCodeString(value);
  }, [props.selectedNode.type]);

  return (
    <div
      className={`${styles.inspectorContainer} bp3-dark`}
      id="editorwrapper"
      key={props?.selectedNode?.id}
    >
      {props.selectedNode?.name}
      <PropertyArrayContainer
        inputSocketArray={props.selectedNode?.inputSocketArray}
        outputSocketArray={props.selectedNode?.outputSocketArray}
      />
      {props.isCustomNode && (
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
            // console.log('controlled', newValue, e);
          }}
          editorDidMount={editorDidMount}
        />
      )}
    </div>
  );
};

export default ReactContainer;

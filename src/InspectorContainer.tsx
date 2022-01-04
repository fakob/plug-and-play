import React, { useRef, useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import Color from 'color';
import { Box, Stack, ThemeProvider, createTheme } from '@mui/material';

import { theme, darkThemeOverride } from './utils/customTheme';
import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import { PropertyArrayContainer } from './PropertyArrayContainer';
import PPGraph from './classes/GraphClass';

type MyProps = {
  currentGraph: PPGraph;
  selectedNode: PPNode;
  isCustomNode: boolean;
  onSave?: (code: string) => void;
  randomMainColor: string;
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
    <ThemeProvider
      theme={createTheme(darkThemeOverride, {
        palette: {
          primary: { main: props.randomMainColor },
          secondary: { main: `${Color(props.randomMainColor).negate()}` },
          background: {
            default: `${Color(props.randomMainColor).darken(0.85)}`,
            paper: `${Color(props.randomMainColor).darken(0.1)}`,
          },
        },
      })}
    >
      <Stack
        spacing={1}
        className={`${styles.inspectorContainer}`}
        sx={{
          background: `${Color(props.randomMainColor).alpha(0.8)}`,
          fontFamily: "'Roboto', 'Helvetica', 'Arial', 'sans-serif'",
        }}
        id="editorwrapper"
        key={props?.selectedNode?.id}
      >
        <Box
          sx={{
            pt: '8px',
            px: '8px',
            color: 'text.primary',
            fontWeight: 'medium',
          }}
        >
          {props.selectedNode?.name}
        </Box>
        <PropertyArrayContainer
          inputSocketArray={props.selectedNode?.inputSocketArray}
          outputSocketArray={props.selectedNode?.outputSocketArray}
          randomMainColor={props.randomMainColor}
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
      </Stack>
    </ThemeProvider>
  );
};

export default ReactContainer;

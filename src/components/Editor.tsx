import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import MonacoEditor from 'react-monaco-editor';
import { Box, Button } from '@mui/material';
import ErrorFallback from './ErrorFallback';
import Color from 'color';

type CodeEditorProps = {
  value: string;
  onChange?: (code: string) => void;
  onSave?: (code: string) => void;
  randomMainColor: string;
  editable?: boolean;
};

export const CodeEditor: React.FunctionComponent<CodeEditorProps> = (props) => {
  // const theme = EditorView.theme({
  //   '&.cm-editor': {
  //     fontFamily: 'Roboto Mono, sans-serif',
  //     backgroundColor: `${Color(props.randomMainColor).darken(0.85)}`,
  //   },
  //   '& .cm-gutters': {
  //     backgroundColor: `${Color(props.randomMainColor).darken(
  //       0.85
  //     )} !important`,
  //   },
  //   '& .cm-activeLineGutter, & .cm-activeLine': {
  //     backgroundColor: `${Color(props.randomMainColor).darken(
  //       0.75
  //     )} !important`,
  //   },
  //   // /* Disable CodeMirror's focused editor outline. */
  //   // '&.cm-editor.cm-focused': {
  //   //   outline: 'none',
  //   // },
  // });

  const maxStringLength = 10000;
  const valueLength = props.value?.length;
  const [loadAll, setLoadAll] = useState(valueLength < maxStringLength);
  const [loadedValue, setLoadedValue] = useState(
    loadAll ? props.value : props.value?.slice(0, maxStringLength) + '...'
  );

  // useEffect(() => {
  //   console.log(props.value);
  //   console.log(loadedValue);
  // }, [props.value]);

  const onLoadAll = () => {
    setLoadedValue(props.value);
    setLoadAll(true);
  };

  const saveCode = () => {
    console.log('Create/Update node command from Editor');
    if (props.onSave) {
      props.onSave(props.value);
    }
  };

  const editorDidMount = (editor, monaco) => {
    // editorRef.current = editor;

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

  const onChange = (value, e) => {
    console.log(value);
    props.onChange(value);
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box sx={{ position: 'relative' }}>
        {!loadAll && (
          <Button
            sx={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}
            color="secondary"
            variant="contained"
            size="small"
            onClick={onLoadAll}
          >
            Load all{props.editable && ' (to edit)'}
          </Button>
        )}
        <MonacoEditor
          width="100%"
          height="600"
          language="javascript"
          theme="vs-dark"
          value={props.value}
          options={{
            automaticLayout: true,
            lineNumbersMinChars: 4,
            minimap: { enabled: !loadAll },
            readOnly: !props.editable,
            scrollBeyondLastLine: false,
            selectOnLineNumbers: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
          onChange={onChange}
          editorDidMount={editorDidMount}
        />
      </Box>
    </ErrorBoundary>
  );
};

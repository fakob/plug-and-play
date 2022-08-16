import React, { useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import MonacoEditor, { monaco } from 'react-monaco-editor';
import { Box, Button } from '@mui/material';
import ErrorFallback from './ErrorFallback';

type CodeEditorProps = {
  value: string;
  onChange?: (code: string) => void;
  randomMainColor: string;
  editable?: boolean;
};

export const CodeEditor: React.FunctionComponent<CodeEditorProps> = (props) => {
  const maxStringLength = 10000;
  const valueLength = props.value?.length;
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const [loadAll, setLoadAll] = useState(valueLength < maxStringLength);
  const [loadedValue, setLoadedValue] = useState(
    loadAll ? props.value : props.value?.slice(0, maxStringLength) + '...'
  );
  const [editorHeight, setEditorHeight] = useState(48);

  const onLoadAll = () => {
    setLoadedValue(props.value);
    setLoadAll(true);
  };

  const changeEditorHeight = () => {
    const newContentHeight = editorRef.current.getContentHeight();
    if (editorHeight !== newContentHeight) {
      setEditorHeight(newContentHeight);
    }
  };

  const editorDidMount = (editor) => {
    console.log('editorDidMount', editor);
    editorRef.current = editor;
    changeEditorHeight();
    editorRef.current.focus();
  };

  const onChange = (value, e) => {
    changeEditorHeight();
    setLoadedValue(value);
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
          height={`clamp(48px, ${editorHeight}px, 60vh)`}
          language="javascript"
          theme="vs-dark"
          value={loadedValue}
          options={{
            automaticLayout: true,
            lineNumbersMinChars: 4,
            minimap: { enabled: !loadAll },
            readOnly: !loadAll || !props.editable,
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

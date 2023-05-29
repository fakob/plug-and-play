import React, { useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import MonacoEditor, { monaco } from 'react-monaco-editor';
import { Box, Button } from '@mui/material';
import ErrorFallback from './ErrorFallback';
import { MAX_STRING_LENGTH } from '../utils/constants';
import { convertToString, getLoadedValue } from '../utils/utils';

type CodeEditorProps = {
  value: unknown;
  onChange?: (code: string) => void;
  randomMainColor: string;
  editable?: boolean;
};

export const CodeEditor: React.FunctionComponent<CodeEditorProps> = (props) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const shouldLoadAll = (value) => {
    if (editorRef.current?.hasTextFocus()) {
      return true;
    }
    return convertToString(value)?.length < MAX_STRING_LENGTH;
  };

  const [loadAll, setLoadAll] = useState(shouldLoadAll(props.value));
  const [loadedValue, setLoadedValue] = useState(
    getLoadedValue(props.value, loadAll)
  );
  const [editorHeight, setEditorHeight] = useState(48);

  const onLoadAll = () => {
    setLoadedValue(convertToString(props.value));
    setLoadAll(true);
  };

  const changeEditorHeight = () => {
    const newContentHeight = editorRef.current.getContentHeight();
    if (editorHeight !== newContentHeight) {
      setEditorHeight(newContentHeight);
    }
  };

  const editorDidMount = (editor) => {
    editorRef.current = editor;
    changeEditorHeight();
  };

  const onChange = (value, e) => {
    changeEditorHeight();
    setLoadedValue(value);
    props.onChange(value);
  };

  useEffect(() => {
    const load = shouldLoadAll(props.value);
    setLoadAll(load);
    setLoadedValue(getLoadedValue(props.value, load));
  }, [props.value]);

  useEffect(() => {
    changeEditorHeight();
  }, [loadedValue]);

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
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
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

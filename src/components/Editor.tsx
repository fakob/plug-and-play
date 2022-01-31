import React, { useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import CodeMirror, {
  EditorView,
  KeyBinding,
  keymap,
  ReactCodeMirrorRef,
} from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { Box, Button } from '@mui/material';
import ErrorFallback from './ErrorFallback';
import Color from 'color';

type CodeEditorProps = {
  value: string;
  onChange?: (code: string) => void;
  onSave?: (code: string) => void;
  randomMainColor: string;
  editable?: boolean;
  height?: string;
  scale?: number;
};

export const CodeEditor: React.FunctionComponent<CodeEditorProps> = (props) => {
  const theme = EditorView.theme({
    '&.cm-editor': {
      fontFamily: 'Roboto Mono, sans-serif',
      backgroundColor: `${Color(props.randomMainColor).darken(0.85)}`,
    },
    '& .cm-gutters': {
      backgroundColor: `${Color(props.randomMainColor).darken(
        0.85
      )} !important`,
    },
    '& .cm-activeLineGutter, & .cm-activeLine': {
      backgroundColor: `${Color(props.randomMainColor).darken(
        0.75
      )} !important`,
    },
    // /* Disable CodeMirror's focused editor outline. */
    // '&.cm-editor.cm-focused': {
    //   outline: 'none',
    // },
    // .CodeMirror-cursors,
    // .CodeMirror-measure:nth-child(2) + div{
    //     transform:scale(1.1); /* Reverse scale from 0.9 */
    //     transform-origin: 0 0;
    // }
  });

  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const maxStringLength = 10000;
  const valueLength = props.value?.length;
  const [loadAll, setLoadAll] = useState(valueLength < maxStringLength);
  const [loadedValue, setLoadedValue] = useState(
    loadAll ? props.value : props.value?.slice(0, maxStringLength) + '...'
  );
  console.log(EditorView);
  console.log(props.scale);

  useEffect(() => {
    console.log(editorRef.current);
    if (editorRef.current) {
      // editorRef.current.editor.
    }
  }, [editorRef.current]);

  useEffect(() => {
    console.log(props.scale);
  }, [props.scale]);

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

  /*
   * Create a KeyMap extension
   */
  function getKeymap() {
    // Save command
    const save = (editor) => {
      saveCode();
      // console.log(editor.toString());
      return true;
    };

    const conf: readonly KeyBinding[] = [
      {
        key: 'Ctrl-Enter',
        // mac: 'Cmd-Enter', // seems to not work in chrome
        run: save,
        preventDefault: true,
      },
    ];

    return keymap.of(conf);
  }

  // function showCode() {
  //   const editor = document.querySelector('.CodeMirror');
  //   editor.classList.toggle('active');

  //   // use the object for refresh CodeMirror
  //   editor.CodeMirror.refresh();
  // }

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
        <CodeMirror
          ref={editorRef}
          value={loadedValue}
          width="100%"
          minHeight="40px"
          maxHeight="60vh"
          height={props.height}
          theme={oneDark}
          editable={props.editable}
          extensions={[
            javascript({ jsx: true }),
            EditorView.lineWrapping,
            getKeymap(),
            theme,
          ]}
          onChange={props.onChange}
        />
      </Box>
    </ErrorBoundary>
  );
};

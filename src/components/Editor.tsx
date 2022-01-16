import * as React from 'react';
import CodeMirror, {
  EditorView,
  KeyBinding,
  keymap,
} from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import Color from 'color';

type CodeEditorProps = {
  value: string;
  onChange: (code: string) => void;
  onSave?: (code: string) => void;
  randomMainColor: string;
  editable?: boolean;
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
  });

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
      console.log(editor.toString());
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

  return (
    <CodeMirror
      value={props.value}
      width="100%"
      height="100%"
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
  );
};

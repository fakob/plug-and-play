import React, { useState } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';

require('codemirror/lib/codemirror.css');
require('codemirror/theme/material.css');
require('codemirror/theme/neat.css');
require('codemirror/mode/xml/xml.js');
require('codemirror/mode/javascript/javascript.js');
require('./style.css');

type MyProps = {
  value?: string;
  onSave?: (code: string) => void;
  visible?: boolean;
};

const ReactContainer: React.FunctionComponent<MyProps> = (props) => {
  const [code, setCode] = useState(props.value);

  return (
    props.visible && (
      <CodeMirror
        value={code}
        options={{
          lineNumbers: true,
          lineWrapping: true,
          theme: 'material',
          mode: 'javascript',
          autofocus: true,
          matchBrackets: true,
          autoCloseBrackets: true,
          indentUnit: 2,
          tabSize: 2,
          extraKeys: {
            'Ctrl-Enter': (cm) => {
              props.onSave(code);
              console.log(cm);
            },
          },
        }}
        onBeforeChange={(editor, data, value) => {
          setCode(value);
        }}
        onChange={(editor, value) => {
          console.log('controlled', value);
        }}
        editorDidMount={(editor) => {
          editor.setSize('', '600px');
        }}
      />
    )
  );
};

export default ReactContainer;

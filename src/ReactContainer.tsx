import React, { useState } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';

require('codemirror/lib/codemirror.css');
require('codemirror/theme/material.css');
require('codemirror/theme/neat.css');
require('codemirror/mode/xml/xml.js');
require('codemirror/mode/javascript/javascript.js');

type MyProps = {
  value?: string;
};

const ReactContainer: React.FunctionComponent<MyProps> = (props) => {
  const [code, setCode] = useState(props.value);

  return (
    <CodeMirror
      value={code}
      options={{
        lineNumbers: true,
        theme: 'material',
        mode: 'javascript',
        autofocus: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        indentUnit: 2,
        tabSize: 2,
      }}
      onBeforeChange={(editor, data, value) => {
        setCode(value);
      }}
      onChange={(editor, value) => {
        console.log('controlled', value);
      }}
    />
  );
};

export default ReactContainer;

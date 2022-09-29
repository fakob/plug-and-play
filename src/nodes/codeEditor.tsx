import React, { useEffect, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/ErrorFallback';
import MonacoEditor from 'react-monaco-editor';
import PPSocket from '../classes/SocketClass';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CodeType } from './datatypes/codeType';

import { convertToString } from '../utils/utils';
import { CustomArgs } from '../utils/interfaces';
import { SOCKET_TYPE, customTheme } from '../utils/constants';
import HybridNode from '../classes/HybridNode';

const outputSocketName = 'output';
const inputSocketName = 'input';

export class CodeEditor extends HybridNode {
  update: (newHeight?) => void;
  readOnly: boolean;

  protected getActivateByDoubleClick(): boolean {
    return true;
  }

  public getName(): string {
    return 'CodeEditor';
  }

  public getDescription(): string {
    return 'Edit your code';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.OUT,
        outputSocketName,
        new CodeType(),
        undefined,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketName,
        new CodeType(),
        '// javascript code editor\n// to run this code, plug it into a CustomFunction node\n(a) => {\nreturn a;\n}',
        false
      ),
    ];
  }

  getOpacity(): number {
    return 0.01;
  }

  protected onNodeExit(): void {
    this.update;
  }

  constructor(name: string, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 300;

    super(name, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      minNodeWidth: nodeWidth / 2,
      minNodeHeight: nodeHeight / 2,
    });

    if (customArgs?.initialData) {
      this.setInputData(inputSocketName, customArgs?.initialData);
    }

    this.readOnly = false;

    // when the Node is added, create the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData(inputSocketName);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();

      this.createContainerComponent(ParentComponent, {
        nodeHeight: this.nodeHeight,
        data,
        readOnly: this.readOnly,
      });
    };

    this.update = (newHeight): void => {
      const newData = this.getInputData(inputSocketName);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();

      this.renderReactComponent(ParentComponent, {
        nodeHeight: newHeight ?? this.nodeHeight,
        data: newData,
        readOnly: this.readOnly,
      });
    };

    this.onNodeDoubleClick = () => {
      PPGraph.currentGraph.selection.drawRectanglesFromSelection();
      this.update();
    };

    this.onNodeResize = (newWidth, newHeight) => {
      this.update(newHeight);
    };

    this.onExecute = async function () {
      this.update();
    };

    type MyProps = {
      doubleClicked: boolean; // is injected by the NodeClass
      data: string;
      randomMainColor: string;
      nodeHeight: number;
      readOnly: boolean;
    };

    // small presentational component
    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      const parseData = (value: any) => {
        let dataAsString;
        if (typeof value !== 'string') {
          dataAsString = convertToString(value);
        } else {
          dataAsString = value;
        }
        return dataAsString;
      };

      const onChange = (value) => {
        setCodeString(value);
        this.setInputData(inputSocketName, value);
        this.setOutputData(outputSocketName, value);
        this.executeChildren();
      };

      const [codeString, setCodeString] = useState<string | undefined>(
        parseData(props.data)
      );

      useEffect(() => {
        setCodeString(parseData(props.data));
        this.setOutputData(outputSocketName, props.data);
        this.executeChildren();
      }, [props.data]);

      return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThemeProvider theme={customTheme}>
            <Box sx={{ position: 'relative' }}>
              <MonacoEditor
                width="100%"
                height={`${props.nodeHeight}px`}
                language="javascript"
                theme="vs-dark"
                value={codeString || ''}
                options={{
                  automaticLayout: true,
                  lineNumbersMinChars: 4,
                  readOnly: props.readOnly,
                  selectOnLineNumbers: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
                onChange={onChange}
              />
            </Box>
          </ThemeProvider>
        </ErrorBoundary>
      );
    };
  }
}

import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, ThemeProvider } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/ErrorFallback';
import MonacoEditor from 'react-monaco-editor';
import PPSocket from '../classes/SocketClass';
import { CodeType } from './datatypes/codeType';
import { convertToString, downloadFile, formatDate } from '../utils/utils';
import { SOCKET_TYPE, customTheme } from '../utils/constants';
import HybridNode2 from '../classes/HybridNode2';

const outputSocketName = 'output';
const inputSocketName = 'input';

export class CodeEditor extends HybridNode2 {
  getPreferredInputSocketName(): string {
    return inputSocketName;
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
        true
      ),
    ];
  }

  getOpacity(): number {
    return 0.01;
  }

  protected onHybridNodeExit(): void {
    this.executeOptimizedChain();
  }

  public getMinNodeWidth(): number {
    return 200;
  }

  public getMinNodeHeight(): number {
    return 150;
  }

  public getDefaultNodeWidth(): number {
    return 400;
  }

  public getDefaultNodeHeight(): number {
    return 300;
  }

  protected getParentComponent(props: any) {
    const node = props.node;

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
      node.setInputData(inputSocketName, value);
      node.setOutputData(outputSocketName, value);
      node.executeChildren();
    };

    const onExport = () => {
      downloadFile(
        codeString,
        `${node.name} - ${formatDate()}.txt`,
        'text/plain'
      );
    };

    const loadData = useCallback(() => {
      setCodeString(parseData(props[inputSocketName]));
      node.setOutputData(outputSocketName, props[inputSocketName]);
      node.executeChildren();
    }, [props[inputSocketName]]);

    const [codeString, setCodeString] = useState<string | undefined>(
      parseData(props[inputSocketName])
    );

    const [readOnly, setReadOnly] = useState<boolean>(
      node.getInputSocketByName(inputSocketName).hasLink()
    );

    useEffect(() => {
      if (node.initialData) {
        node.setInputData(inputSocketName, node.initialData);
        setCodeString(parseData(node.initialData));
        node.setOutputData(outputSocketName, node.initialData);
        node.executeOptimizedChain();
      }
    }, []);

    useEffect(() => {
      loadData();
    }, [props[inputSocketName], props[inputSocketName]?.length]);

    useEffect(() => {
      setReadOnly(node.getInputSocketByName(inputSocketName).hasLink());
    }, [node.getInputSocketByName(inputSocketName).hasLink()]);

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider theme={customTheme}>
          <Box sx={{ position: 'relative' }}>
            <MonacoEditor
              width="100%"
              height={`${node.nodeHeight}px`}
              language="javascript"
              theme="vs-dark"
              value={codeString || ''}
              options={{
                automaticLayout: true,
                lineNumbersMinChars: 4,
                readOnly: readOnly,
                selectOnLineNumbers: true,
                tabSize: 2,
                wordWrap: 'on',
              }}
              onChange={onChange}
            />
            {node.doubleClicked && (
              <ButtonGroup
                variant="contained"
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  zIndex: 10,
                }}
              >
                <Button onClick={onExport}>
                  <DownloadIcon sx={{ ml: 0.5, fontSize: '16px' }} />{' '}
                </Button>
              </ButtonGroup>
            )}
          </Box>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}

import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, ThemeProvider } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/ErrorFallback';
import MonacoEditor from 'react-monaco-editor';
import PPSocket from '../classes/SocketClass';
import { CodeType } from './datatypes/codeType';
import { TNodeSource } from '../utils/interfaces';
import {
  convertToString,
  downloadFile,
  formatDate,
  updateDataIfDefault,
} from '../utils/utils';
import { SOCKET_TYPE, customTheme } from '../utils/constants';
import HybridNode2 from '../classes/HybridNode2';

const outputSocketName = 'output';
const inputSocketName = 'input';
const codeDefaultData =
  '// javascript code editor\n// to run this code, plug it into a CustomFunction node\n(a) => {\nreturn a;\n}';

export class CodeEditor extends HybridNode2 {
  getPreferredInputSocketName(): string {
    return inputSocketName;
  }

  public getName(): string {
    return 'Code editor';
  }

  public getDescription(): string {
    return 'Adds a code editor';
  }

  public getTags(): string[] {
    return ['Widget'].concat(super.getTags());
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.OUT,
        outputSocketName,
        new CodeType(),
        undefined,
        true,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketName,
        new CodeType(),
        codeDefaultData,
        true,
      ),
    ];
  }

  public onNodeAdded = async (source: TNodeSource): Promise<void> => {
    await super.onNodeAdded(source);
    if (this.initialData) {
      this.setInputData(inputSocketName, this.initialData);
    }
  };

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

  public async outputPlugged(): Promise<void> {
    const dataToUpdate =
      this.getSocketByName(outputSocketName).links[0].getTarget().defaultData;
    updateDataIfDefault(this, inputSocketName, codeDefaultData, dataToUpdate);
    await super.outputPlugged();
  }

  protected getParentComponent(props: any): React.ReactElement {
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
        'text/plain',
      );
    };

    const loadData = useCallback(() => {
      setCodeString(parseData(props[inputSocketName]));
      node.setOutputData(outputSocketName, props[inputSocketName]);
      node.executeChildren();
    }, [props[inputSocketName]]);

    const [codeString, setCodeString] = useState<string | undefined>(
      parseData(props[inputSocketName]),
    );

    useEffect(() => {
      loadData();
    }, [props[inputSocketName], props[inputSocketName]?.length]);

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
                readOnly: false,
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

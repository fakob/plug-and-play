import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/ErrorFallback';
import MonacoEditor from 'react-monaco-editor';
import PPSocket from '../classes/SocketClass';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CodeType } from './datatypes/codeType';

import { convertToString, getSelectionBounds } from '../utils/utils';
import { CustomArgs } from '../utils/interfaces';
import { SOCKET_TYPE, customTheme } from '../utils/constants';

const outputSocketName = 'output';
const inputSocketName = 'input';

export class CodeEditor extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  parsedData: any;
  update: (newHeight?) => void;
  getChange: (value: string) => void;
  previousPosition: PIXI.Point;
  previousScale: number;
  readOnly: boolean;

  protected getIsHybrid(): boolean {
    return true;
  }

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
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketName,
        new CodeType(),
        undefined, // customArgs?.data,
        false
      ),
    ];
  }

  getOpacity(): number {
    return 0.01;
  }

  constructor(name: string, customArgs?: CustomArgs) {
    const nodeWidth = 800;
    const nodeHeight = 400;
    let editedData = '';

    super(name, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      minNodeWidth: nodeWidth / 2,
      minNodeHeight: nodeHeight / 2,
    });

    // this.initialData = customArgs?.data;

    this.readOnly = false;

    this.getChange = (value) => {
      editedData = value;
    };

    const defaultProps = {
      graph: PPGraph.currentGraph,
      getChange: this.getChange,
    };

    const nodeFocusOut = () => {
      console.log('nodeFocusOut', editedData);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();
      // this.setInputData(inputSocketName, editedData);
      this.renderReactComponent(ParentComponent, {
        ...defaultProps,
        nodeHeight: this.nodeHeight,
        readOnly: this.readOnly,
      });

      PPGraph.currentGraph.viewport.animate({
        position: this.previousPosition,
        time: 250,
        scale: this.previousScale,
        ease: 'easeInOutSine',
      });
      PPGraph.currentGraph.selection.drawRectanglesFromSelection();
    };

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData(inputSocketName);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();
      this.createContainerComponent(document, ParentComponent, {
        ...defaultProps,
        nodeHeight: this.nodeHeight,
        data,
        readOnly: this.readOnly,
      });
    };

    this.update = (newHeight): void => {
      const newData = this.getInputData(inputSocketName);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();

      this.renderReactComponent(ParentComponent, {
        ...defaultProps,
        nodeHeight: newHeight ?? this.nodeHeight,
        data: newData,
        readOnly: this.readOnly,
      });
    };

    this.onNodeDoubleClick = () => {
      // PPGraph.currentGraph.selection.drawRectanglesFromSelection();
      this.update();
    };

    this.onHybridNodeExit = () => {
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
      graph: PPGraph;
      readOnly: boolean;
      getChange: (value: string) => void;
    };

    // small presentational component
    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      const parseData = (value: any) => {
        let dataAsString;
        if (typeof props.data !== 'string') {
          dataAsString = convertToString(props.data);
        } else {
          dataAsString = props.data;
        }
        return dataAsString;
      };

      const onChange = (value) => {
        props.getChange(value);
        setCodeString(value);
        this.setInputData(inputSocketName, value);
        this.setOutputData(outputSocketName, value);
        this.executeOptimizedChain();
      };

      const editorRef = useRef();
      const [codeString, setCodeString] = useState<string | undefined>(
        parseData(props.data)
      );

      useEffect(() => {
        setCodeString(parseData(props.data));
        this.setOutputData(outputSocketName, props.data);
        this.executeOptimizedChain();
      }, [props.data]);

      // useEffect(() => {
      //   console.log('doubleClicked: ', props.doubleClicked);
      //   if (editorRef && editorRef.current && props.doubleClicked) {
      //     (editorRef.current as any).focus();
      //   }
      // }, [props.doubleClicked]);

      const editorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        console.log('editorDidMount', editorRef);
      };

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
                  // scrollBeyondLastLine: false,
                  selectOnLineNumbers: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
                onChange={onChange}
                editorDidMount={editorDidMount}
              />
            </Box>
          </ThemeProvider>
        </ErrorBoundary>
      );
    };
  }
}

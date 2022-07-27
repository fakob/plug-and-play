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
  update: () => void;
  getChange: (value: string) => void;
  previousPosition: PIXI.Point;
  previousScale: number;
  editable: boolean;

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
        '', // customArgs?.data,
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

    this.editable = false;

    this.getChange = (value) => {
      editedData = value;
    };

    const defaultProps = {
      graph: PPGraph.currentGraph,
      getChange: this.getChange,
    };

    const nodeFocusOut = () => {
      this.editable = false;
      this.setInputData('input', editedData);
      this.renderReactComponent(ParentComponent, {
        ...defaultProps,
        nodeHeight: this.nodeHeight,
        editable: this.editable,
      });

      PPGraph.currentGraph.viewport.animate({
        position: this.previousPosition,
        time: 250,
        scale: this.previousScale,
        ease: 'easeInOutSine',
      });
      PPGraph.currentGraph.selection.drawRectanglesFromSelection();
    };

    const keysDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        nodeFocusOut();
      }
    };

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('input');
      const hasLink = this.getInputSocketByName('input').hasLink();
      this.createContainerComponent(document, ParentComponent, {
        ...defaultProps,
        nodeHeight: this.nodeHeight,
        data,
        hasLink,
        editable: this.editable,
      });

      // add event listeners
      window.addEventListener('keydown', keysDown.bind(this));
    };

    this.onNodeDoubleClick = () => {
      // center the editor and set zoom to 100%
      // as a scaled editor has issues with selection and cursor placement
      const boundsToZoomTo = getSelectionBounds(
        PPGraph.currentGraph.selection.selectedNodes // get bounds of the selectedNodes
      );
      this.previousPosition = PPGraph.currentGraph.viewport.center;
      this.previousScale = PPGraph.currentGraph.viewport.scale.x;
      const newPosition = new PIXI.Point(
        boundsToZoomTo.x + (window.innerWidth / 2 - 56), // move 56 from left
        boundsToZoomTo.y + (window.innerHeight / 2 - 128) // move 120px from top
      );

      PPGraph.currentGraph.viewport.animate({
        position: newPosition,
        time: 250,
        scale: 1,
        ease: 'easeInOutSine',
      });
      PPGraph.currentGraph.selection.drawRectanglesFromSelection();

      this.editable = true;
      this.renderReactComponent(ParentComponent, {
        ...defaultProps,
        nodeHeight: this.nodeHeight,
        editable: this.editable,
      });
    };

    // this.onNodeFocusOut = () => {
    //   nodeFocusOut();
    // };

    this.onNodeResize = (newWidth, newHeight) => {
      this.renderReactComponent(ParentComponent, {
        ...defaultProps,
        nodeHeight: newHeight,
        data: editedData,
        editable: this.editable,
      });
    };

    this.onExecute = async function (input) {
      const newData = input['input'];
      this.renderReactComponent(ParentComponent, {
        ...defaultProps,
        nodeHeight: this.nodeHeight,
        data: newData,
        editable: this.editable,
      });
    };

    type MyProps = {
      data: string;
      randomMainColor: string;
      hasLink: boolean;
      nodeHeight: number;
      graph: PPGraph;
      editable: boolean;
      getChange: (value: string) => void;
    };

    // small presentational component
    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      let dataAsString;
      if (typeof props.data !== 'string') {
        dataAsString = convertToString(props.data);
      } else {
        dataAsString = props.data;
      }
      const editor = useRef();
      const [codeString, setCodeString] = useState<string | undefined>(
        dataAsString
      );

      const onChange = (value) => {
        props.getChange(value);
        setCodeString(value);
        this.setOutputData('output', value);
        this.executeOptimizedChain();
      };

      useEffect(() => {
        let dataAsString;
        if (typeof props.data !== 'string') {
          dataAsString = convertToString(props.data);
        } else {
          dataAsString = props.data;
        }
        setCodeString(dataAsString);
      }, [props.data]);

      useEffect(() => {
        if (editor.current) {
          // CodeMirror ref if needed
          // console.log(editor.current);
        }
      }, [editor.current]);
      console.log(props.editable);

      const editorDidMount = (editorRef, monaco) => {
        editor.current = editorRef;
        // editor.focus();
      };

      return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThemeProvider theme={customTheme}>
            <Box sx={{ position: 'relative' }}>
              <Button
                sx={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                }}
                color="secondary"
                variant="contained"
                size="small"
                onClick={nodeFocusOut}
              >
                Zoom 100%
              </Button>
              <MonacoEditor
                width="100%"
                height={`${props.nodeHeight}px`}
                language="javascript"
                theme="vs-dark"
                value={codeString || ''}
                options={{
                  automaticLayout: true,
                  lineNumbersMinChars: 4,
                  // minimap: { enabled: !loadAll },
                  readOnly: props.hasLink,
                  scrollBeyondLastLine: false,
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

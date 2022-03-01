import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { Box, Button, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/ErrorFallback';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CodeType } from './datatypes/codeType';
import { convertToString, getSelectionBounds } from '../utils/utils';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { NODE_TYPE_COLOR, customTheme } from '../utils/constants';

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

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const isHybrid = true;
    let editedData = '';

    super(name, graph, {
      color: TRgba.fromString(NODE_TYPE_COLOR.TRANSFORM),
      nodeWidth,
      nodeHeight,
      isHybrid,
      ...customArgs,
    });

    this.addInput('input', new CodeType(), customArgs?.data, false);
    this.addOutput('output', new CodeType(), true);

    this.name = 'CodeEditor';
    this.description = 'Edit your code';

    this.editable = false;

    this.getChange = (value) => {
      editedData = value;
    };

    const defaultProps = {
      graph: this.graph,
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

      graph.viewport.animate({
        position: this.previousPosition,
        time: 250,
        scale: this.previousScale,
        ease: 'easeInOutSine',
      });
      graph.selection.drawRectanglesFromSelection();
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
        graph.selection.selectedNodes // get bounds of the selectedNodes
      );
      this.previousPosition = graph.viewport.center;
      this.previousScale = graph.viewport.scale.x;
      const newPosition = new PIXI.Point(
        boundsToZoomTo.x + (window.innerWidth / 2 - 56), // move 56 from left
        boundsToZoomTo.y + (window.innerHeight / 2 - 128) // move 120px from top
      );

      graph.viewport.animate({
        position: newPosition,
        time: 250,
        scale: 1,
        ease: 'easeInOutSine',
      });
      graph.selection.drawRectanglesFromSelection();

      this.editable = true;
      this.renderReactComponent(ParentComponent, {
        ...defaultProps,
        nodeHeight: this.nodeHeight,
        editable: this.editable,
      });
    };

    this.onNodeFocusOut = () => {
      nodeFocusOut();
    };

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
      const editorTheme = EditorView.theme({
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

      return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThemeProvider theme={customTheme}>
            <Box sx={{ position: 'relative' }}>
              {props.editable && (
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
                  Exit
                </Button>
              )}
              <CodeMirror
                ref={editor}
                value={codeString}
                width="100%"
                height={`${props.nodeHeight}px`}
                theme={oneDark}
                editable={props.editable}
                autoFocus={props.editable}
                extensions={[
                  javascript({ jsx: true }),
                  EditorView.lineWrapping,
                  editorTheme,
                ]}
                basicSetup={true}
                onChange={onChange}
              />
            </Box>
          </ThemeProvider>
        </ErrorBoundary>
      );
    };
  }
}

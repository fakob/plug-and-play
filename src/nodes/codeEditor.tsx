import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import CodeMirror, {
  EditorView,
  KeyBinding,
  keymap,
} from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CodeType } from './datatypes/codeType';
import { convertToString, zoomToFitSelection } from '../utils/utils';
import { CustomArgs } from '../utils/interfaces';
import { DEFAULT_EDITOR_DATA, NODE_TYPE_COLOR } from '../utils/constants';

export class CodeEditor extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  parsedData: any;
  update: () => void;
  getChange: (value: string) => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const isHybrid = true;
    let editedData = '';

    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.TRANSFORM,
      nodeWidth,
      nodeHeight,
      isHybrid,
    });

    this.addInput('input', new CodeType(), customArgs?.data, false);
    this.addOutput('output', new CodeType(), true);

    this.name = 'CodeEditor';
    this.description = 'Edit your code';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('input') ?? DEFAULT_EDITOR_DATA;
      console.log('data onNodeAdded:', data);
      const hasLink = this.getInputSocketByName('input').hasLink();
      this.createContainerComponent(document, ParentComponent, {
        data,
        hasLink,
        nodeHeight: this.nodeHeight,
        graph: this.graph,
        getChange: this.getChange,
      });
    };

    this.onNodeDoubleClick = () => {
      // center the editor and set zoom to 100%
      // as a scaled editor has issues with selection and cursor placement
      zoomToFitSelection(graph);
      graph.viewport.setZoom(1, true); // zoom to 100%
      graph.selection.drawRectanglesFromSelection();

      this.renderReactComponent(ParentComponent, {
        editable: true,
        getChange: this.getChange,
      });
    };

    this.onNodeFocusOut = () => {
      this.renderReactComponent(ParentComponent, {
        editable: false,
        getChange: this.getChange,
      });
      console.log(editedData);
      console.log(this.getInputData('input'));
      this.setInputData('input', editedData);
    };

    this.onNodeResize = (newWidth, newHeight) => {
      this.renderReactComponent(ParentComponent, {
        nodeHeight: newHeight,
        data: editedData,
        getChange: this.getChange,
      });
    };

    this.onExecute = async function (input) {
      const newData = input['input'];
      this.renderReactComponent(ParentComponent, {
        data: newData,
        nodeHeight: this.nodeHeight,
        getChange: this.getChange,
      });
    };

    this.getChange = (value) => {
      editedData = value;
    };

    type MyProps = {
      data: string;
      randomMainColor: string;
      hasLink: boolean;
      nodeHeight: number;
      graph: PPGraph;
      editable?: boolean;
      getChange?: (value: string) => void;
    };

    // small presentational component
    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
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

      let dataAsString;
      if (typeof props.data !== 'string') {
        dataAsString = convertToString(props.data);
      } else {
        dataAsString = props.data;
      }
      const [codeString, setCodeString] = useState<string | undefined>(
        dataAsString
      );
      const editor = useRef();

      const onChange = (value) => {
        console.log(props.getChange);
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
        console.log(dataAsString);
        setCodeString(dataAsString);
      }, [props.data]);

      useEffect(() => {
        if (editor.current) {
          // console.log(editor.current);
        }
      }, [editor.current]);

      /*
       * Create a KeyMap extension
       */
      function getKeymap() {
        // Save command
        const save = (editor) => {
          // saveCode();
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
          ref={editor}
          value={codeString}
          width="100%"
          height={`${props.nodeHeight}px`}
          theme={oneDark}
          editable={props.editable}
          extensions={[
            javascript({ jsx: true }),
            EditorView.lineWrapping,
            getKeymap(),
            theme,
          ]}
          basicSetup={true}
          onChange={onChange}
        />
      );
    };
  }
}

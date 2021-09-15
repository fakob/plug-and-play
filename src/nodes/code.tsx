import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import {
  Button,
  ButtonGroup,
  EditableText,
  H1,
  H2,
  H3,
  Divider,
} from '@blueprintjs/core';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs } from '../utils/interfaces';
import { DATATYPE, NODE_TYPE_COLOR } from '../utils/constants';

export class Code extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  parsedData: any;
  update: () => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const isHybrid = true;

    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.TRANSFORM,
      nodeWidth,
      nodeHeight,
      isHybrid,
    });

    this.addInput('code', DATATYPE.STRING, customArgs?.data ?? '');

    this.name = 'Code';
    this.description = 'Code your own node';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('code') ?? '';
      this.createContainerComponent(document, TableParent, {
        code: data,
      });
    };

    // // when the Node is loaded, update the react component
    // this.onConfigure = (): void => {
    //   this.update();
    // };

    // when the Node is loaded, update the react component
    // this.update = (): void => {
    //   const data = this.getInputData('data') ?? '';
    //   this.parsedData = this.parseData(data);
    //   this.renderReactComponent(TableParent, {
    //     dataArray: this.parsedData,
    //   });
    //   this.setOutputData('selectedData', this.parsedData);
    // };

    // small presentational component
    const TableParent = (props) => {
      const editorRef = useRef<any>();
      const [codeString, setCodeString] = useState<string | undefined>(
        props.code
      );

      const saveCode = () => {
        console.log('Create/Update node command from Editor');
        const model = editorRef.current.getModel();
        const value = model.getValue();
        setCodeString(value);
        props.onSave(value);
      };

      const editorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        editor.addAction({
          id: 'my-unique-id',
          label: 'Create/Update node',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          contextMenuGroupId: 'Test',
          contextMenuOrder: 1,
          run: function (ed) {
            console.log(ed);
            saveCode();
          },
        });

        console.log('editorDidMount', editor);
        editor.focus();
      };

      // useEffect(() => {
      //   // update codeString when the type changes
      //   const selectedNodeType = props.selectedNode.type;
      //   const value = props.currentGraph.customNodeTypes[selectedNodeType];
      //   setCodeString(value);
      // }, [props.selectedNode.type]);

      return (
        <MonacoEditor
          language="javascript"
          theme="vs-dark"
          height="70%"
          value={codeString}
          options={{
            selectOnLineNumbers: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
          onChange={(newValue, e) => {
            // console.log('controlled', newValue, e);
          }}
          editorDidMount={editorDidMount}
        />
      );
    };
  }
}

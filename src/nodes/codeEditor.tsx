import * as PIXI from 'pixi.js';
import React, { useState } from 'react';
import { CodeEditor as CodeEditorComponent } from '../components/Editor';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs } from '../utils/interfaces';
import { StringType } from './datatypes/stringType';
import { NODE_TYPE_COLOR } from '../utils/constants';

export class CodeEditor extends PPNode {
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

    this.addInput(
      'code',
      new StringType(),
      customArgs?.data ?? "const test = 'jakob';",
      false
    );

    this.name = 'CodeEditor';
    this.description = 'Edit your code';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('code') ?? 'First data';
      const hasLink = this.getInputSocketByName('code').hasLink();
      const scale = this.graph.viewport.scale.x;
      this.createContainerComponent(document, ParentComponent, {
        code: data,
        hasLink,
        nodeHeight,
        scale,
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
    //   this.renderReactComponent(ParentComponent, {
    //     dataArray: this.parsedData,
    //   });
    //   this.setOutputData('selectedData', this.parsedData);
    // };

    type MyProps = {
      code: string;
      randomMainColor: string;
      hasLink: boolean;
      nodeHeight: number;
      scale: number;
    };

    // small presentational component
    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      const [codeString, setCodeString] = useState<string | undefined>(
        props.code || ''
      );

      // useEffect(() => {
      //   // update codeString when the type changes
      //   const selectedNodeType = props.selectedNode.type;
      //   const value = props.currentGraph.customNodeTypes[selectedNodeType];
      //   setCodeString(value);
      // }, [props.selectedNode.type]);

      return (
        <CodeEditorComponent
          value={codeString}
          randomMainColor={props.randomMainColor}
          editable={!props.hasLink}
          onChange={(value) => {
            console.log(value);
            // setCodeString(value);
          }}
          height={`${props.nodeHeight}px`}
          scale={props.scale}
        />
      );
    };
  }
}

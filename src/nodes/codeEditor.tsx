import * as PIXI from 'pixi.js';
import React, { useEffect, useState } from 'react';
import { CodeEditor as CodeEditorComponent } from '../components/Editor';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs } from '../utils/interfaces';
import { CodeType } from './datatypes/codeType';
import { DEFAULT_EDITOR_DATA, NODE_TYPE_COLOR } from '../utils/constants';

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

    this.addInput('input', new CodeType(), customArgs?.data, false);
    this.addOutput('output', new CodeType(), true);

    this.name = 'CodeEditor';
    this.description = 'Edit your code';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('input');
      console.log('data onNodeAdded:', data);
      const hasLink = this.getInputSocketByName('input').hasLink();
      this.createContainerComponent(document, ParentComponent, {
        code: data,
        hasLink,
        nodeHeight,
        graph: this.graph,
      });
    };

    // when the Node is loaded, update the react component with the stored data
    this.onConfigure = (): void => {
      const storedData = this.getInputData('input') ?? DEFAULT_EDITOR_DATA;
      this.renderReactComponent(ParentComponent, {
        code: storedData,
      });
      this.setOutputData('output', storedData);
      this.executeOptimizedChain();
    };

    type MyProps = {
      code: string;
      randomMainColor: string;
      hasLink: boolean;
      nodeHeight: number;
      graph: PPGraph;
    };

    // small presentational component
    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      const [codeString, setCodeString] = useState<string | undefined>(
        props.code || ''
      );
      const [scale, setScale] = useState(props.graph?.viewport.scale.x ?? 1);
      console.log(props.code);
      function updateScale() {
        setScale(props.graph.viewport.scale.x);
      }

      // on mount subscribing to moved event
      useEffect(() => {
        props.graph.viewport.on('moved', updateScale);
        return function cleanup() {
          props.graph.viewport.removeListener('moved', updateScale);
        };
      }, []);

      useEffect(() => {
        setCodeString(props.code);
      }, [props.code]);

      return (
        <CodeEditorComponent
          value={codeString}
          randomMainColor={props.randomMainColor}
          editable={!props.hasLink}
          onChange={(value) => {
            console.log(value);
            setCodeString(value);
            this.setInputData('input', value);
            this.setOutputData('output', value);
            this.executeOptimizedChain();
          }}
          height={`${props.nodeHeight}px`}
          scale={scale}
        />
      );
    };
  }
}

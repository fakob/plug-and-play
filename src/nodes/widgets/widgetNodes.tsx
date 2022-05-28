import React from 'react';
import { Button } from '@mui/material';
import PureNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import { CustomArgs } from '../../utils/interfaces';
import { SOCKET_TYPE } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';

const constantInName = 'In';
const constantOutName = 'Out';

export class CConstant extends PureNode {
  update: () => void;
  onWidgetTrigger: () => void;

  protected getIsHybrid(): boolean {
    return true;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 400;
    const margin = 4;

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
    });

    this.name = 'CConstant';
    this.description = 'Adds a CConstant';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(
        document,
        TableParent,
        {
          nodeWidth: this.nodeWidth,
          nodeHeight: this.nodeHeight,
          margin,
        },
        {
          overflow: 'visible',
          borderRadius: `${this.nodeWidth / 6}px`,
        }
      );
      this.container.style.pointerEvents = 'auto';
    };

    this.update = (): void => {
      this.renderReactComponent(TableParent, {
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
        margin,
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();
    };

    this.onWidgetTrigger = () => {
      console.log('onWidgetTrigger');
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.container.style.width = `${
        this.nodeWidth - (2 * margin) / this.graph.viewport.scale.x
      }px`;
      this.container.style.height = `${
        this.nodeHeight - (2 * margin) / this.graph.viewport.scale.x
      }px`;
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    const TableParent = (props) => {
      const handleOnPointerDown = () => {
        const inputData = this.getInputData(constantInName);
        this.setOutputData(constantOutName, inputData);
        this.executeChildren();
      };

      const handleOnPointerUp = () => {
        this.setOutputData(constantOutName, 0);
        this.executeChildren();
      };

      return (
        <Button
          variant="contained"
          onPointerDown={handleOnPointerDown}
          onPointerUp={handleOnPointerUp}
          sx={{
            fontSize: '16px',
            border: 0,
            width: `${
              this.nodeWidth - (2 * margin) / this.graph.viewport.scale.x
            }px`,
            height: `${
              this.nodeHeight - (2 * margin) / this.graph.viewport.scale.x
            }px`,
            borderRadius: `${this.nodeWidth / 6}px`,
            boxShadow: 16,
            '&:hover': {
              boxShadow: 12,
            },
            '&:active': {
              boxShadow: 4,
            },
          }}
        >
          {this.name}
        </Button>
      );
    };
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, constantInName, new AnyType(), 0),
      new Socket(SOCKET_TYPE.OUT, constantOutName, new AnyType()),
    ];
  }

  protected async onExecute(
    inputObject: any,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    console.log(inputObject, inputObject?.[constantInName]);
    outputObject[constantOutName] = inputObject?.[constantInName];
  }
}

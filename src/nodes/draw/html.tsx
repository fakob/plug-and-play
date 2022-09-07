import React, { useEffect, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import { CodeType } from '../datatypes/codeType';

import { convertToString } from '../../utils/utils';
import { CustomArgs } from '../../utils/interfaces';
import { SOCKET_TYPE, customTheme } from '../../utils/constants';

const outputSocketName = 'output';
const inputSocketName = 'input';

export class HtmlRenderer extends PPNode {
  update: (newHeight?) => void;

  protected getIsHybrid(): boolean {
    return true;
  }

  protected getActivateByDoubleClick(): boolean {
    return true;
  }

  public getName(): string {
    return 'Html renderer';
  }

  public getDescription(): string {
    return 'Renders html';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      // new PPSocket(
      //   SOCKET_TYPE.OUT,
      //   outputSocketName,
      //   new CodeType(),
      //   undefined,
      //   true
      // ),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketName,
        new CodeType(),
        `<div
  style="
    width: 100%;
    height: 100%;
    background: #4092a4;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  "
>
  <a
    style="
      width: 140px;
      height: 100px;
      background: #E154BB;
      display: inline-flex;
      align-items: center;
      border-radius: 8px;
      border-width: 0px;
      border-radius: 4px;
      border-width: 0px;
      color: #F5F5F5;
    "
    href="https://github.com/fakob/plug-and-play/"
    >Plug and Playground on Github</a
  >
</div>
`,
        false
      ),
    ];
  }

  getOpacity(): number {
    return 0.01;
  }

  constructor(name: string, customArgs?: CustomArgs) {
    const nodeWidth = 200;
    const nodeHeight = 150;

    super(name, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      minNodeWidth: nodeWidth / 2,
      minNodeHeight: nodeHeight / 2,
    });

    if (customArgs?.initialData) {
      this.setInputData(inputSocketName, customArgs?.initialData);
    }

    // when the Node is added, create the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData(inputSocketName);

      this.createContainerComponent(document, ParentComponent, {
        nodeHeight: this.nodeHeight,
        data,
      });
    };

    this.update = (newHeight): void => {
      const newData = this.getInputData(inputSocketName);

      this.renderReactComponent(ParentComponent, {
        nodeHeight: newHeight ?? this.nodeHeight,
        data: newData,
      });
    };

    this.onNodeDoubleClick = () => {
      PPGraph.currentGraph.selection.drawRectanglesFromSelection();
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
      readOnly: boolean;
    };

    // small presentational component
    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      function MyComponent() {
        return (
          <Box
            sx={{
              position: 'relative',
              height: '100%',
            }}
            dangerouslySetInnerHTML={{ __html: props.data }}
          />
        );
      }

      return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThemeProvider theme={customTheme}>
            <MyComponent />
          </ThemeProvider>
        </ErrorBoundary>
      );
    };
  }
}

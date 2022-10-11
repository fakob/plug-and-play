import React, { useEffect, useRef } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import Frame from 'react-frame-component';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import { CodeType } from '../datatypes/codeType';

import { CustomArgs } from '../../utils/interfaces';
import { SOCKET_TYPE, customTheme } from '../../utils/constants';
import HybridNode from '../../classes/HybridNode';

const outputSocketName = 'output';
const inputSocketName = 'input';

export class HtmlRenderer extends HybridNode {
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
    target="_parent"
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

      this.createContainerComponent(
        document,
        ParentComponent,
        {
          nodeHeight: this.nodeHeight,
          data,
        },
        {
          overflow: 'visible',
        }
      );
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
      const iframeRef = useRef();

      useEffect(() => {
        if (iframeRef.current) {
          (iframeRef.current as any).focus();
        }
      }, []);

      function MyComponent() {
        return (
          <ThemeProvider theme={customTheme}>
            <Box
              style={{
                position: 'relative',
                height: '100vh',
              }}
              dangerouslySetInnerHTML={{ __html: props.data }}
            />
          </ThemeProvider>
        );
      }

      return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Frame
            ref={iframeRef}
            style={{
              width: '100%',
              height: 'calc(100% - 8px)',
              borderWidth: 0,
            }}
            initialContent="<!DOCTYPE html><html><head></head><body><div></div></body></html>"
          >
            <MyComponent />
          </Frame>
        </ErrorBoundary>
      );
    };
  }
}

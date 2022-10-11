import React, { useEffect, useRef, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import Frame from 'react-frame-component';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { CodeType } from '../datatypes/codeType';

import { CustomArgs } from '../../utils/interfaces';
import { SOCKET_TYPE, customTheme } from '../../utils/constants';
import HybridNode from '../../classes/HybridNode';

const inputSocketName = 'Html';

export class HtmlRenderer extends HybridNode {
  update: (newHeight?) => void;

  protected getIsHybrid(): boolean {
    return true;
  }

  getShowLabels(): boolean {
    return false;
  }

  getOpacity(): number {
    return 0.05;
  }

  getPreferredInputSocketName(): string {
    return inputSocketName;
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
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketName,
        new CodeType(),
        `<h2>HTML Node</h2>
<p>Embed an iframe or write your own HTML</p>
<form>
  <button
  formtarget="_parent" formaction="https://github.com/fakob/plug-and-play/">Click me!</button>
</form>
`,
        false
      ),
    ];
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
      const [htmlData, setHtmlData] = useState(props.data);

      useEffect(() => {
        if (iframeRef.current) {
          (iframeRef.current as any).focus();
        }
      }, []);

      useEffect(() => {
        console.log('htmlData has changed');
        setHtmlData(props.data);
      }, [props.data]);

      function MyComponent() {
        return (
          <ThemeProvider theme={customTheme}>
            <Box
              style={{
                position: 'relative',
                height: '100vh',
              }}
              dangerouslySetInnerHTML={{ __html: htmlData }}
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

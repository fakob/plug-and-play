import React, { useEffect, useRef, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import Frame from 'react-frame-component';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import { CodeType } from '../datatypes/codeType';

import { CustomArgs, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  customTheme,
} from '../../utils/constants';
import HybridNode from '../../classes/HybridNode';

const inputSocketName = 'Html';

type MyProps = {
  doubleClicked: boolean; // is injected by the NodeClass
  data: string;
  randomMainColor: string;
  nodeHeight: number;
  readOnly: boolean;
};

export class HtmlRenderer extends HybridNode {
  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    if (this.initialData) {
      this.setInputData(inputSocketName, this.initialData);
    }
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

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
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
  formtarget="_blank" formaction="https://github.com/fakob/plug-and-play/">Click me!</button>
</form>
`,
        false
      ),
    ];
  }

  public getMinNodeHeight(): number {
    return 30;
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 150;
  }

  // when the Node is added, create the container and react component
  public onNodeAdded = () => {
    const data = this.getInputData(inputSocketName);

    this.createContainerComponent(
      this.ParentComponent,
      {
        nodeHeight: this.nodeHeight,
        data,
      },
      {
        overflow: 'visible',
      }
    );
    super.onNodeAdded();
  };

  public update = (newHeight): void => {
    const newData = this.getInputData(inputSocketName);

    this.renderReactComponent(this.ParentComponent, {
      nodeHeight: newHeight ?? this.nodeHeight,
      data: newData,
    });
  };

  public onNodeDoubleClick = () => {
    PPGraph.currentGraph.selection.drawRectanglesFromSelection();
  };

  public onExecute = async function () {
    this.update();
  };

  // small presentational component
  public ParentComponent: React.FunctionComponent<MyProps> = (props) => {
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
              height: 'calc(100vh - 16px)',
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
            height: '100%',
            borderWidth: 0,
          }}
          initialContent="<!DOCTYPE html><html><head><style>* {border: none;}</style></head><body style='overflow:hidden; border-width: 0px;'><div></div></body></html>"
        >
          <MyComponent />
        </Frame>
      </ErrorBoundary>
    );
  };
}

export class EmbedWebsite extends HtmlRenderer {
  public getName(): string {
    return 'Embed a website';
  }

  public getDescription(): string {
    return 'Embed a website using an iframe (based on HtmlRenderer)';
  }

  public getDefaultNodeWidth(): number {
    return 800;
  }

  public getDefaultNodeHeight(): number {
    return 400;
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketName,
        new CodeType(),
        `<iframe src="https://en.wikipedia.org/wiki/Special:Random" style="width: 100%; height: 100%;"></iframe>`,
        false
      ),
    ];
  }
}

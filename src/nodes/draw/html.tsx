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
import HybridNode2 from '../../classes/HybridNode2';

const inputSocketName = 'Html';

export class HtmlRenderer extends HybridNode2 {
  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    if (this.initialData) {
      this.setInputData(inputSocketName, this.initialData);
    }
  }

  public getName(): string {
    return 'Html renderer';
  }

  public getDescription(): string {
    return 'Renders html';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
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

  // small presentational component
  protected getParentComponent(props: any): any {
    const iframeRef = useRef();
    const [htmlData, setHtmlData] = useState(props[inputSocketName]);

    useEffect(() => {
      if (iframeRef.current) {
        (iframeRef.current as any).focus();
      }
    }, []);

    useEffect(() => {
      console.log('htmlData has changed');
      setHtmlData(props[inputSocketName]);
    }, [props[inputSocketName]]);

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
          id={props.node.id}
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
  }
}

export class EmbedWebsite extends HtmlRenderer {
  public getName(): string {
    return 'Embed website';
  }

  public getDescription(): string {
    return 'Embed a website using an iframe. You can also just paste a URL into the playground';
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

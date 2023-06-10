import React, { memo, useEffect, useRef, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import Frame from 'react-frame-component';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import { CodeType } from '../datatypes/codeType';
import { TriggerType } from '../datatypes/triggerType';

import { TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
  customTheme,
} from '../../utils/constants';
import HybridNode2 from '../../classes/HybridNode2';

const inputSocketName = 'Html';
const reloadSocketName = 'Reload';
const defaultCode = `<h2>HTML Node</h2>
<p>Embed an iframe or write your own HTML</p>
<form>
  <button
  formtarget="_blank" formaction="https://github.com/fakob/plug-and-play/">Click me!</button>
</form>
`;

export class HtmlRenderer extends HybridNode2 {
  eventTarget: EventTarget;

  public onNodeAdded = async (): Promise<void> => {
    this.eventTarget = new EventTarget();
    if (this.initialData) {
      this.setInputData(inputSocketName, this.initialData);
    }
    super.onNodeAdded();
  };

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
        defaultCode,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        reloadSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'reload'),
        0,
        false
      ),
    ];
  }

  reload = () => {
    this.eventTarget.dispatchEvent(new Event('callReload'));
  };

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
    const node = props.node;
    const iframeRef = useRef();
    const [htmlData, setHtmlData] = useState(props[inputSocketName]);
    const [reload, setReload] = useState(props[reloadSocketName]);

    useEffect(() => {
      if (iframeRef.current) {
        (iframeRef.current as any).focus();
      }
      node.eventTarget.addEventListener('callReload', () => {
        callReload();
      });
    }, []);

    useEffect(() => {
      console.log('htmlData has changed');
      setHtmlData(props[inputSocketName]);
    }, [props[inputSocketName]]);

    const callReload = () => {
      setReload(Math.random());
    };

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <MemoizedComponent
          id={props.node.id}
          theme={customTheme}
          iframeRef={iframeRef}
          htmlData={htmlData}
          reload={reload}
        />
      </ErrorBoundary>
    );
  }
}

const MemoizedComponent = memo<any>(function MemoizedComponent({
  id,
  iframeRef,
  theme,
  htmlData,
  reload,
}) {
  return (
    <Frame
      key={reload}
      id={id}
      ref={iframeRef}
      style={{
        width: '100%',
        height: '100%',
        borderWidth: 0,
      }}
      initialContent="<!DOCTYPE html><html><head><style>* {border: none;}</style></head><body style='overflow:hidden; border-width: 0px;'><div></div></body></html>"
    >
      <ThemeProvider theme={theme}>
        <Box
          style={{
            position: 'relative',
            height: 'calc(100vh - 16px)',
          }}
          dangerouslySetInnerHTML={{ __html: htmlData }}
        />
      </ThemeProvider>
    </Frame>
  );
});

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
    const codeSocket = super
      .getDefaultIO()
      .find((socket) => socket.name === inputSocketName);
    codeSocket.data = `<iframe src="https://en.wikipedia.org/wiki/Special:Random" style="width: 100%; height: 100%;"></iframe>`;
    return super.getDefaultIO();
  }
}

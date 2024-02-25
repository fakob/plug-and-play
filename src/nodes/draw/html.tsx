import React, { memo, useEffect, useRef, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import Frame from 'react-frame-component';
import ErrorFallback from '../../components/ErrorFallback';
import PPNode from '../../classes/NodeClass';
import PPSocket from '../../classes/SocketClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { CodeType } from '../datatypes/codeType';
import { JSONType } from '../datatypes/jsonType';
import { TriggerType } from '../datatypes/triggerType';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
  customTheme,
} from '../../utils/constants';
import HybridNode2 from '../../classes/HybridNode2';

const inputSocketNameHeader = 'Header';
const inputSocketNameHtml = 'Html';
const reloadSocketName = 'Reload';
const mainHtmlElementName = 'Main Html element';

export class HtmlRenderer extends HybridNode2 {
  eventTarget: EventTarget;

  public onNodeAdded = async (source: TNodeSource): Promise<void> => {
    this.eventTarget = new EventTarget();
    await super.onNodeAdded(source);
    if (this.initialData) {
      this.setInputData(inputSocketNameHtml, this.initialData);
      this.executeOptimizedChain();
    }
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
    return 0.001;
  }

  getPreferredInputSocketName(): string {
    return inputSocketNameHtml;
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
  }

  getDefaultHeader(): string {
    return '<script src="https://cdn.tailwindcss.com"></script>';
  }

  getDefaultHTMLCode(): string {
    return `<div class="p-4">
<h2>HTML Node</h2>
<p class="mb-2 text-sky-500 dark:text-sky-400">Embed an iframe or write your own HTML</p>
<form>
  <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" formtarget="_blank" formaction="https://github.com/fakob/plug-and-play/">Click me!</button>
</form>
</div>
`;
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(true, true, false, 1000, this);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketNameHeader,
        new CodeType(),
        this.getDefaultHeader(),
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputSocketNameHtml,
        new CodeType(),
        this.getDefaultHTMLCode(),
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        reloadSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'reload'),
        0,
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.OUT,
        mainHtmlElementName,
        new JSONType(),
        {},
        true,
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
  protected getParentComponent(props: any): React.ReactElement {
    return <MyFunctionalComponent {...props} />;
  }
}

const MyFunctionalComponent = (props): React.ReactElement => {
  const node = props.node;
  const iframeRef = useRef();
  const [headerData, setHeaderData] = useState(props[inputSocketNameHeader]);
  const [htmlData, setHtmlData] = useState(props[inputSocketNameHtml]);
  const [reload, setReload] = useState(props[reloadSocketName]);

  useEffect(() => {
    (iframeRef.current as any).focus();
    node.eventTarget.addEventListener('callReload', () => {
      callReload();
    });
  }, []);

  useEffect(() => {
    console.log('headerData has changed');
    setHeaderData(props[inputSocketNameHeader]);
  }, [props[inputSocketNameHeader]]);

  useEffect(() => {
    console.log('htmlData has changed');
    setHtmlData(props[inputSocketNameHtml]);
  }, [props[inputSocketNameHtml]]);

  const callReload = () => {
    setReload(Math.random());
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MemoizedComponent
        node={node}
        id={props.node.id}
        theme={customTheme}
        iframeRef={iframeRef}
        headerData={headerData}
        htmlData={htmlData}
        reload={reload}
      />
    </ErrorBoundary>
  );
};
interface MemoizedComponentProps {
  node: PPNode;
  id: string;
  theme: any;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  headerData: any;
  htmlData: any;
  reload: any;
}

const MemoizedComponent = memo<MemoizedComponentProps>(
  function MemoizedComponent({
    node,
    id,
    iframeRef,
    theme,
    headerData,
    htmlData,
    reload,
  }) {
    const idWithDiv = `${id}-div`;

    useEffect(() => {
      if (iframeRef.current as any) {
        const iframe = iframeRef.current;

        function setupObserver() {
          const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
              if (mutation.type === 'childList' && iframe.contentDocument) {
                const outerElement =
                  iframe.contentDocument.getElementById(idWithDiv);
                if (outerElement) {
                  const myHtmlElement = outerElement.children[0];
                  if (myHtmlElement) {
                    node.setOutputData(mainHtmlElementName, myHtmlElement);
                    node.executeChildren();
                    observer.disconnect();
                    break;
                  }
                }
              }
            }
          });

          const config = { attributes: false, childList: true, subtree: true };
          observer.observe(iframe.contentDocument.body, config);
        }

        iframe.onload = setupObserver;
      }
    }, [iframeRef.current]);

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
        initialContent={`<!DOCTYPE html><html><head><style>* {border: none;}</style>${headerData}</head><body style='overflow:auto; border-width: 0px; background: white;'><div></div></body></html>`}
      >
        <ThemeProvider theme={theme}>
          <Box
            id={idWithDiv}
            style={{
              position: 'relative',
              height: 'calc(100vh - 16px)',
            }}
            dangerouslySetInnerHTML={{ __html: htmlData }}
          />
        </ThemeProvider>
      </Frame>
    );
  },
);

export class HtmlRendererDiv extends HtmlRenderer {
  public getName(): string {
    return 'Html renderer (Div)';
  }

  public getDescription(): string {
    return 'Renders a div element';
  }

  public getDefaultNodeWidth(): number {
    return 800;
  }

  public getDefaultNodeHeight(): number {
    return 400;
  }

  public getDefaultHeader(): string {
    return '';
  }

  public getDefaultHTMLCode(): string {
    return '<div id="myDiv"></div>';
  }
}

export class HtmlRendererCanvas extends HtmlRendererDiv {
  public getName(): string {
    return 'Html renderer (Canvas)';
  }

  public getDescription(): string {
    return 'Renders a canvas element';
  }

  public getDefaultHTMLCode(): string {
    return '<canvas style="width:100%;" id="myCanvas"></canvas>';
  }
}

export class EmbedWebsite extends HtmlRendererDiv {
  public getName(): string {
    return 'Embed website';
  }

  public getDescription(): string {
    return 'Embed a website using an iframe. You can also just paste a URL into the playground';
  }

  public getDefaultHTMLCode(): string {
    return '<iframe src="https://en.wikipedia.org/wiki/Special:Random" style="width: 100%; height: 100%;"></iframe>';
  }
}

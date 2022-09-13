import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { createEditor, Descendant } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, Editable, withReact, useFocused } from 'slate-react';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { COLOR, SOCKET_TYPE, customTheme } from '../../utils/constants';
import {
  Leaf,
  Element,
  toggleBlock,
  toggleMark,
  withInlines,
} from './slate-editor-components';
import { ColorType } from '../datatypes/colorType';
import { JSONType } from '../datatypes/jsonType';

const isMac = navigator.platform.indexOf('Mac') != -1;

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'A line of text in a paragraph.' }],
  },
];

const outputSocketName = 'output';
const inputSocketName = 'input';
const backgroundColorSocketName = 'background Color';

export class TextEditor extends PPNode {
  update: (newHeight?) => void;
  readOnly: boolean;

  protected getIsHybrid(): boolean {
    return true;
  }

  protected getActivateByDoubleClick(): boolean {
    return true;
  }

  public getName(): string {
    return 'Rich text editor';
  }

  public getDescription(): string {
    return 'Edit your text';
  }

  protected getDefaultIO(): PPSocket[] {
    const backgroundColor = COLOR[5];

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
        new JSONType(),
        initialValue,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        backgroundColorSocketName,
        new ColorType(),
        TRgba.fromString(backgroundColor),
        false
      ),
    ];
  }

  getOpacity(): number {
    return 0.01;
  }

  constructor(name: string, customArgs?: CustomArgs) {
    const nodeWidth = 400;
    const nodeHeight = 300;

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

    this.readOnly = false;

    // when the Node is added, create the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData(inputSocketName);
      const color: TRgba = this.getInputData(backgroundColorSocketName);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();

      this.createContainerComponent(document, ParentComponent, {
        nodeHeight: this.nodeHeight,
        data,
        color,
        readOnly: this.readOnly,
      });
    };

    this.update = (newHeight): void => {
      const newData = this.getInputData(inputSocketName);
      const color: TRgba = this.getInputData(backgroundColorSocketName);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();

      this.renderReactComponent(ParentComponent, {
        nodeHeight: newHeight ?? this.nodeHeight,
        data: newData,
        color,
        readOnly: this.readOnly,
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
      data: Descendant[];
      color: TRgba;
      randomMainColor: string;
      nodeHeight: number;
      readOnly: boolean;
    };

    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      // const [editor] = useState(() => withReact(createEditor()));
      const editor = useMemo(
        () => withInlines(withHistory(withReact(createEditor()))),
        []
      );
      const inFocus = useFocused();
      const [data, setData] = useState<Descendant[] | undefined>(props.data);
      const [showHooveringToolbar, setShowHooveringToolbar] = useState(false);
      const renderElement = useCallback((props) => <Element {...props} />, []);
      const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

      const onChange = (value) => {
        console.log(value);
        this.setInputData(inputSocketName, value);
        this.setOutputData(outputSocketName, value);
        this.executeChildren();
      };

      useEffect(() => {
        console.log(props.color);
      }, [props.color]);

      useEffect(() => {
        console.log(editor.selection, inFocus);
        setShowHooveringToolbar(editor.selection && inFocus);
      }, [editor.selection, inFocus]);

      return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThemeProvider theme={customTheme}>
            <Box
              sx={{
                position: 'relative',
                padding: 4,
                background: props.color.rgb(),
                boxSizing: 'border-box',
                height: '100%',
              }}
            >
              <Slate editor={editor} value={data} onChange={onChange}>
                <Editable
                  readOnly={props.readOnly}
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  placeholder="Enter some rich text…"
                  spellCheck={!props.readOnly}
                  onKeyDown={(event) => {
                    const modKey = isMac ? event.metaKey : event.ctrlKey;
                    console.log(event.key, event.code);
                    if (modKey && !event.shiftKey) {
                      switch (event.key) {
                        case 'b':
                          event.preventDefault();
                          return toggleMark(editor, 'bold');
                        case 'i':
                          event.preventDefault();
                          return toggleMark(editor, 'italic');
                        case 'u':
                          event.preventDefault();
                          return toggleMark(editor, 'underlined');
                      }
                    }
                    if (modKey && event.altKey) {
                      switch (event.code) {
                        case 'Digit1':
                          event.preventDefault();
                          return toggleBlock(editor, 'heading-one');
                        case 'Digit2':
                          event.preventDefault();
                          return toggleBlock(editor, 'heading-two');
                        case 'Digit3':
                          event.preventDefault();
                          return toggleBlock(editor, 'heading-three');
                        case 'Digit4':
                          event.preventDefault();
                          return toggleBlock(editor, 'heading-four');
                        case 'Digit5':
                          event.preventDefault();
                          return toggleBlock(editor, 'heading-five');
                        case 'Digit6':
                          event.preventDefault();
                          return toggleBlock(editor, 'heading-six');
                      }
                    }
                    if (modKey && event.shiftKey) {
                      switch (event.code) {
                        case 'Digit7':
                          event.preventDefault();
                          return toggleBlock(editor, 'numbered-list');
                        case 'Digit8':
                          event.preventDefault();
                          return toggleBlock(editor, 'bulleted-list');
                        case 'Digit9':
                          event.preventDefault();
                          return toggleBlock(editor, 'block-quote');
                      }
                      switch (event.key) {
                        case 'c':
                          event.preventDefault();
                          return toggleMark(editor, 'code');
                        case 'l':
                          event.preventDefault();
                          return toggleBlock(editor, 'left');
                        case 'e':
                          event.preventDefault();
                          return toggleBlock(editor, 'center');
                        case 'r':
                          event.preventDefault();
                          return toggleBlock(editor, 'right');
                        case 'j':
                          event.preventDefault();
                          return toggleBlock(editor, 'justify');
                      }
                    }
                  }}
                />
              </Slate>
            </Box>
          </ThemeProvider>
        </ErrorBoundary>
      );
    };
  }
}

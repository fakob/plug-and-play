import React, { useEffect, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import {
  BaseEditor,
  Editor,
  Transforms,
  Text,
  createEditor,
  Descendant,
  Range,
} from 'slate';
import { withHistory } from 'slate-history';
import {
  Slate,
  Editable,
  ReactEditor,
  withReact,
  useSlate,
  useFocused,
} from 'slate-react';
import ErrorFallback from '../components/ErrorFallback';
import PPSocket from '../classes/SocketClass';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs, TRgba } from '../utils/interfaces';
import { COLOR, SOCKET_TYPE, customTheme } from '../utils/constants';
import {
  HoveringToolbar,
  Leaf,
  toggleFormat,
  isFormatActive,
} from '../utils/slate-editor-components';
import { ColorType } from './datatypes/colorType';
import { JSONType } from './datatypes/jsonType';

type CustomElement = { type: 'paragraph'; children: CustomText[] };
type CustomText = { text: string };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

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
      const [editor] = useState(() => withReact(withHistory(createEditor())));
      const inFocus = useFocused();
      const [data, setData] = useState<Descendant[] | undefined>(props.data);
      const [showHooveringToolbar, setShowHooveringToolbar] = useState(false);

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
              <Slate
                editor={editor}
                value={data}
                // readOnly={props.readOnly}
                onChange={onChange}
              >
                {showHooveringToolbar && <HoveringToolbar />}
                <Editable
                  renderLeaf={(props) => <Leaf {...props} />}
                  placeholder="Enter some text..."
                  onDOMBeforeInput={(event: InputEvent) => {
                    switch (event.inputType) {
                      case 'formatBold':
                        event.preventDefault();
                        return toggleFormat(editor, 'bold');
                      case 'formatItalic':
                        event.preventDefault();
                        return toggleFormat(editor, 'italic');
                      case 'formatUnderline':
                        event.preventDefault();
                        return toggleFormat(editor, 'underlined');
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

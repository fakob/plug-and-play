import React, { useCallback, useMemo, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { Editor, Descendant, Range, Transforms, createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, Editable, withReact } from 'slate-react';
import { HoverToolbar } from './HoverToolbar';
import { ParameterMenu } from './ParameterMenu';
import { MentionElement } from './custom-types';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import {
  COLOR,
  COLOR_DARK,
  COLOR_WHITE_TEXT,
  SOCKET_TYPE,
  customTheme,
} from '../../utils/constants';
import {
  Leaf,
  Element,
  insertMention,
  toggleBlock,
  toggleMark,
  withLinks,
  withMentions,
} from './slate-editor-components';
import { AnyType } from '../datatypes/anyType';
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
const textJSONSocketName = 'textJSON';
const backgroundColorSocketName = 'background Color';
const inputPrefix = 'Input';
const inputName1 = `${inputPrefix} 1`;

export class TextEditor extends PPNode {
  getAllParameters: () => void;
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

  public getCanAddInput(): boolean {
    return true;
  }

  public addDefaultInput(): void {
    this.addInput(
      this.constructSocketName(inputPrefix, this.inputSocketArray),
      new AnyType()
    );
  }

  protected getDefaultIO(): PPSocket[] {
    const backgroundColor = COLOR[8];

    return [
      new PPSocket(
        SOCKET_TYPE.OUT,
        outputSocketName,
        new JSONType(),
        undefined,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        textJSONSocketName,
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
      new PPSocket(SOCKET_TYPE.IN, inputName1, new AnyType(), undefined, true),
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
      this.setInputData(textJSONSocketName, customArgs?.initialData);
    }

    this.readOnly = false;

    this.getAllParameters = (): Record<string, any> => {
      const allParameters = this.inputSocketArray.filter((input: PPSocket) => {
        return input.name.startsWith(inputPrefix);
      });

      if (allParameters.length === 0) {
        console.error('No parameter sockets found.');
        return undefined;
      }

      const dataObject: Record<string, any> = {};
      allParameters.map((parameter) => {
        // if no link, then return data
        if (parameter.links.length === 0) {
          dataObject[parameter.name] = parameter.data;
          return;
        }

        const link = parameter.links[0];
        dataObject[parameter.name] = link.source.data;
      });

      return dataObject;
    };

    // when the Node is added, create the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData(textJSONSocketName);
      const color: TRgba = this.getInputData(backgroundColorSocketName);
      const allParameters = this.getAllParameters();
      this.readOnly = this.getInputSocketByName(textJSONSocketName).hasLink();

      this.createContainerComponent(document, ParentComponent, {
        nodeHeight: this.nodeHeight,
        data,
        color,
        allParameters,
        readOnly: this.readOnly,
      });
    };

    this.update = (newHeight): void => {
      const data = this.getInputData(textJSONSocketName);
      const allParameters = this.getAllParameters();
      const color: TRgba = this.getInputData(backgroundColorSocketName);
      this.container.style.background = color.rgb();
      this.readOnly = this.getInputSocketByName(textJSONSocketName).hasLink();
      console.log('this.update');
      this.renderReactComponent(ParentComponent, {
        nodeHeight: newHeight ?? this.nodeHeight,
        data,
        color,
        allParameters,
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
      allParameters: Record<string, any>;
      randomMainColor: string;
      nodeHeight: number;
      readOnly: boolean;
    };

    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      const editor = useMemo(
        () => withMentions(withLinks(withHistory(withReact(createEditor())))),
        []
      );
      const [target, setTarget] = useState<Range | undefined>();
      const [index, setIndex] = useState(0);
      const [data, setData] = useState<Descendant[] | undefined>(props.data);
      const renderElement = useCallback((props) => <Element {...props} />, []);
      const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

      const parameterNameArray = this.inputSocketArray
        .filter((item) => item.name.startsWith(inputPrefix))
        .map((item) => item.name);

      const onHandleParameterSelect = (event, index) => {
        event.preventDefault();
        let parameterName = parameterNameArray[index];
        if (index >= parameterNameArray.length) {
          parameterName = `Input ${index + 1}`;
          this.addDefaultInput();
        }
        Transforms.select(editor, target);
        insertMention(editor, parameterName);
        setTarget(null);
      };

      const onPropsChange = () => {
        Object.keys(props.allParameters).map((parameterName) => {
          Transforms.setNodes(
            editor,
            { reactiveText: String(props.allParameters[parameterName]) },
            {
              at: [],
              match: (node: MentionElement) => {
                return (
                  node.type === 'mention' && node.character === parameterName
                );
              },
              mode: 'all', // also the Editor's children
            }
          );
        });
      };

      onPropsChange();

      const onChange = (value) => {
        const { selection } = editor;

        if (selection && Range.isCollapsed(selection)) {
          const [start] = Range.edges(selection);
          const wordBefore = Editor.before(editor, start, {
            unit: 'character',
          });
          const before = wordBefore && Editor.before(editor, wordBefore);
          const beforeRange = before && Editor.range(editor, before, start);
          const beforeText = beforeRange && Editor.string(editor, beforeRange);
          const beforeMatch = beforeText && beforeText.match(/^(\s*@\w*)$/);
          const after = Editor.after(editor, start);
          const afterRange = Editor.range(editor, start, after);
          const afterText = Editor.string(editor, afterRange);
          const afterMatch = afterText.match(/^(\s|$)/);

          if (beforeMatch && afterMatch) {
            setTarget(beforeRange);
            return;
          }
        }
        setTarget(null);

        this.setInputData(textJSONSocketName, value);
        this.setOutputData(outputSocketName, value);
        this.executeChildren();
      };

      const onKeyDown = useCallback(
        (event) => {
          const modKey = isMac ? event.metaKey : event.ctrlKey;
          if (target) {
            switch (event.key) {
              case 'ArrowDown':
                event.preventDefault();
                const prevIndex =
                  index >= parameterNameArray.length ? 0 : index + 1;
                setIndex(prevIndex);
                break;
              case 'ArrowUp':
                event.preventDefault();
                const nextIndex =
                  index <= 0 ? parameterNameArray.length : index - 1;
                setIndex(nextIndex);
                break;
              case 'Tab':
              case 'Enter':
                console.log('Enter');
                event.preventDefault();
                onHandleParameterSelect(event, index);
                break;
              case 'Escape':
                console.log('Escape');
                event.preventDefault();
                setTarget(null);
                break;
            }
          }
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
                return toggleMark(editor, 'underline');
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
        },
        [index, target]
      );

      return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThemeProvider theme={customTheme}>
            <Box
              sx={{
                position: 'relative',
                padding: '16px 24px',
                boxSizing: 'border-box',
                color: `${
                  props.color.isDark() ? COLOR_WHITE_TEXT : COLOR_DARK
                }`,
              }}
            >
              <Slate editor={editor} value={data} onChange={onChange}>
                <HoverToolbar />
                {target && parameterNameArray.length > 0 && (
                  <ParameterMenu
                    parameterNameArray={parameterNameArray}
                    onHandleParameterSelect={onHandleParameterSelect}
                    setTarget={setTarget}
                    index={index}
                  />
                )}
                <Editable
                  readOnly={!props.doubleClicked}
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  placeholder="Enter some rich text…"
                  spellCheck={props.doubleClicked}
                  onKeyDown={onKeyDown}
                />
              </Slate>
            </Box>
          </ThemeProvider>
        </ErrorBoundary>
      );
    };
  }
}

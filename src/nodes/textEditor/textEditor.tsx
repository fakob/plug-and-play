import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { Editor, Descendant, Range, Transforms, createEditor } from 'slate';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
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
  moveBlock,
  toggleBlock,
  toggleMark,
  withHtml,
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
    children: [{ text: '' }],
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

    this.getAllParameters = (): string => {
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
        dataObject[parameter.name] = String(link.source.data);
      });

      return JSON.stringify(dataObject);
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
      allParameters: string;
      randomMainColor: string;
      nodeHeight: number;
      readOnly: boolean;
    };

    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      const editor = useMemo(
        () =>
          withHtml(
            withMentions(withLinks(withHistory(withReact(createEditor()))))
          ),
        []
      );
      const [target, setTarget] = useState<Range | undefined>();
      const [index, setIndex] = useState(0);
      const [color, setColor] = useState(props.color);
      const renderElement = useCallback(
        (props) => <Element color={color} {...props} />,
        [color]
      );
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

      useEffect(() => {
        if (props.doubleClicked) {
          ReactEditor.focus(editor);
        }
      }, [props.doubleClicked]);

      useEffect(() => {
        setColor(props.color);
      }, [props.color.r, props.color.g, props.color.b, props.color.a]);

      useEffect(() => {
        // update editor data
        editor.children = props.data;

        // substitute @inputs with input parameters
        const allParametersObject = JSON.parse(props.allParameters);
        Object.keys(allParametersObject).map((parameterName) => {
          Transforms.setNodes(
            editor,
            { reactiveText: allParametersObject[parameterName] },
            {
              at: [],
              match: (node: MentionElement) => {
                return (
                  node.type === 'mention' && node.inputName === parameterName
                );
              },
              mode: 'all', // also the Editor's children
            }
          );
        });

        // update outputs
        this.setOutputData(outputSocketName, props.data);
        this.executeChildren();
      }, [props.allParameters, props.data]);

      const onChange = (value) => {
        const { selection } = editor;

        if (selection && Range.isCollapsed(selection)) {
          const [start] = Range.edges(selection);
          const before = Editor.before(editor, start, {
            unit: 'word',
          });
          const beforeRange = before && Editor.range(editor, before, start);
          const beforeText = beforeRange && Editor.string(editor, beforeRange);
          const beforeMatch = beforeText && beforeText.match(/(\s*@\w*)$/);
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

        // update in and outputs
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
                event.preventDefault();
                onHandleParameterSelect(event, index);
                break;
              case 'Escape':
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
              case 'x':
                event.preventDefault();
                return toggleMark(editor, 'strikethrough');
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
          if (event.shiftKey && event.ctrlKey) {
            switch (event.key) {
              case 'ArrowUp':
                event.preventDefault();
                return moveBlock(editor, true);
              case 'ArrowDown':
                event.preventDefault();
                return moveBlock(editor, false);
            }
          }
          if (event.shiftKey && event.key === 'Enter') {
            return editor.insertText('\n');
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
                color: `${color.isDark() ? COLOR_WHITE_TEXT : COLOR_DARK}`,
              }}
            >
              <Slate editor={editor} value={props.data} onChange={onChange}>
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

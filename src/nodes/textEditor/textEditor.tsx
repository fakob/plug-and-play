import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import { Box, Menu, MenuItem, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { Editor, Descendant, Range, Transforms, createEditor } from 'slate';
import { withHistory } from 'slate-history';
import {
  Slate,
  Editable,
  ReactEditor,
  withReact,
  useFocused,
} from 'slate-react';
import { HoverToolbar } from './HoverToolbar';
import { MentionElement } from './custom-types';
import ErrorFallback from '../../components/ErrorFallback';
import PPSocket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { COLOR, SOCKET_TYPE, customTheme } from '../../utils/constants';
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
import { EditableProps } from 'slate-react/dist/components/editable';

const isMac = navigator.platform.indexOf('Mac') != -1;

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'A line of text in a paragraph.' }],
  },
];

interface EditableProps2 extends EditableProps {
  variable1?: any;
  variable2?: any;
  variable3?: any;
}

const Editable2: React.FunctionComponent<EditableProps2> = ({
  children,
  ...rest
}) => {
  return <Editable {...rest}>{children}</Editable>;
};

const outputSocketName = 'output';
const inputSocketName = 'input';
const backgroundColorSocketName = 'background Color';
const inputName1 = 'Parameter 1';

const Portal = ({ children }) => {
  return typeof document === 'object'
    ? ReactDOM.createPortal(children, document.body)
    : null;
};
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
      this.constructSocketName('Parameter', this.inputSocketArray),
      new AnyType()
    );
  }

  protected getDefaultIO(): PPSocket[] {
    const backgroundColor = COLOR[5];

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
      this.setInputData(inputSocketName, customArgs?.initialData);
    }

    this.readOnly = false;

    this.getAllParameters = (): Record<string, any> => {
      const allParameters = this.inputSocketArray.filter((input: PPSocket) => {
        return input.name.startsWith('Parameter');
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
      const data = this.getInputData(inputSocketName);
      const allParameters = this.getAllParameters();
      const color: TRgba = this.getInputData(backgroundColorSocketName);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();

      this.createContainerComponent(document, ParentComponent, {
        nodeHeight: this.nodeHeight,
        data,
        allParameters,
        color,
        readOnly: this.readOnly,
      });
    };

    this.update = (newHeight): void => {
      const newData = this.getInputData(inputSocketName);
      const allParameters = this.getAllParameters();
      const color: TRgba = this.getInputData(backgroundColorSocketName);
      this.readOnly = this.getInputSocketByName(inputSocketName).hasLink();

      this.renderReactComponent(ParentComponent, {
        nodeHeight: newHeight ?? this.nodeHeight,
        data: newData,
        allParameters,
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
      allParameters: Record<string, any>;
      color: TRgba;
      randomMainColor: string;
      nodeHeight: number;
      readOnly: boolean;
    };

    const ParentComponent: React.FunctionComponent<MyProps> = (props) => {
      const editor = useMemo(
        () => withMentions(withLinks(withHistory(withReact(createEditor())))),
        []
      );
      const inFocus = useFocused();
      const ref = useRef<HTMLDivElement | null>();
      const [target, setTarget] = useState<Range | undefined>();
      const [index, setIndex] = useState(0);
      const [search, setSearch] = useState('');
      const [data, setData] = useState<Descendant[] | undefined>(props.data);
      const [showHooveringToolbar, setShowHooveringToolbar] = useState(false);
      const renderElement = useCallback((props) => <Element {...props} />, []);
      const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
      const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
      const open = Boolean(anchorEl);
      const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
      };
      const handleClose = () => {
        setAnchorEl(null);
      };

      const chars = this.inputSocketArray
        .filter((item) => item.name.startsWith('Parameter'))
        .map((item) => item.name);

      const onChange = (value) => {
        const { selection } = editor;

        if (selection && Range.isCollapsed(selection)) {
          const [start] = Range.edges(selection);
          const wordBefore = Editor.before(editor, start, { unit: 'word' });
          const before = wordBefore && Editor.before(editor, wordBefore);
          const beforeRange = before && Editor.range(editor, before, start);
          const beforeText = beforeRange && Editor.string(editor, beforeRange);
          const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/);
          const after = Editor.after(editor, start);
          const afterRange = Editor.range(editor, start, after);
          const afterText = Editor.string(editor, afterRange);
          const afterMatch = afterText.match(/^(\s|$)/);
          console.log(beforeText, beforeMatch, afterText, afterMatch);

          if (beforeMatch && afterMatch) {
            setTarget(beforeRange);
            setSearch(beforeMatch[1]);
            setIndex(0);
            return;
          }
        }

        setTarget(null);

        // console.log(value);
        this.setInputData(inputSocketName, value);
        this.setOutputData(outputSocketName, value);
        this.executeChildren();
      };

      const onKeyDown = useCallback(
        (event) => {
          const modKey = isMac ? event.metaKey : event.ctrlKey;
          console.log(event.key, event.code);
          if (target) {
            switch (event.key) {
              case 'ArrowDown':
                event.preventDefault();
                const prevIndex = index >= chars.length - 1 ? 0 : index + 1;
                setIndex(prevIndex);
                break;
              case 'ArrowUp':
                event.preventDefault();
                const nextIndex = index <= 0 ? chars.length - 1 : index - 1;
                setIndex(nextIndex);
                break;
              case 'Tab':
              case 'Enter':
                event.preventDefault();
                Transforms.select(editor, target);
                insertMention(editor, chars[index]);
                setTarget(null);
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
        },
        [index, search, target]
      );

      useEffect(() => {
        if (target && chars.length > 0) {
          const el = ref.current;
          const domRange = ReactEditor.toDOMRange(editor, target as any);
          const rect = domRange.getBoundingClientRect();
          el.style.top = `${rect.top + window.pageYOffset + 24}px`;
          el.style.left = `${rect.left + window.pageXOffset}px`;
        }
      }, [chars.length, editor, index, search, target]);

      useEffect(() => {
        Object.keys(props.allParameters).map((parameterName) => {
          Transforms.setNodes(
            editor,
            { reactiveText: props.allParameters[parameterName] },
            {
              at: [],
              match: (node: MentionElement) => {
                console.log(node);
                return (
                  node.type === 'mention' && node.character === parameterName
                );
              },
              mode: 'all', // also the Editor's children
            }
          );
          // console.log(
          //   Array.from(
          //     Editor.nodes(editor, {
          //       at: [],
          //       // match: (n) => Editor.isInline(editor, n),
          //       match: (node) => {
          //         console.log(node);
          //         return (node as MentionElement).type === 'mention';
          //       },
          //       mode: 'all',
          //     })
          //   )
          // );
        });
      }, [...Object.values(props.allParameters)]);

      useEffect(() => {
        console.log(props.doubleClicked);
      }, [props.doubleClicked]);

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
                padding: '16px 24px',
                background: props.color.rgb(),
                boxSizing: 'border-box',
                height: '100%',
              }}
            >
              <Slate editor={editor} value={data} onChange={onChange}>
                <HoverToolbar />
                <Editable2
                  readOnly={!props.doubleClicked}
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  placeholder="Enter some rich text…"
                  spellCheck={props.doubleClicked}
                  onKeyDown={onKeyDown}
                />
                {target && chars.length > 0 && (
                  // <Menu
                  //   ref={ref}
                  //   id="basic-menu"
                  //   anchorEl={anchorEl}
                  //   open={open}
                  //   onClose={handleClose}
                  //   data-cy="mentions-portal"
                  //   MenuListProps={{
                  //     'aria-labelledby': 'basic-button',
                  //   }}
                  // >
                  //   {chars.map((char, i) => (
                  //     <MenuItem
                  //       onClick={handleClose}
                  //       key={char}
                  //       style={{
                  //         padding: '1px 3px',
                  //         borderRadius: '3px',
                  //         background: i === index ? '#B4D5FF' : 'transparent',
                  //       }}
                  //     >
                  //       {char}
                  //     </MenuItem>
                  //   ))}
                  // </Menu>
                  <Portal>
                    <div
                      ref={ref}
                      style={{
                        top: '-9999px',
                        left: '-9999px',
                        position: 'absolute',
                        zIndex: 1,
                        padding: '3px',
                        background: 'white',
                        borderRadius: '4px',
                        boxShadow: '0 1px 5px rgba(0,0,0,.2)',
                      }}
                      data-cy="mentions-portal"
                    >
                      {chars.map((char, i) => (
                        <div
                          key={char}
                          style={{
                            padding: '1px 3px',
                            borderRadius: '3px',
                            background: i === index ? '#B4D5FF' : 'transparent',
                          }}
                        >
                          {char}
                        </div>
                      ))}
                    </div>
                  </Portal>
                )}
              </Slate>
            </Box>
          </ThemeProvider>
        </ErrorBoundary>
      );
    };
  }
}

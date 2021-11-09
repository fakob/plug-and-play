import * as PIXI from 'pixi.js';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Color from 'color';
import { Resizable } from 're-resizable';
import {
  Button,
  ButtonGroup,
  EditableText,
  H1,
  H2,
  H3,
  Divider,
} from '@blueprintjs/core';
import {
  BaseEditor,
  createEditor,
  Descendant,
  Editor,
  Range,
  Text as SlateText,
  Transforms,
} from 'slate';
import { Slate, Editable, withReact, ReactEditor, useSlate } from 'slate-react';
import { HistoryEditor, withHistory } from 'slate-history';
import { Menu, Portal } from '../utils/slate-editor-components';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs, TRgba } from '../utils/interfaces';
import {
  convertStringToSlateNodes,
  convertSlateNodesToString,
} from '../utils/utils';
import {
  COLOR,
  COLOR_DARK,
  COLOR_WHITE,
  COLOR_WHITE_TEXT,
  NODE_MARGIN,
  NOTE_FONT,
  NOTE_FONTSIZE,
  NOTE_LINEHEIGHT_FACTOR,
  NOTE_MARGIN_STRING,
  NOTE_PADDING,
  NOTE_TEXTURE,
  SOCKET_WIDTH,
} from '../utils/constants';
import { hexToTRgba, trgbaToColor } from '../pixi/utils-pixi';
import textFit from '../pixi/textFit';
import styles from '../utils/style.module.css';
import { StringType } from './datatypes/stringType';
import { NumberType } from './datatypes/numberType';
import { ColorType } from './datatypes/colorType';

// type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

// type ParagraphElement = {
//   type?: 'paragraph';
//   children: CustomText[];
// };

// type HeadingElement = {
//   type: 'heading';
//   level: number;
//   children: CustomText[];
// };

// type CustomElement = ParagraphElement | HeadingElement;

// type FormattedText = { text: string; bold: boolean; italic: boolean };

// type CustomText = FormattedText;

// declare module 'slate' {
//   interface CustomTypes {
//     Editor: CustomEditor;
//     Element: CustomElement;
//     Text: CustomText;
//   }
// }

// type TextAdditionalProps = {
//   width?: number;
//   height?: number;
//   focus?: boolean;
// };

// export class Text extends PPNode {
//   update: (additionalProps?: TextAdditionalProps) => void;

//   constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
//     const nodeWidth = 300;
//     const nodeHeight = 100;
//     const isHybrid = true;

//     super(name, graph, {
//       ...customArgs,
//       nodeWidth,
//       nodeHeight,
//       isHybrid,
//     });

//     this.addOutput('data', DATATYPE.ANY, false);
//     this.addOutput('text', DATATYPE.STRING, false);
//     this.addInput(
//       'initialData',
//       DATATYPE.STRING,
//       customArgs?.initialData,
//       false
//     );
//     this.addInput('data', DATATYPE.ANY, customArgs?.data ?? undefined, false);
//     this.addInput(
//       'width',
//       DATATYPE.NUMBER,
//       customArgs?.width ?? nodeWidth,
//       false
//     );
//     this.addInput(
//       'height',
//       DATATYPE.NUMBER,
//       customArgs?.height ?? nodeHeight,
//       false
//     );

//     this.name = 'Text';
//     this.description = 'Adds text';

//     // when the Node is added, add the container and react component
//     this.onNodeAdded = () => {
//       let data = this.getInputData('data');

//       // check if data is null or undefined
//       // and use initialData to create data
//       if (data == null) {
//         data = convertStringToSlateNodes(this.getInputData('initialData'));
//         // store data
//         this.setInputData('data', data);
//       }

//       this.createContainerComponent(document, TextParent, {
//         ...baseProps,
//         width: nodeWidth,
//         height: nodeHeight,
//         data,
//         focus: true,
//       });
//       this.container.style.width = 'auto';
//       this.container.style.height = 'auto';
//     };

//     // when the stored data is read, resize the node and update the react component
//     this.onConfigure = (): void => {
//       const width = this.getInputData('width');
//       const height = this.getInputData('height');
//       this.resizeNode(width, height);

//       this.update({ width, height });
//     };

//     // update the react component
//     this.update = (additionalProps?: TextAdditionalProps): void => {
//       const data = this.getInputData('data');
//       this.renderReactComponent(TextParent, {
//         ...baseProps,
//         ...additionalProps,
//         data,
//       });
//       this.setOutputData('data', data);
//       this.setOutputData('text', convertSlateNodesToString(data));
//     };

//     this.onNodeSelected = () => {
//       console.log('onNodeSelected:', this.id);
//       const width = this.getInputData('width');
//       const height = this.getInputData('height');
//       this.update({ width, height });
//     };

//     this.onNodeDoubleClick = () => {
//       console.log('onNodeDoubleClick:', this.id);
//       const width = this.getInputData('width');
//       const height = this.getInputData('height');
//       this.update({ width, height, focus: true });
//     };

//     this.onExecute = async (input, output) => {
//       // const data = input['data']; // text can not be updated while running when using this function. Had to use getInputData. Why?
//       if (!this.doubleClicked) {
//         const data = this.getInputData('data');
//         this.setOutputData('data', data);
//         this.setOutputData('text', convertSlateNodesToString(data));

//         this.update();
//       }
//     };

//     const baseProps = {
//       update: this.update.bind(this),
//       resizeNode: this.resizeNode.bind(this),
//       setInputData: this.setInputData.bind(this),
//       setOutputData: this.setOutputData.bind(this),
//     };
//   }
// }

// type TextProps = {
//   update(): void;
//   resizeNode(width: number, height: number): void;
//   setInputData(name: string, data: any): void;
//   setOutputData(name: string, data: any): void;
//   id: string;
//   selected: boolean;
//   doubleClicked: boolean;
//   focus?: boolean;

//   width: number;
//   height: number;
//   data: any;
// };

// const TextParent: React.FunctionComponent<TextProps> = (props) => {
//   const [width, setWidth] = React.useState(props.width);
//   const [height, setHeight] = React.useState(props.height);

//   // run on any props change after initial creation
//   useEffect(() => {
//     // change only if it was set
//     if (props.width) {
//       setWidth(props.width);
//     }
//     if (props.height) {
//       setHeight(props.height);
//     }
//   }, [props.width, props.height]);

//   return (
//     <Resizable
//       enable={{
//         right: true,
//         bottom: true,
//         bottomRight: true,
//         top: false,
//         left: false,
//         topRight: false,
//         topLeft: false,
//         bottomLeft: false,
//       }}
//       className={styles.resizeElement}
//       handleClasses={{
//         right: styles.resizeHandle,
//         bottomRight: styles.resizeHandle,
//         bottom: styles.resizeHandle,
//       }}
//       style={{
//         borderStyle: 'dashed',
//         borderWidth: props.doubleClicked ? '0 1px 1px 0' : '0',
//         borderColor: 'rgba(225, 84, 125, 1)',
//       }}
//       size={{ width, height }}
//       onResize={(e, direction, ref, d) => {
//         const width = ref.offsetWidth;
//         const height = ref.offsetHeight;
//         setWidth(width);
//         setHeight(height);
//         props.resizeNode(width, height);
//       }}
//       onResizeStop={(e, direction, ref, d) => {
//         const width = ref.offsetWidth;
//         const height = ref.offsetHeight;
//         props.setInputData('width', width);
//         props.setInputData('height', height);
//         console.log('onResizeStop: ', props.width, props.height);
//       }}
//     >
//       <SlateEditorContainer {...props} />
//     </Resizable>
//   );
// };

// const SlateEditorContainer: React.FunctionComponent<TextProps> = (props) => {
//   // const focused = useFocused();
//   // const selected = useSelected();
//   const [value, setValue] = useState<Descendant[]>(props.data);
//   const editor = useMemo(() => withHistory(withReact(createEditor())), []);

//   const toggleFormat = (editor, format) => {
//     const isActive = isFormatActive(editor, format);
//     Transforms.setNodes(
//       editor,
//       { [format]: isActive ? null : true },
//       { match: SlateText.isText, split: true }
//     );
//   };

//   const isFormatActive = (editor, format) => {
//     const [match] = Editor.nodes(editor, {
//       match: (n) => n[format] === true,
//       mode: 'all',
//     });
//     return !!match;
//   };

//   const toggleType = (editor, nodeType, nodeLevel) => {
//     const match = isTypeActive(editor, nodeType, nodeLevel);
//     Transforms.setNodes(
//       editor,
//       {
//         type: match ? 'paragraph' : nodeType,
//         level: match ? undefined : nodeLevel,
//       },
//       { match: (n) => Editor.isBlock(editor, n) }
//     );
//   };

//   const isTypeActive = (editor, type, nodeLevel) => {
//     const [match] = Editor.nodes(editor, {
//       match: (n) => {
//         if (type === 'heading') {
//           return (n as any).type === type && (n as any).level === nodeLevel;
//         }
//         return (n as any).type === type;
//       },
//     });
//     return !!match;
//   };

//   const HoveringToolbar = () => {
//     const ref = useRef<HTMLDivElement | null>();
//     const editor = useSlate();

//     useEffect(() => {
//       const el = ref.current;
//       const { selection } = editor;

//       if (!el) {
//         return;
//       }

//       if (
//         !selection ||
//         !ReactEditor.isFocused(editor) ||
//         Range.isCollapsed(selection) ||
//         Editor.string(editor, selection) === ''
//       ) {
//         el.removeAttribute('style');
//         return;
//       }

//       const domSelection = window.getSelection();
//       const domRange = domSelection.getRangeAt(0);
//       const rect = domRange.getBoundingClientRect();
//       el.style.opacity = '1';
//       el.style.top = `${Math.abs(
//         rect.top + window.pageYOffset - el.offsetHeight
//       )}px`;
//       el.style.left = `${Math.abs(
//         rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
//       )}px`;
//     }, [editor.selection]);

//     return (
//       <Portal>
//         <Menu ref={ref} className={styles.slateMenu}>
//           <ButtonGroup minimal={true}>
//             <TypeButton type="heading" level={1} icon="header-one" />
//             <TypeButton type="heading" level={2} icon="header-two" />
//             <TypeButton type="paragraph" icon="paragraph" />
//             <TypeButton type="code" icon="code" />
//             <Divider />
//             <FormatButton format="bold" icon="bold" />
//             <FormatButton format="italic" icon="italic" />
//             <FormatButton format="underlined" icon="underline" />
//             <FormatButton format="strikethrough" icon="strikethrough" />
//           </ButtonGroup>
//         </Menu>
//       </Portal>
//     );
//   };

//   const FormatButton = ({ format, icon }) => {
//     const editor = useSlate();
//     return (
//       <Button
//         active={isFormatActive(editor, format)}
//         onMouseDown={(event) => {
//           event.preventDefault();
//           toggleFormat(editor, format);
//         }}
//         icon={icon}
//       />
//     );
//   };

//   const TypeButton = ({ type, icon, level = undefined }) => {
//     const editor = useSlate();
//     return (
//       <Button
//         active={isTypeActive(editor, type, level)}
//         onMouseDown={(event) => {
//           event.preventDefault();
//           toggleType(editor, type, level);
//         }}
//         icon={icon}
//       />
//     );
//   };

//   const Leaf = ({ attributes, children, leaf }) => {
//     if (leaf.bold) {
//       children = <strong>{children}</strong>;
//     }

//     if (leaf.italic) {
//       children = <em>{children}</em>;
//     }

//     if (leaf.underlined) {
//       children = <u>{children}</u>;
//     }

//     if (leaf.strikethrough) {
//       children = <del>{children}</del>;
//     }

//     return <span {...attributes}>{children}</span>;
//   };

//   const HeadingElement = (props) => {
//     switch (props.element?.level) {
//       case 1:
//         return <H2 {...props.attributes}>{props.children}</H2>;
//       case 2:
//         return <H3 {...props.attributes}>{props.children}</H3>;

//       default:
//         return <H2 {...props.attributes}>{props.children}</H2>;
//     }
//   };

//   const CodeElement = (props) => {
//     return (
//       <pre {...props.attributes}>
//         <code>{props.children}</code>
//       </pre>
//     );
//   };

//   const ParagraphElement = (props) => {
//     return <p {...props.attributes}>{props.children}</p>;
//   };

//   // Define a rendering function based on the element passed to `props`. We use
//   // `useCallback` here to memoize the function for subsequent renders.
//   const renderElement = useCallback((props) => {
//     switch (props.element.type) {
//       case 'heading':
//         return <HeadingElement {...props} />;
//       case 'code':
//         return <CodeElement {...props} />;
//       default:
//         return <ParagraphElement {...props} />;
//     }
//   }, []);

//   // run on any props change after initial creation
//   useEffect(() => {
//     // change only if it was set
//     if (props.data) {
//       setValue(props.data);
//     }
//   }, [props.data]);

//   useEffect(() => {
//     if (props.focus) {
//       ReactEditor.focus(editor);
//     }
//   }, [props.focus]);

//   return (
//     <div className={styles.slateEditorContainer}>
//       <Slate
//         editor={editor}
//         value={value}
//         onChange={(value) => {
//           setValue(value);
//           props.setInputData('data', value);
//           props.update();
//         }}
//       >
//         <HoveringToolbar />
//         <Editable
//           renderElement={renderElement}
//           renderLeaf={(props) => <Leaf {...props} />}
//           placeholder="Write away..."
//           onDOMBeforeInput={(event: InputEvent) => {
//             switch (event.inputType) {
//               case 'formatBold':
//                 event.preventDefault();
//                 return toggleFormat(editor, 'bold');
//               case 'formatItalic':
//                 event.preventDefault();
//                 return toggleFormat(editor, 'italic');
//               case 'formatUnderline':
//                 event.preventDefault();
//                 return toggleFormat(editor, 'underline');
//             }
//           }}
//         />
//       </Slate>
//     </div>
//   );
// };

export class Label extends PPNode {
  _refText: PIXI.Text;
  _refTextStyle: PIXI.TextStyle;
  currentInput: HTMLDivElement;
  createInputElement: () => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 128;
    const fontSize = 32;
    const fillColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      color: fillColor,
      colorTransparency: 1.0,
      roundedCorners: false,
      showLabels: false,
    });

    this.addOutput('text', new StringType(), false);
    this.addInput('text', new StringType(), customArgs?.data ?? '', false);
    this.addInput(
      'fontSize',
      new NumberType(true, 1),
      customArgs?.fontSize ?? fontSize,
      false
    );
    this.addInput(
      'backgroundColor',
      new ColorType(),
      hexToTRgba(fillColor),
      false
    );
    this.addInput(
      'min-width',
      new NumberType(true, 1),
      customArgs?.width ?? nodeWidth,
      false
    );

    this.name = 'Label';
    this.description = 'Adds text';

    // when the Node is added, focus it so one can start writing
    this.onNodeAdded = () => {
      this.currentInput = null;

      const canvas = this.graph.viewport.getChildByName(
        'foregroundCanvas'
      ) as PIXI.Container;

      this._refTextStyle = new PIXI.TextStyle();
      const basicText = new PIXI.Text('', this._refTextStyle);

      this._refText = canvas.addChild(basicText);

      this._refText.visible = false;
      this.createInputElement();
    };

    // when the Node has been configured, remove focus
    this.onConfigure = () => {
      this.currentInput.remove();
      this._refText.visible = true;
    };

    this.createInputElement = () => {
      // create html input element
      const screenPoint = this.graph.viewport.toScreen(this.x, this.y);
      const text = this.getInputData('text');
      const fontSize = this.getInputData('fontSize');
      const color = trgbaToColor(this.getInputData('backgroundColor'));
      const marginLeftRight = fontSize / 1.5;
      const marginTopBottom = fontSize / 2;

      this.currentInput = document.createElement('div');
      this.currentInput.id = 'Input';
      this.currentInput.contentEditable = 'true';
      this.currentInput.innerText = text;

      const style = {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize * (NOTE_LINEHEIGHT_FACTOR + 0.022)}px`, // 0.022 corrects difference between div and PIXI.Text
        textAlign: 'left',
        margin: NOTE_MARGIN_STRING,
        color: color.isDark() ? COLOR_WHITE : COLOR_DARK,
        padding: `${marginTopBottom}px ${marginLeftRight}px`,
        position: 'absolute',
        background: 'transparent',
        border: '0 none',
        transformOrigin: 'top left',
        transform: `scale(${this.graph.viewport.scale.x}`,
        outline: '0px dashed black',
        left: `${screenPoint.x}px`,
        top: `${screenPoint.y}px`,
        width: `${this.nodeWidth}px`,
        height: `${this.nodeHeight}px`,
      };
      Object.assign(this.currentInput.style, style);

      setTimeout(() => {
        // set caret to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(this.currentInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        // set focus
        this.currentInput.focus();
      }, 100);

      // add event handlers
      this.currentInput.addEventListener('blur', (e) => {
        console.log('blur', e);
        this.currentInput.remove();
        this._refText.visible = true;
        this.doubleClicked = false;
      });

      this.currentInput.addEventListener('input', (e) => {
        let text = (e as any).target.innerText;
        this._refText.text = text;
        const minWidth = this.getInputData('min-width');
        const textMetrics = PIXI.TextMetrics.measureText(
          text,
          this._refTextStyle
        );

        // correct for issue in chrome where pressing enter would add 2 line breaks
        // so I check for 2 empty line breaks at the end and delete one
        let textMetricsHeight = textMetrics.height;
        const length = textMetrics.lines.length;
        if (
          textMetrics.lines[length - 1] === '' &&
          textMetrics.lines[length - 2] === ''
        ) {
          text = textMetrics.text.substr(0, textMetrics.text.length - 2);
          this._refText.text = text;
          textMetricsHeight = textMetrics.lineHeight * (length - 1);
        }

        const newWidth = textMetrics.width + marginLeftRight * 2;
        const newHeight = textMetricsHeight * NOTE_LINEHEIGHT_FACTOR;
        this.currentInput.style.width = `${newWidth}px`;
        this.currentInput.style.height = `${newHeight + marginTopBottom * 2}px`;

        this.resizeNode(
          Math.max(minWidth, newWidth),
          newHeight + marginTopBottom
        );

        this.setInputData('text', text);
        this.setOutputData('text', text);
      });

      document.body.appendChild(this.currentInput);
    };

    this.onNodeDoubleClick = () => {
      this._refText.visible = false;
      this.createInputElement();
    };

    this.onExecute = async (input) => {
      if (!this.doubleClicked) {
        const text = String(input['text']);
        const fontSize = input['fontSize'];
        const minWidth = input['min-width'];
        const color = trgbaToColor(input['backgroundColor']);

        const marginTopBottom = fontSize / 2;
        const marginLeftRight = fontSize / 1.5;

        this._refTextStyle.fontSize = fontSize;
        this._refTextStyle.lineHeight = fontSize * NOTE_LINEHEIGHT_FACTOR;
        this._refTextStyle.fill = color.isDark()
          ? PIXI.utils.string2hex(COLOR_WHITE)
          : PIXI.utils.string2hex(COLOR_DARK);

        const textMetrics = PIXI.TextMetrics.measureText(
          text,
          this._refTextStyle
        );

        this.color = PIXI.utils.string2hex(color.hex());
        this.colorTransparency = color.alpha();

        this.resizeNode(
          Math.max(minWidth, textMetrics.width + marginLeftRight * 2),
          textMetrics.height + marginTopBottom * 2
        );
        this.setOutputData('text', text);

        this._refText.text = text;
        this._refText.x = this.x + NODE_MARGIN + marginLeftRight;
        this._refText.y = this.y + marginTopBottom;
      }
    };

    // scale input if node is scaled
    this.onNodeDragOrViewportMove = () => {
      if (this.currentInput != null) {
        const screenPoint = this.graph.viewport.toScreen(this.x, this.y);
        this.currentInput.style.transform = `scale(${this.graph.viewport.scale.x}`;
        this.currentInput.style.left = `${screenPoint.x}px`;
        this.currentInput.style.top = `${screenPoint.y}px`;
      }
    };

    this.onNodeRemoved = () => {
      this._refText.destroy();
    };
  }

  shouldExecuteOnMove(): boolean {
    return true;
  }
}

export class Note extends PPNode {
  _spriteRef: PIXI.Sprite;
  _bitmapTextRef: PIXI.BitmapText;
  _maskRef: PIXI.Graphics;
  currentInput: HTMLDivElement;
  fontSize: number;
  createInputElement: (temporary?: boolean) => void;
  setCleanAndDisplayText: (input: HTMLDivElement) => void;
  update: () => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const baseWidth = 160;
    const baseHeight = 160;
    const defaultColor = COLOR_WHITE_TEXT;
    const baseFontSize = 60;
    const maxFontSize = 1200;

    // to compensate for that the note texture includes a drop shadow at the bottom
    const verticalTextureOffset = 0.92;

    super(name, graph, {
      ...customArgs,
      nodeWidth: baseWidth,
      nodeHeight: baseHeight,
      minNodeHeight: baseHeight,
      colorTransparency: 0,
      roundedCorners: false,
      showLabels: false,
    });

    this.addOutput('data', new StringType(), false);
    this.addInput(
      'data',
      new StringType(),
      customArgs?.data ?? 'Write away...',
      false
    );

    this.name = 'Note';
    this.description = 'Adds a note';

    this.currentInput = null;
    this.fontSize = baseFontSize;

    const textFitOptions = {
      multiLine: true,
      maxFontSize: maxFontSize,
    };

    this.onNodeAdded = () => {
      const loader = new PIXI.Loader();
      loader.add('NoteFont', NOTE_FONT).load(() => {
        const nodeWidth = this.nodeWidth ?? baseWidth;
        const nodeHeight = this.nodeHeight ?? baseHeight;

        this._NodeNameRef.visible = false;

        this._spriteRef = PIXI.Sprite.from(NOTE_TEXTURE);
        this._spriteRef.x = SOCKET_WIDTH / 2;
        this._spriteRef.y = 0;
        this._spriteRef.width = nodeWidth;
        this._spriteRef.height = nodeHeight;
        (this as PIXI.Container).addChild(this._spriteRef);
        this._spriteRef.alpha = 1;
        this._spriteRef.tint = PIXI.utils.string2hex(Color(defaultColor).hex());

        this._maskRef = new PIXI.Graphics();
        this._maskRef.beginFill(0xffffff);
        this._maskRef.drawRect(
          this._spriteRef.x,
          this._spriteRef.y,
          this._spriteRef.width,
          this._spriteRef.height
        );
        this._maskRef.endFill();
        (this as PIXI.Container).addChild(this._maskRef);

        // create and position PIXI.Text
        this._bitmapTextRef = new PIXI.BitmapText(
          customArgs?.data ?? 'Write away...',
          {
            fontName: 'Arial',
            fontSize: NOTE_FONTSIZE,
            align: 'center',
            maxWidth: nodeWidth - NOTE_PADDING * 2,
          }
        );
        (this._bitmapTextRef.anchor as PIXI.Point) = new PIXI.Point(0.5, 0.5);
        this._bitmapTextRef.x = (SOCKET_WIDTH + nodeWidth) / 2;
        this._bitmapTextRef.y = (nodeHeight * verticalTextureOffset) / 2;
        (this as PIXI.Container).addChild(this._bitmapTextRef);
        this._bitmapTextRef.mask = this._maskRef;

        this.onNodeResized();
        this.update();
      });
    };

    this.createInputElement = (temporary = false) => {
      const nodeWidth = this.nodeWidth ?? baseWidth;
      const nodeHeight = this.nodeHeight ?? baseHeight;
      // create html input element
      this._bitmapTextRef.visible = false;
      const screenPoint = this.graph.viewport.toScreen(this.x, this.y);

      this.currentInput = document.createElement('div');
      this.currentInput.id = 'Input';
      this.currentInput.contentEditable = 'true';
      this.currentInput.innerHTML = this.inputSocketArray[0].data;

      const style = {
        fontFamily: 'Arial',
        fontSize: `${this.fontSize}px`,
        lineHeight: `${NOTE_LINEHEIGHT_FACTOR}`,
        textAlign: 'center',
        margin: NOTE_MARGIN_STRING,
        padding: `${NOTE_PADDING}px`,
        position: 'absolute',
        background: 'transparent',
        border: '0 none',
        transformOrigin: 'top left',
        transform: `scale(${this.graph.viewport.scale.x}`,
        outline: '0px dashed black',
        left: `${screenPoint.x}px`,
        top: `${screenPoint.y}px`,
        width: `${nodeWidth}px`,
        height: `${nodeHeight * verticalTextureOffset}px`,
        resize: 'none',
        overflowY: 'scroll',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        flexDirection: 'column',
      };
      Object.assign(this.currentInput.style, style);

      if (!temporary) {
        setTimeout(() => {
          // run textfit once so span in div is already added
          // and caret does not jump after first edit
          textFit(this.currentInput, textFitOptions);

          // set caret to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(this.currentInput);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);

          // set focus
          this.currentInput.focus();
          console.log(this.currentInput);
        }, 100);
      }

      this.currentInput.dispatchEvent(new Event('input'));

      // add event handlers
      this.currentInput.addEventListener('blur', (e) => {
        console.log('blur', e);
        this.currentInput.dispatchEvent(new Event('input'));
        this.setCleanAndDisplayText(this.currentInput);
        this.currentInput.remove();
        this._bitmapTextRef.visible = true;
        this.doubleClicked = false;
      });

      this.currentInput.addEventListener('input', () => {
        // run textFit to recalculate the font size
        textFit(this.currentInput, textFitOptions);
      });

      document.body.appendChild(this.currentInput);
    };

    this.setCleanAndDisplayText = (input: HTMLDivElement) => {
      const nodeWidth = this.nodeWidth ?? baseWidth;
      const nodeHeight = this.nodeHeight ?? baseHeight;

      // get font size of editable div
      const style = window.getComputedStyle(input.children[0], null);
      const newText = input.textContent;
      const newFontSize = parseInt(style.getPropertyValue('font-size'), 10);

      this._bitmapTextRef.fontSize = newFontSize;
      this._bitmapTextRef.text = input.textContent;
      this._bitmapTextRef.x = (SOCKET_WIDTH + nodeWidth) / 2;
      this._bitmapTextRef.y = (nodeHeight * verticalTextureOffset) / 2;

      this.setInputData('data', newText);
      this.setOutputData('data', newText);

      this.fontSize = newFontSize;
    };

    this.update = () => {
      const nodeWidth = this.nodeWidth ?? baseWidth;
      const nodeHeight = this.nodeHeight ?? baseHeight;
      const data = this.getInputData('data');
      if (this._bitmapTextRef) {
        this._bitmapTextRef.text = data;
        while (
          (this._bitmapTextRef.width > nodeWidth - NOTE_PADDING * 2 ||
            this._bitmapTextRef.height > nodeHeight - NOTE_PADDING * 2) &&
          this._bitmapTextRef.fontSize > 8
        ) {
          this._bitmapTextRef.fontSize -= 2;
        }
        this.fontSize = this._bitmapTextRef.fontSize;
        this._bitmapTextRef.text = data;
        this.setOutputData('data', data);
      }
    };

    // scale input if node is scaled
    this.onNodeResize = (newWidth, newHeight) => {
      this.nodeWidth = newWidth;
      this.nodeHeight = newHeight;
      if (this._spriteRef !== undefined) {
        this._spriteRef.width = newWidth;
        this._spriteRef.height = newHeight;
        this._bitmapTextRef.maxWidth = newWidth - NOTE_PADDING * 2;
        this._bitmapTextRef.x = (SOCKET_WIDTH + newWidth) / 2;
        this._bitmapTextRef.y = (newHeight * verticalTextureOffset) / 2;
        this._maskRef.x = this._spriteRef.x;
        this._maskRef.y = this._spriteRef.y;
        this._maskRef.width = newWidth;
        this._maskRef.height = newHeight;
      }
      if (this.currentInput !== null) {
        this.currentInput.style.width = `${newWidth}px`;
        this.currentInput.style.height = `${
          newHeight * verticalTextureOffset
        }px`;
      }
    };

    this.onNodeResized = () => {
      if (this._bitmapTextRef !== undefined) {
        this._bitmapTextRef.visible = false;
        this.createInputElement(true);
        this.currentInput.dispatchEvent(new Event('input'));
        this.setCleanAndDisplayText(this.currentInput);
        this.currentInput.remove();
        this._bitmapTextRef.visible = true;
      }
    };

    this.onNodeDoubleClick = () => {
      console.log('onNodeDoubleClick:', this.id);
      this.createInputElement();
    };

    // scale input if node is scaled
    this.onNodeDragOrViewportMove = () => {
      if (this.currentInput !== null) {
        const screenPoint = this.graph.viewport.toScreen(this.x, this.y);
        this.currentInput.style.transform = `scale(${this.graph.viewport.scale.x}`;
        this.currentInput.style.left = `${screenPoint.x}px`;
        this.currentInput.style.top = `${screenPoint.y}px`;
      }
    };

    this.onExecute = async () => {
      if (!this.doubleClicked) {
        this.update();
      }
    };
  }
}

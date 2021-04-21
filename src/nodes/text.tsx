import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Color from 'color';
import { Resizable } from 're-resizable';
import textFit from '../pixi/textFit';
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
import { CustomArgs } from '../utils/interfaces';
import {
  convertStringToSlateNodes,
  convertSlateNodesToString,
} from '../utils/utils';
import {
  COLOR,
  DATATYPE,
  NODE_OUTLINE_DISTANCE,
  NOTE_FONTSIZE,
  NOTE_LINEHEIGHT_FACTOR,
  NOTE_FONT,
  NOTE_MARGIN_STRING,
  NOTE_PADDING,
  NOTE_TEXTURE,
  SOCKET_WIDTH,
} from '../utils/constants';
import styles from '../utils/style.module.css';

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

type ParagraphElement = {
  type?: 'paragraph';
  children: CustomText[];
};

type HeadingElement = {
  type: 'heading';
  level: number;
  children: CustomText[];
};

type CustomElement = ParagraphElement | HeadingElement;

type FormattedText = { text: string; bold: boolean; italic: boolean };

type CustomText = FormattedText;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

type TextAdditionalProps = {
  width?: number;
  height?: number;
  focus?: boolean;
};

export class Text extends PPNode {
  update: (additionalProps?: TextAdditionalProps) => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 300;
    const nodeHeight = 100;
    const isHybrid = true;

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      isHybrid,
    });

    this.addOutput('data', DATATYPE.ANY, undefined, false);
    this.addOutput('text', DATATYPE.STRING, undefined, false);
    this.addInput(
      'initialData',
      DATATYPE.STRING,
      customArgs?.initialData,
      false
    );
    this.addInput('data', DATATYPE.ANY, customArgs?.data ?? undefined, false);
    this.addInput(
      'width',
      DATATYPE.NUMBER,
      customArgs?.width ?? nodeWidth,
      false
    );
    this.addInput(
      'height',
      DATATYPE.NUMBER,
      customArgs?.height ?? nodeHeight,
      false
    );

    this.name = 'Text';
    this.description = 'Adds text';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      let data = this.getInputData('data');

      // check if data is null or undefined
      // and use initialData to create data
      if (data == null) {
        data = convertStringToSlateNodes(this.getInputData('initialData'));
        // store data
        this.setInputData('data', data);
      }

      this.createContainerComponent(document, TextParent, {
        ...baseProps,
        width: nodeWidth,
        height: nodeHeight,
        data,
        focus: true,
      });
      this.container.style.width = 'auto';
      this.container.style.height = 'auto';
    };

    // when the stored data is read, resize the node and update the react component
    this.onConfigure = (): void => {
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.resizeNode(width, height);

      this.update({ width, height });
    };

    // update the react component
    this.update = (additionalProps?: TextAdditionalProps): void => {
      const data = this.getInputData('data');
      this.renderReactComponent(TextParent, {
        ...baseProps,
        ...additionalProps,
        data,
      });
      this.setOutputData('data', data);
      this.setOutputData('text', convertSlateNodesToString(data));
    };

    this.onNodeSelected = () => {
      console.log('onNodeSelected:', this.id);
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.update({ width, height });
    };

    this.onNodeDoubleClick = () => {
      console.log('onNodeDoubleClick:', this.id);
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.update({ width, height, focus: true });
    };

    this.onExecute = (input, output) => {
      // const data = input['data']; // text can not be updated while running when using this function. Had to use getInputData. Why?
      if (!this.doubleClicked) {
        const data = this.getInputData('data');
        this.setOutputData('data', data);
        this.setOutputData('text', convertSlateNodesToString(data));

        this.update();
      }
    };

    const baseProps = {
      update: this.update.bind(this),
      resizeNode: this.resizeNode.bind(this),
      setInputData: this.setInputData.bind(this),
      setOutputData: this.setOutputData.bind(this),
    };
  }
}

type TextProps = {
  update(): void;
  resizeNode(width: number, height: number): void;
  setInputData(name: string, data: any): void;
  setOutputData(name: string, data: any): void;
  id: string;
  selected: boolean;
  doubleClicked: boolean;
  focus?: boolean;

  width: number;
  height: number;
  data: any;
};

const TextParent: React.FunctionComponent<TextProps> = (props) => {
  const [width, setWidth] = React.useState(props.width);
  const [height, setHeight] = React.useState(props.height);

  // run on any props change after initial creation
  useEffect(() => {
    // change only if it was set
    if (props.width) {
      setWidth(props.width);
    }
    if (props.height) {
      setHeight(props.height);
    }
  }, [props.width, props.height]);

  return (
    <Resizable
      enable={{
        right: true,
        bottom: true,
        bottomRight: true,
        top: false,
        left: false,
        topRight: false,
        topLeft: false,
        bottomLeft: false,
      }}
      className={styles.resizeElement}
      handleClasses={{
        right: styles.resizeHandle,
        bottomRight: styles.resizeHandle,
        bottom: styles.resizeHandle,
      }}
      style={{
        borderStyle: 'dashed',
        borderWidth: props.doubleClicked ? '0 1px 1px 0' : '0',
        borderColor: 'rgba(225, 84, 125, 1)',
      }}
      size={{ width, height }}
      onResize={(e, direction, ref, d) => {
        const width = ref.offsetWidth;
        const height = ref.offsetHeight;
        setWidth(width);
        setHeight(height);
        props.resizeNode(width, height);
      }}
      onResizeStop={(e, direction, ref, d) => {
        const width = ref.offsetWidth;
        const height = ref.offsetHeight;
        props.setInputData('width', width);
        props.setInputData('height', height);
        console.log('onResizeStop: ', props.width, props.height);
      }}
    >
      <SlateEditorContainer {...props} />
    </Resizable>
  );
};

const SlateEditorContainer: React.FunctionComponent<TextProps> = (props) => {
  // const focused = useFocused();
  // const selected = useSelected();
  const [value, setValue] = useState<Descendant[]>(props.data);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const toggleFormat = (editor, format) => {
    const isActive = isFormatActive(editor, format);
    Transforms.setNodes(
      editor,
      { [format]: isActive ? null : true },
      { match: SlateText.isText, split: true }
    );
  };

  const isFormatActive = (editor, format) => {
    const [match] = Editor.nodes(editor, {
      match: (n) => n[format] === true,
      mode: 'all',
    });
    return !!match;
  };

  const toggleType = (editor, nodeType, nodeLevel) => {
    const match = isTypeActive(editor, nodeType, nodeLevel);
    Transforms.setNodes(
      editor,
      {
        type: match ? 'paragraph' : nodeType,
        level: match ? undefined : nodeLevel,
      },
      { match: (n) => Editor.isBlock(editor, n) }
    );
  };

  const isTypeActive = (editor, type, nodeLevel) => {
    const [match] = Editor.nodes(editor, {
      match: (n) => {
        if (type === 'heading') {
          return (n as any).type === type && (n as any).level === nodeLevel;
        }
        return (n as any).type === type;
      },
    });
    return !!match;
  };

  const HoveringToolbar = () => {
    const ref = useRef<HTMLDivElement | null>();
    const editor = useSlate();

    useEffect(() => {
      const el = ref.current;
      const { selection } = editor;

      if (!el) {
        return;
      }

      if (
        !selection ||
        !ReactEditor.isFocused(editor) ||
        Range.isCollapsed(selection) ||
        Editor.string(editor, selection) === ''
      ) {
        el.removeAttribute('style');
        return;
      }

      const domSelection = window.getSelection();
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();
      el.style.opacity = '1';
      el.style.top = `${Math.abs(
        rect.top + window.pageYOffset - el.offsetHeight
      )}px`;
      el.style.left = `${Math.abs(
        rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
      )}px`;
    }, [editor.selection]);

    return (
      <Portal>
        <Menu ref={ref} className={styles.slateMenu}>
          <ButtonGroup minimal={true}>
            <TypeButton type="heading" level={1} icon="header-one" />
            <TypeButton type="heading" level={2} icon="header-two" />
            <TypeButton type="paragraph" icon="paragraph" />
            <TypeButton type="code" icon="code" />
            <Divider />
            <FormatButton format="bold" icon="bold" />
            <FormatButton format="italic" icon="italic" />
            <FormatButton format="underlined" icon="underline" />
            <FormatButton format="strikethrough" icon="strikethrough" />
          </ButtonGroup>
        </Menu>
      </Portal>
    );
  };

  const FormatButton = ({ format, icon }) => {
    const editor = useSlate();
    return (
      <Button
        active={isFormatActive(editor, format)}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleFormat(editor, format);
        }}
        icon={icon}
      />
    );
  };

  const TypeButton = ({ type, icon, level = undefined }) => {
    const editor = useSlate();
    return (
      <Button
        active={isTypeActive(editor, type, level)}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleType(editor, type, level);
        }}
        icon={icon}
      />
    );
  };

  const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.italic) {
      children = <em>{children}</em>;
    }

    if (leaf.underlined) {
      children = <u>{children}</u>;
    }

    if (leaf.strikethrough) {
      children = <del>{children}</del>;
    }

    return <span {...attributes}>{children}</span>;
  };

  const HeadingElement = (props) => {
    switch (props.element?.level) {
      case 1:
        return <H2 {...props.attributes}>{props.children}</H2>;
      case 2:
        return <H3 {...props.attributes}>{props.children}</H3>;

      default:
        return <H2 {...props.attributes}>{props.children}</H2>;
    }
  };

  const CodeElement = (props) => {
    return (
      <pre {...props.attributes}>
        <code>{props.children}</code>
      </pre>
    );
  };

  const ParagraphElement = (props) => {
    return <p {...props.attributes}>{props.children}</p>;
  };

  // Define a rendering function based on the element passed to `props`. We use
  // `useCallback` here to memoize the function for subsequent renders.
  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case 'heading':
        return <HeadingElement {...props} />;
      case 'code':
        return <CodeElement {...props} />;
      default:
        return <ParagraphElement {...props} />;
    }
  }, []);

  // run on any props change after initial creation
  useEffect(() => {
    // change only if it was set
    if (props.data) {
      setValue(props.data);
    }
  }, [props.data]);

  useEffect(() => {
    if (props.focus) {
      ReactEditor.focus(editor);
    }
  }, [props.focus]);

  return (
    <div className={styles.slateEditorContainer}>
      <Slate
        editor={editor}
        value={value}
        onChange={(value) => {
          setValue(value);
          props.setInputData('data', value);
          props.update();
        }}
      >
        <HoveringToolbar />
        <Editable
          renderElement={renderElement}
          renderLeaf={(props) => <Leaf {...props} />}
          placeholder="Write away..."
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
                return toggleFormat(editor, 'underline');
            }
          }}
        />
      </Slate>
    </div>
  );
};

type LabelAdditionalProps = {
  backgroundColor?: string;
  width?: number;
  height?: number;
  focus?: boolean;
};

export class Label extends PPNode {
  update: (additionalProps?: LabelAdditionalProps) => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 300;
    const nodeHeight = 62;
    const isHybrid = true;
    const defaultColor = COLOR[5];

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      isHybrid,
      color: defaultColor,
      colorTransparency: 1.0,
    });

    this.addOutput('data', DATATYPE.STRING, undefined, false);
    this.addInput('data', DATATYPE.STRING, customArgs?.data ?? '', false);
    this.addInput(
      'backgroundColor',
      DATATYPE.COLOR,
      Color(defaultColor).array(),
      false
    );
    this.addInput(
      'width',
      DATATYPE.NUMBER,
      customArgs?.width ?? nodeWidth,
      false
    );
    this.addInput(
      'height',
      DATATYPE.NUMBER,
      customArgs?.height ?? nodeHeight,
      false
    );

    this.name = 'Label';
    this.description = 'Adds text';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const data = this.getInputData('data') ?? '';
      this.createContainerComponent(document, LabelParent, {
        data,
        focus: true,
      });
      // reset width and height
      this.container.style.width = 'auto';
      this.container.style.height = 'auto';
    };

    // when the stored data is read, resize the node and update the react component
    this.onConfigure = (): void => {
      const color = Color.rgb(this.getInputData('backgroundColor') as number[]);
      // console.log(input['color']);
      this.color = PIXI.utils.string2hex(color.hex());
      this.colorTransparency = color.alpha();
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.resizeNode(width, height);

      this.update({ width, height });
    };

    // update the react component
    this.update = (additionalProps?: LabelAdditionalProps): void => {
      const data = this.getInputData('data');
      this.renderReactComponent(LabelParent, {
        ...baseProps,
        ...additionalProps,
        data,
      });
      this.setOutputData('data', data);
    };

    this.onNodeSelected = () => {
      console.log('onNodeSelected:', this.id);
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.update({ width, height });
    };

    this.onNodeDoubleClick = () => {
      console.log('onNodeDoubleClick:', this.id);
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.update({ width, height, focus: true });
    };

    this.onExecute = (input, output) => {
      if (!this.doubleClicked) {
        const data = input['data'];
        const color = Color.rgb(input['backgroundColor'] as number[]);
        // console.log(input['color']);
        this.color = PIXI.utils.string2hex(color.hex());
        this.colorTransparency = color.alpha();
        this.setOutputData('data', data);

        this.update();
      }
    };

    const baseProps = {
      update: this.update.bind(this),
      resizeNode: this.resizeNode.bind(this),
      setInputData: this.setInputData.bind(this),
      setOutputData: this.setOutputData.bind(this),
    };

    // const style = {
    //   display: 'flex',
    //   // alignItems: 'center',
    //   // justifyContent: 'center',
    //   border: 'solid 1px #ddd',
    //   background: '#f0f0f0',
    // } as const;
  }
}

type LabelProps = {
  update(): void;
  resizeNode(width: number, height: number): void;
  setInputData(name: string, data: any): void;
  setOutputData(name: string, data: any): void;
  id: string;
  selected: boolean;
  doubleClicked: boolean;
  focus?: boolean;

  width: number;
  height: number;
  data: any;
};

const LabelParent: React.FunctionComponent<LabelProps> = (props) => {
  const [width, setWidth] = React.useState(props.width);
  const [height, setHeight] = React.useState(props.height);
  const [value, setValue] = React.useState(props.data);

  // run on any props change after initial creation
  useEffect(() => {
    // change only if it was set
    if (props.width) {
      setWidth(props.width);
    }
    if (props.height) {
      setHeight(props.height);
    }
  }, [props.width, props.height]);

  useEffect(() => {
    setValue(props.data);
  }, [props.data]);

  useEffect(() => {
    // save value
    if (!props.selected && props.setInputData !== undefined) {
      onConfirm(value);
    }
  }, [props.selected]);

  const onConfirm = (value) => {
    setValue(value);
    props.setInputData('data', value);
    props.update();
  };

  return (
    <Resizable
      enable={{
        right: true,
        bottom: false,
        bottomRight: false,
        top: false,
        left: false,
        topRight: false,
        topLeft: false,
        bottomLeft: false,
      }}
      className={styles.resizeElementLabel}
      handleClasses={{
        right: styles.resizeHandle,
        // bottomRight: styles.resizeHandle,
        // bottom: styles.resizeHandle,
      }}
      style={{
        borderStyle: 'dashed',
        borderWidth: props.doubleClicked ? '0 1px 0 0' : '0',
        borderColor: 'rgba(225, 84, 125, 1)',
      }}
      size={{ width, height }}
      onResize={(e, direction, ref, d) => {
        const width = ref.offsetWidth;
        const height = ref.offsetHeight;
        setWidth(width);
        setHeight(height);
        props.resizeNode(width, height);
      }}
      onResizeStop={(e, direction, ref, d) => {
        const width = ref.offsetWidth;
        const height = ref.offsetHeight;
        props.setInputData('width', width);
        props.setInputData('height', height);
        console.log('onResizeStop: ', props.width, props.height);
      }}
    >
      <H1>
        <EditableText
          placeholder="Write away..."
          onChange={(value) => setValue(value)}
          onConfirm={onConfirm}
          isEditing={props.focus || props.doubleClicked}
          defaultValue={props.data}
          key={props.data} // hack so defaultValue get's set
          selectAllOnFocus={true}
          // multiline={true}
        />
      </H1>
    </Resizable>
  );
};

export class Note extends PPNode {
  _rectRef: PIXI.Sprite;
  _textInputRef: PIXI.BitmapText;
  currentInput: HTMLDivElement;
  fontSize: number;
  createInputElement: () => void;
  setCleanAndDisplayText: (input: HTMLDivElement) => void;
  update: () => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 160;
    const nodeHeight = 160;
    const defaultColor = '#F4FAF9';

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      colorTransparency: 0,
    });

    this.addOutput('data', DATATYPE.STRING, undefined, false);
    this.addInput(
      'data',
      DATATYPE.STRING,
      customArgs?.data ?? 'Write away...',
      false
    );

    this.name = 'Note';
    this.description = 'Adds a note';

    this.currentInput = null;
    this.fontSize = 60; // set default to maxFontSize

    const textFitOptions = {
      multiLine: true,
      maxFontSize: this.fontSize,
      // alignVertWithFlexbox: true,
    };

    const loader = new PIXI.Loader();
    loader.add('NoteFont', NOTE_FONT).load(() => {
      const note = PIXI.Sprite.from(NOTE_TEXTURE);
      note.x = SOCKET_WIDTH / 2;
      note.y = NODE_OUTLINE_DISTANCE;
      note.width = nodeWidth;
      note.height = nodeHeight;

      // create and position PIXI.Text
      const basicText = new PIXI.BitmapText(
        customArgs?.data ?? 'Write away...',
        {
          fontName: 'Arial',
          fontSize: NOTE_FONTSIZE,
          align: 'center',
          maxWidth: nodeWidth - NOTE_PADDING * 2,
        }
      );
      basicText.anchor = new PIXI.Point(0.5, 0.5);
      basicText.x = (SOCKET_WIDTH + nodeWidth) / 2;
      basicText.y = (NODE_OUTLINE_DISTANCE + nodeHeight) / 2;

      this._NodeNameRef.visible = false;

      (this._rectRef as any) = (this as PIXI.Container).addChild(note);
      this._rectRef.alpha = 1;
      this._rectRef.tint = PIXI.utils.string2hex(Color(defaultColor).hex());

      const mask = new PIXI.Graphics();
      mask.beginFill(0xffffff);
      mask.drawRect(note.x, note.y, note.width, note.height); // In this case it is 8000x8000
      mask.endFill();
      (this as PIXI.Container).addChild(mask);

      this._textInputRef = (this as PIXI.Container).addChild(basicText);
      this._textInputRef.mask = mask;
      this.update();
    });

    this.createInputElement = () => {
      // create html input element
      this._textInputRef.visible = false;
      const screenPoint = this.graph.viewport.toScreen(this.x, this.y);

      this.currentInput = document.createElement('div');
      this.currentInput.id = 'NoteInput';
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
        outline: '1px dashed black',
        left: `${screenPoint.x}px`,
        top: `${screenPoint.y}px`,
        width: `${nodeWidth}px`,
        height: `${nodeHeight - NOTE_PADDING}px`,
        resize: 'none',
        overflowY: 'scroll',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        flexDirection: 'column',
      };
      Object.assign(this.currentInput.style, style);

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

      this.currentInput.dispatchEvent(new Event('input'));

      // add event handlers
      this.currentInput.addEventListener('blur', (e) => {
        console.log('blur', e);
        this.currentInput.dispatchEvent(new Event('input'));
        this.setCleanAndDisplayText(this.currentInput);
        this.currentInput.remove();
        this._textInputRef.visible = true;
      });

      this.currentInput.addEventListener('input', (e) => {
        // console.log('input', e);
        // run textFit to recalculate the font size
        textFit(this.currentInput, textFitOptions);
      });

      document.body.appendChild(this.currentInput);
      console.log(this.currentInput);
    };

    this.setCleanAndDisplayText = (input: HTMLDivElement) => {
      // get font size of editable div
      const style = window.getComputedStyle(input.children[0], null);

      const newText = input.textContent;
      const newFontSize = Math.min(parseInt(style.fontSize, 10), this.fontSize);

      this._textInputRef.fontSize = newFontSize;
      this._textInputRef.text = input.textContent;

      this.setInputData('data', newText);
      this.setOutputData('data', newText);

      this.fontSize = newFontSize;
    };

    this.onNodeDoubleClick = () => {
      console.log('onNodeDoubleClick:', this.id);
      this.createInputElement();
    };

    this.update = () => {
      const data = this.getInputData('data');
      if (this._textInputRef) {
        this._textInputRef.text = data;
        while (
          (this._textInputRef.height > nodeHeight - NOTE_PADDING * 2 ||
            this._textInputRef.width > nodeWidth - NOTE_PADDING * 2) &&
          this._textInputRef.fontSize > 8
        ) {
          this._textInputRef.fontSize -= 2;
        }
        this.fontSize = this._textInputRef.fontSize;
        this._textInputRef.text = data;
        this.setOutputData('data', data);
      }
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

    this.onExecute = () => {
      if (!this.doubleClicked) {
        this.update();
      }
    };
  }
}

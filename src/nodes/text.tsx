import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Resizable } from 're-resizable';
import { Button, ButtonGroup, H1, H2, H3, Divider } from '@blueprintjs/core';
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
import { DATATYPE } from '../utils/constants';
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

type AdditionalProps = {
  width?: number;
  height?: number;
  focus?: boolean;
};

export class Text extends PPNode {
  update: (additionalProps?: AdditionalProps) => void;

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

      this.createContainerComponent(document, Parent, {
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
    this.update = (additionalProps?: AdditionalProps): void => {
      const data = this.getInputData('data');
      this.renderReactComponent(Parent, {
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

type Props = {
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

const Parent: React.FunctionComponent<Props> = (props) => {
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

const SlateEditorContainer: React.FunctionComponent<Props> = (props) => {
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

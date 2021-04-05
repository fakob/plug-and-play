import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Resizable } from 're-resizable';
import { Button, ButtonGroup, Icon, H1, Divider } from '@blueprintjs/core';
// import { Classes, Popover2 } from '@blueprintjs/popover2';
import {
  BaseEditor,
  createEditor,
  Descendant,
  Editor,
  Node,
  Range,
  Text as SlateText,
  Transforms,
} from 'slate';
import { Slate, Editable, withReact, ReactEditor, useSlate } from 'slate-react';
import { Menu, Portal } from '../utils/slate-editor-components';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs } from '../utils/interfaces';
import { DATATYPE } from '../utils/constants';
import styles from '../utils/style.module.css';

type CustomElement = { type: 'paragraph'; children: CustomText[] };

export type CustomText = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  text: string;
};

export type EmptyText = {
  text: string;
};

export type CustomEditor = BaseEditor & ReactEditor;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText | EmptyText;
  }
}

export class Text extends PPNode {
  update: (width?: number, height?: number) => void;
  convertString: (text: string) => any;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 300;
    const nodeHeight = 300;
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
      customArgs?.initialData ?? 'Write away...',
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
        data = this.convertString(this.getInputData('initialData'));
        // store data
        this.setInputData('data', data);
      }

      this.createContainerComponent(document, Parent, {
        width: nodeWidth,
        height: nodeHeight,
        data,
        isEditing: true,
      });
      this.container.style.width = 'auto';
      this.container.style.height = 'auto';
    };

    this.convertString = (text: string) => {
      return text.split('\n').map((line) => {
        return {
          children: [{ text: line }],
        };
      });
    };

    // when the stored data is read, resize the node and update the react component
    this.onConfigure = (): void => {
      const width = this.getInputData('width');
      const height = this.getInputData('height');
      this.resizeNode(width, height);

      this.update(width, height);
    };

    // update the react component
    this.update = (width?: number, height?: number): void => {
      const data = this.getInputData('data');
      this.renderReactComponent(Parent, {
        width,
        height,
        data,
      });
      this.setOutputData('data', data);
    };

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
        console.log(
          rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2,
          rect.top + window.pageYOffset - el.offsetHeight
        );
        el.style.opacity = '1';
        el.style.top = `${Math.abs(
          rect.top + window.pageYOffset - el.offsetHeight
        )}px`;
        el.style.left = `${Math.abs(
          rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
        )}px`;
      });

      return (
        <Portal>
          <Menu ref={ref} className={styles.slateMenu}>
            <FormatButton format="bold" icon="bold" />
            <FormatButton format="italic" icon="italic" />
            <FormatButton format="underlined" icon="underline" />
          </Menu>
        </Portal>
      );
    };

    // <ButtonGroup style={{ minWidth: 200 }} {...bgProps}>
    //   <Button icon="database">{!iconOnly && 'Queries'}</Button>
    //   <Button icon="function">{!iconOnly && 'Functions'}</Button>
    //   <AnchorButton icon="cog" rightIcon="settings">
    //     {!iconOnly && 'Options'}
    //   </AnchorButton>
    // </ButtonGroup>;

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

      return <span {...attributes}>{children}</span>;
    };

    // small presentational component
    const Parent = (props) => {
      // const focused = useFocused();
      // const selected = useSelected();
      const [width, setWidth] = React.useState(props.width);
      const [height, setHeight] = React.useState(props.height);
      const [value, setValue] = useState<Descendant[]>(props.data);
      const editor = useMemo(() => withReact(createEditor()), []);

      // run on any props change after initial creation
      useEffect(() => {
        // change only if it was set
        if (props.data) {
          setValue(props.data);
        }
        if (props.width) {
          setWidth(props.width);
        }
        if (props.height) {
          setHeight(props.height);
        }
      }, [props.data, props.width, props.height]);

      // useEffect(() => {
      //   console.log('focused', ReactEditor.isFocused(editor));
      // }, [ReactEditor.isFocused(editor)]);

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
          style={
            {
              // border: ReactEditor.isFocused(editor)
              //   ? 'solid 1px #ddd'
              //   : undefined,
              // background: ReactEditor.isFocused(editor) ? '#f0f0f0' : undefined,
            }
          }
          size={{ width, height }}
          onResize={(e, direction, ref, d) => {
            const width = ref.offsetWidth;
            const height = ref.offsetHeight;
            setWidth(width);
            setHeight(height);
            this.resizeNode(width, height);
          }}
          onResizeStop={(e, direction, ref, d) => {
            const width = ref.offsetWidth;
            const height = ref.offsetHeight;
            this.setInputData('width', width);
            this.setInputData('height', height);
          }}
        >
          <div className={styles.slateEditorContainer}>
            <Slate
              editor={editor}
              value={value}
              onChange={(value) => {
                setValue(value);
                this.setInputData('data', value);
                this.setInputData('data', value);
                this.setOutputData(
                  'text',
                  value.map((n) => Node.string(n)).join('\n')
                );
              }}
            >
              <HoveringToolbar />
              <Editable
                renderLeaf={(props) => <Leaf {...props} />}
                placeholder="Enter some text..."
                onDOMBeforeInput={(event: InputEvent) => {
                  // console.log(event);
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
        </Resizable>
      );
    };

    this.onExecute = (input, output) => {
      const data = input['data'];
      this.update();
      this.setOutputData('data', data);
      this.setOutputData('text', data.map((n) => Node.string(n)).join('\n'));
    };
  }
}

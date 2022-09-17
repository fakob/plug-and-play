import React, { useState } from 'react';
import { Editor, Range, Transforms, Element as SlateElement } from 'slate';
import { useFocused, useSelected, useReadOnly } from 'slate-react';
import { Typography, styled } from '@mui/material';
import isUrl from 'is-url';
import { LinkElement, MentionElement } from './custom-types';
import { COLOR_DARK, RANDOMMAINCOLOR } from '../../utils/constants';
import { TRgba } from '../../utils/interfaces';

const MyBlockquote = styled('blockquote')(({ theme }) => ({
  fontStyle: 'italic',
  color: COLOR_DARK,
  // borderLeft: `4px solid ${theme.palette.primary.main}`,
  borderLeft: `4px solid ${COLOR_DARK}`,
  margin: 0,
  padding: '8px',
}));

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

export const isBlockActive = (
  editor: Editor,
  format,
  blockType = 'type'
): boolean => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  );

  return !!match;
};

export const getBlockType = (editor: Editor, blockType = 'type'): string => {
  const { selection } = editor;
  if (!selection) return '';

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n),
    })
  );
  const type = match[0][blockType];
  return type;
};

export const toggleBlock = (editor: Editor, format): void => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });
  let newProperties: Partial<SlateElement>;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
  }
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

export const isMarkActive = (editor: Editor, format): boolean => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

export const getMarks = (editor: Editor) => {
  const marks = Editor.marks(editor);
  const marksArray: string[] = [];
  Object.keys(marks).forEach((key, index) => {
    if (marks[key] === true) {
      marksArray.push(key);
    }
  });
  return marksArray;
};

export const toggleMark = (editor: Editor, format): void => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const Element = (props) => {
  const { attributes, children, element } = props;
  const style = { textAlign: element.align };
  switch (element.type) {
    case 'block-quote':
      return (
        <MyBlockquote style={style} {...attributes}>
          {children}
        </MyBlockquote>
      );
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case 'heading-one':
      return (
        <Typography variant="h1" style={style} {...attributes}>
          {children}
        </Typography>
      );
    case 'heading-two':
      return (
        <Typography variant="h2" style={style} {...attributes}>
          {children}
        </Typography>
      );
    case 'heading-three':
      return (
        <Typography variant="h3" style={style} {...attributes}>
          {children}
        </Typography>
      );
    case 'heading-four':
      return (
        <Typography variant="h4" style={style} {...attributes}>
          {children}
        </Typography>
      );
    case 'heading-five':
      return (
        <Typography variant="h5" style={style} {...attributes}>
          {children}
        </Typography>
      );
    case 'heading-six':
      return (
        <Typography variant="h6" style={style} {...attributes}>
          {children}
        </Typography>
      );
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case 'numbered-list':
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      );
    case 'link':
      return <LinkComponent {...props} />;
    case 'mention':
      return <Mention {...props} />;
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

export const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return (
    <span
      // The following is a workaround for a Chromium bug where,
      // if you have an inline at the end of a block,
      // clicking the end of a block puts the cursor inside the inline
      // instead of inside the final {text: ''} node
      // https://github.com/ianstormtaylor/slate/issues/4704#issuecomment-1006696364
      style={{
        paddingLeft: leaf.text === '' ? '0.1px' : '0',
      }}
      {...attributes}
    >
      {children}
    </span>
  );
};

export const withLinks = (editor: Editor): Editor => {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = (element) =>
    ['link', 'button'].includes(element.type) || isInline(element);

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertText(text);
    }
  };

  editor.insertData = (data) => {
    const text = data.getData('text/plain');

    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
};

export const insertLink = (editor: Editor, url): void => {
  if (editor.selection) {
    wrapLink(editor, url);
  }
};

export const isLinkActive = (editor: Editor): boolean => {
  const [link] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
  return !!link;
};

export const getLink = (editor: Editor): SlateElement | undefined => {
  const linkEntries = Array.from(
    Editor.nodes(editor, { match: (n: any) => n.type === 'link' })
  );
  if (linkEntries.length === 0) {
    return undefined;
  }

  const node = linkEntries[0][0];
  return SlateElement.isElement(node) ? node : undefined;
};

export const unwrapLink = (editor: Editor): void => {
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
};

const wrapLink = (editor: Editor, url: string) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link: LinkElement = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
};

// Put this at the start and end of an inline component to work around this Chromium bug:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
const InlineChromiumBugfix = () => (
  <span
    contentEditable={false}
    style={{
      fontSize: 0,
    }}
  >
    ${String.fromCodePoint(160) /* Non-breaking space */}
  </span>
);

const LinkComponent = ({ attributes, children, element }) => {
  const [isMouseOver, setIsMouseOver] = useState(false);
  const selected = useSelected();
  const focused = useFocused();

  return (
    <a
      {...attributes}
      href={element.url}
      style={{
        display: 'inline-block',
        background: selected && focused ? 'rgba(0,0,0,0.05)' : 'none',
        cursor: isMouseOver ? 'pointer' : 'default',
      }}
      title="Alt+Click to open"
      onClick={(e) => {
        if (e.altKey) {
          window.open(element.url, '_blank');
        }
      }}
      onPointerEnter={(e) => {
        if (e.altKey) {
          setIsMouseOver(true);
        }
      }}
      onPointerLeave={() => {
        setIsMouseOver(false);
      }}
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </a>
  );
};

export const withMentions = (editor: Editor) => {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === 'mention' ? true : isVoid(element);
  };

  return editor;
};

export const insertMention = (editor: Editor, character) => {
  const mention: MentionElement = {
    type: 'mention',
    character,
    children: [{ text: '' }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};

const Mention = (props) => {
  const { attributes, children, element } = props;
  const selected = useSelected();
  const focused = useFocused();
  const readOnly = useReadOnly();
  const randomColor = TRgba.fromString(RANDOMMAINCOLOR);
  randomColor.a = 0.2;

  return readOnly ? (
    <span
      {...attributes}
      contentEditable={false}
      data-cy={`mention-${element.character.replace(' ', '-')}`}
      style={{
        backgroundColor: `${randomColor.rgb()}`,
      }}
    >
      {children}
      {element?.reactiveText}
    </span>
  ) : (
    <span
      {...attributes}
      contentEditable={false}
      data-cy={`mention-${element.character.replace(' ', '-')}`}
      style={{
        padding: '2px 3px 1px',
        margin: '0 1px',
        verticalAlign: 'baseline',
        display: 'inline-block',
        borderRadius: '4px',
        backgroundColor: `${randomColor.rgb()}`,
        fontSize: '0.9em',
        boxShadow:
          selected && focused ? '0 0 0 0.5px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      {children}@{element.character}
    </span>
  );
};

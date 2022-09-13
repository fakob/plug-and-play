import React from 'react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { Typography, styled } from '@mui/material';
import { COLOR_DARK } from '../../utils/constants';

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

export const toggleBlock = (editor, format) => {
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
  // let newProperties: Partial<SlateElement>;
  let newProperties: any;
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

export const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const isBlockActive = (editor, format, blockType = 'type') => {
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

export const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

export const Element = ({ attributes, children, element }) => {
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

  return <span {...attributes}>{children}</span>;
};

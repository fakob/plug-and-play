import React from 'react';
import { Editor, Range, Transforms, Element as SlateElement } from 'slate';
import { Editable, withReact, useSlate, useSelected } from 'slate-react';
import { Typography, styled } from '@mui/material';
import isUrl from 'is-url';
import { LinkElement } from './custom-types';
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

export const withInlines = (editor) => {
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

const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url);
  }
};

const isLinkActive = (editor) => {
  const [link] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
  return !!link;
};

const unwrapLink = (editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
};

const wrapLink = (editor, url: string) => {
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
  const selected = useSelected();
  return (
    <a
      {...attributes}
      href={element.url}
      style={{
        boxShadow: selected ? '0 0 0 3px #ddd' : 'none',
      }}
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </a>
  );
};

// const AddLinkButton = () => {
//   const editor = useSlate();
//   return (
//     <Button
//       active={isLinkActive(editor)}
//       onMouseDown={(event) => {
//         event.preventDefault();
//         const url = window.prompt('Enter the URL of the link:');
//         if (!url) return;
//         insertLink(editor, url);
//       }}
//     >
//       <Icon>link</Icon>
//     </Button>
//   );
// };

// const RemoveLinkButton = () => {
//   const editor = useSlate();

//   return (
//     <Button
//       active={isLinkActive(editor)}
//       onMouseDown={(event) => {
//         if (isLinkActive(editor)) {
//           unwrapLink(editor);
//         }
//       }}
//     >
//       <Icon>link_off</Icon>
//     </Button>
//   );
// };

import React, {
  useEffect,
  useRef,
  useState,
  Ref,
  PropsWithChildren,
} from 'react';
import { Editor, Transforms, Text, Range } from 'slate';
import { useSlate, useFocused } from 'slate-react';

import {
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  // Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  TextField,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import PPNode from '../classes/NodeClass';
import styles from './../utils/style.module.css';
import { theme } from './../utils/customTheme';

const FormatButton = ({ format, FormatIcon }) => {
  const editor = useSlate();
  return (
    <ToggleButton
      value={format}
      onClick={() => toggleFormat(editor, format)}
      selected={isFormatActive(editor, format)}
      aria-label="italic"
    >
      <FormatIcon />
    </ToggleButton>
  );
};

export const toggleFormat = (editor, format) => {
  const isActive = isFormatActive(editor, format);
  Transforms.setNodes(
    editor,
    { [format]: isActive ? null : true },
    { match: Text.isText, split: true }
  );
};

export const isFormatActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => n[format] === true,
    mode: 'all',
  });
  return !!match;
};

export const HoveringToolbar = (props) => {
  const ref = useRef<HTMLDivElement | null>();
  const editor = useSlate();
  const inFocus = useFocused();
  const [x, setX] = React.useState('0px');
  const [y, setY] = React.useState('0px');

  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    if (!el) {
      return;
    }

    console.log(selection);
    console.log(inFocus);
    console.log(Range?.isCollapsed(selection));
    console.log(Editor?.string(editor, selection));
    console.log(window.getSelection()?.getRangeAt(0)?.getBoundingClientRect());

    if (
      !selection ||
      !inFocus ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ''
    ) {
      el.removeAttribute('style');
      return;
    }

    const domSelection = window.getSelection();
    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    console.log(rect);
    el.style.opacity = '1';
    setX(`${rect.top + window.pageYOffset - el.offsetHeight}px`);
    setY(
      `${
        rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
      }px`
    );
  });

  return (
    <ThemeProvider theme={theme}>
      <Paper
        className={styles.floatingNodeMenu}
        elevation={3}
        sx={{
          left: x,
          top: y,
        }}
      >
        <Stack direction="row" spacing={1}>
          <ToggleButtonGroup aria-label="text formatting">
            <FormatButton
              format="bold"
              FormatIcon={FormatBoldIcon}
              aria-label="bold"
            />
            <FormatButton
              format="italic"
              FormatIcon={FormatItalicIcon}
              aria-label="italic"
            />
            <FormatButton
              format="underlined"
              FormatIcon={FormatUnderlinedIcon}
              aria-label="underlined"
            />
          </ToggleButtonGroup>
        </Stack>
      </Paper>
    </ThemeProvider>
  );
};

interface BaseProps {
  className: string;
  [key: string]: unknown;
}
type OrNull<T> = T | null;

export const Button = React.forwardRef(
  (
    {
      className,
      active,
      reversed,
      ...props
    }: PropsWithChildren<
      {
        active: boolean;
        reversed: boolean;
      } & BaseProps
    >,
    ref: Ref<OrNull<HTMLSpanElement>>
  ) => (
    <span
      {...props}
      ref={ref}
      // className={cx(
      //   className,
      //   css`
      //     cursor: pointer;
      //     color: ${reversed
      //       ? active
      //         ? 'white'
      //         : '#aaa'
      //       : active
      //       ? 'black'
      //       : '#ccc'};
      //   `
      // )}
    />
  )
);

export const EditorValue = React.forwardRef(
  (
    {
      className,
      value,
      ...props
    }: PropsWithChildren<
      {
        value: any;
      } & BaseProps
    >,
    ref: Ref<OrNull<null>>
  ) => {
    const textLines = value.document.nodes
      .map((node) => node.text)
      .toArray()
      .join('\n');
    return (
      <div
        ref={ref}
        {...props}
        // className={cx(
        //   className,
        //   css`
        //     margin: 30px -20px 0;
        //   `
        // )}
      >
        <div
        // className={css`
        //   font-size: 14px;
        //   padding: 5px 20px;
        //   color: #404040;
        //   border-top: 2px solid #eeeeee;
        //   background: #f8f8f8;
        // `}
        >
          Slate's value as text
        </div>
        <div
        // className={css`
        //   color: #404040;
        //   font: 12px monospace;
        //   white-space: pre-wrap;
        //   padding: 10px 20px;
        //   div {
        //     margin: 0 0 0.5em;
        //   }
        // `}
        >
          {textLines}
        </div>
      </div>
    );
  }
);

export const Instruction = React.forwardRef(
  (
    { className, ...props }: PropsWithChildren<BaseProps>,
    ref: Ref<OrNull<HTMLDivElement>>
  ) => (
    <div
      {...props}
      ref={ref}
      // className={cx(
      //   className,
      //   css`
      //     white-space: pre-wrap;
      //     margin: 0 -20px 10px;
      //     padding: 10px 20px;
      //     font-size: 14px;
      //     background: #f8f8e8;
      //   `
      // )}
    />
  )
);

export const Menu = React.forwardRef(
  (
    { className, ...props }: PropsWithChildren<BaseProps>,
    ref: Ref<OrNull<HTMLDivElement>>
  ) => (
    <div
      {...props}
      ref={ref}
      // className={cx(
      //   className,
      //   css`
      //     & > * {
      //       display: inline-block;
      //     }

      //     & > * + * {
      //       margin-left: 15px;
      //     }
      //   `
      // )}
    />
  )
);

// export const HoveringToolbar = () => {
//   const ref = useRef<HTMLDivElement | null>();
//   const editor = useSlate();
//   const inFocus = useFocused();

//   useEffect(() => {
//     const el = ref.current;
//     const { selection } = editor;

//     if (!el) {
//       return;
//     }

//     if (
//       !selection ||
//       !inFocus ||
//       Range.isCollapsed(selection) ||
//       Editor.string(editor, selection) === ''
//     ) {
//       el.removeAttribute('style');
//       return;
//     }

//     const domSelection = window.getSelection();
//     const domRange = domSelection.getRangeAt(0);
//     const rect = domRange.getBoundingClientRect();
//     el.style.opacity = '1';
//     el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`;
//     el.style.left = `${
//       rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
//     }px`;
//   });

//   return (
//     <Portal>
//       <Menu
//         ref={ref}
//         // className={css`
//         //   padding: 8px 7px 6px;
//         //   position: absolute;
//         //   z-index: 1;
//         //   top: -10000px;
//         //   left: -10000px;
//         //   margin-top: -6px;
//         //   opacity: 0;
//         //   background-color: #222;
//         //   border-radius: 4px;
//         //   transition: opacity 0.75s;
//         // `}
//         onMouseDown={(e) => {
//           // prevent toolbar from taking focus away from editor
//           e.preventDefault();
//         }}
//       >
//         <FormatButton format="bold" icon="format_bold" />
//         <FormatButton format="italic" icon="format_italic" />
//         <FormatButton format="underlined" icon="format_underlined" />
//       </Menu>
//     </Portal>
//   );
// };

export const Leaf = ({ attributes, children, leaf }) => {
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

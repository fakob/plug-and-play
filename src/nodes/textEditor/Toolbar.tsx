import CodeIcon from '@mui/icons-material/Code';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import LinkIcon from '@mui/icons-material/Link';
import React, { Fragment } from 'react';
import { EditMode } from './custom-types';
import { BlockButton } from './BlockButton';
import { Heading1Icon } from './Heading1Icon';
import { Heading2Icon } from './Heading2Icon';
import { LinkButton } from './LinkButton';
import { MarkButton } from './MarkButton';

const isMac = navigator.platform.indexOf('Mac') != -1;
const controlOrMetaKey = isMac ? '⌘' : 'Ctrl';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ToolbarProps {
  onEditModeChange: (editMode: EditMode) => void;
}

export const Toolbar = ({ onEditModeChange }: ToolbarProps) => {
  return (
    <Fragment>
      <MarkButton
        value="bold"
        aria-label="bold"
        title={`${controlOrMetaKey}+B`}
      >
        <FormatBoldIcon />
      </MarkButton>
      <MarkButton
        value="italic"
        aria-label="italic"
        title={`${controlOrMetaKey}+I`}
      >
        <FormatItalicIcon />
      </MarkButton>
      <MarkButton
        value="underline"
        aria-label="underline"
        title={`${controlOrMetaKey}+U`}
      >
        <FormatUnderlinedIcon />
      </MarkButton>
      <MarkButton
        value="code"
        aria-label="code"
        // title={`${controlOrMetaKey}+B`}
      >
        <CodeIcon />
      </MarkButton>
      {/* <LinkButton aria-label="link" onEditModeChange={onEditModeChange}>
                <LinkIcon />
            </LinkButton> */}
      <BlockButton
        value="heading-three"
        aria-label="heading1"
        title={`${controlOrMetaKey}+Shift+3`}
      >
        <Heading1Icon />
      </BlockButton>
      <BlockButton
        value="heading-four"
        aria-label="heading2"
        title={`${controlOrMetaKey}+Shift+4`}
      >
        <Heading2Icon />
      </BlockButton>
      <BlockButton
        value="numbered-list"
        aria-label="numbered-list"
        title={`${controlOrMetaKey}+Shift+8`}
      >
        <FormatListNumberedIcon />
      </BlockButton>
      <BlockButton
        value="bulleted-list"
        aria-label="bulleted-list"
        title={`${controlOrMetaKey}+Shift+7`}
      >
        <FormatListBulletedIcon />
      </BlockButton>
      <BlockButton
        value="block-quote"
        aria-label="block-quote"
        title={`${controlOrMetaKey}+Shift+9`}
      >
        <FormatQuoteIcon />
      </BlockButton>
    </Fragment>
  );
};

import React from 'react';
import { useSlate } from 'slate-react';
import { Box, Divider, ToggleButtonGroup } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import LinkIcon from '@mui/icons-material/Link';
import { EditMode } from './custom-types';
import { BlockButton } from './BlockButton';
import { Heading1Icon } from './Heading1Icon';
import { Heading2Icon } from './Heading2Icon';
import { LinkButton } from './LinkButton';
import { MarkButton } from './MarkButton';
import { getMarks, getBlockType } from './slate-editor-components';

const isMac = navigator.platform.indexOf('Mac') != -1;
const controlOrMetaKey = isMac ? '⌘' : 'Ctrl';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ToolbarProps {
  onEditModeChange: (editMode: EditMode) => void;
}

export const Toolbar = ({ onEditModeChange }: ToolbarProps) => {
  const editor = useSlate();

  return (
    <Box sx={{ display: 'inline-flex' }}>
      <ToggleButtonGroup
        value={getMarks(editor)}
        size="small"
        sx={{
          '& .MuiToggleButtonGroup-grouped': {
            border: 0,
          },
        }}
      >
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
          value="strikethrough"
          aria-label="strikethrough"
          title={`${controlOrMetaKey}+Shift+X`}
        >
          <FormatStrikethroughIcon />
        </MarkButton>
        <MarkButton
          value="code"
          aria-label="code"
          title={`${controlOrMetaKey}+Shift+C`}
        >
          <CodeIcon />
        </MarkButton>
      </ToggleButtonGroup>
      <Divider
        orientation="vertical"
        variant="middle"
        flexItem
        sx={{ margin: 1 }}
      />
      <LinkButton
        sx={{
          '& .MuiToggleButtonGroup-grouped': {
            border: 0,
          },
        }}
        value={getBlockType(editor, 'type')}
        aria-label="link"
        onEditModeChange={onEditModeChange}
      >
        <LinkIcon />
      </LinkButton>
      <ToggleButtonGroup
        value={getBlockType(editor, 'align') ?? 'left'}
        exclusive
        size="small"
        sx={{
          '& .MuiToggleButtonGroup-grouped': {
            border: 0,
          },
        }}
      >
        <BlockButton
          value="left"
          aria-label="left"
          title={`${controlOrMetaKey}+Shift+L`}
        >
          <FormatAlignLeftIcon />
        </BlockButton>
        <BlockButton
          value="center"
          aria-label="center"
          title={`${controlOrMetaKey}+Shift+E`}
        >
          <FormatAlignCenterIcon />
        </BlockButton>
        <BlockButton
          value="right"
          aria-label="right"
          title={`${controlOrMetaKey}+Shift+R`}
        >
          <FormatAlignRightIcon />
        </BlockButton>
        <BlockButton
          value="justify"
          aria-label="justify"
          title={`${controlOrMetaKey}+Shift+J`}
        >
          <FormatAlignJustifyIcon />
        </BlockButton>
      </ToggleButtonGroup>
      <Divider
        orientation="vertical"
        variant="middle"
        flexItem
        sx={{ margin: 1 }}
      />
      <ToggleButtonGroup
        value={getBlockType(editor, 'type')}
        size="small"
        sx={{
          '& .MuiToggleButtonGroup-grouped': {
            border: 0,
          },
        }}
      >
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
          title={`${controlOrMetaKey}+Shift+7`}
        >
          <FormatListNumberedIcon />
        </BlockButton>
        <BlockButton
          value="bulleted-list"
          aria-label="bulleted-list"
          title={`${controlOrMetaKey}+Shift+8`}
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
      </ToggleButtonGroup>
    </Box>
  );
};

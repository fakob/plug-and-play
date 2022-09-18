import { Fade, Paper, Popper, ThemeProvider } from '@mui/material';
import { customTheme } from '../../utils/constants';
import React, { Fragment, useEffect, useState } from 'react';
import { Editor, Range, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';
import { EditMode, LinkState } from './custom-types';
import { getLink, insertLink, unwrapLink } from './slate-editor-components';
import { LinkEditor } from './LinkEditor';
import { Toolbar } from './Toolbar';

/**
 * Returns the range of the DOM selection.
 * Returns null if there is no selection.
 */
const getDomSelectionRange = () => {
  const domSelection = window.getSelection();
  if (domSelection === null || domSelection.rangeCount === 0) {
    return null;
  }
  return domSelection.getRangeAt(0);
};

export const HoverToolbar: React.FunctionComponent = () => {
  const [editMode, setEditMode] = useState<EditMode>('toolbar');
  const [isToolbarOpen, setToolbarOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [linkState, setLinkState] = useState<LinkState | undefined>();

  const editor = useSlate();

  // Compute editor selection string
  // This is to trigger useEffect even when the content of the selection
  // object changes without the object itself changing.
  const { selection } = editor;
  const selectionStr = JSON.stringify(selection);

  // Compute isTextSelected
  // This is to simply trigger the opening of the toolbar when text is selected
  const isTextSelected =
    ReactEditor.isFocused(editor) &&
    selection !== null &&
    !Range.isCollapsed(selection) &&
    Editor.string(editor, selection) !== '';

  useEffect(() => {
    if (editMode === 'toolbar') {
      if (isTextSelected) {
        const domRange = getDomSelectionRange();
        if (domRange === null) {
          return;
        }
        const rect = domRange.getBoundingClientRect();
        setAnchorEl({
          clientWidth: rect.width,
          clientHeight: rect.height,
          /**
           * This function will be called by the popper to get the
           * bounding rectangle for the selection. Since the selection
           * can change when a toolbar button is clicked, we need to
           * get a fresh selection range before computing the bounding
           * rect. (see https://stackoverflow.com/questions/63747451)
           */
          getBoundingClientRect: () => {
            const innerDomRange = getDomSelectionRange();
            return innerDomRange === null
              ? new DOMRect()
              : innerDomRange.getBoundingClientRect();
          },
        });
        setToolbarOpen(true);
      } else {
        setToolbarOpen(false);
      }
    } else {
      setToolbarOpen(false);
    }
  }, [editMode, isTextSelected, selection, selectionStr]);

  const handleEditModeChanged = (editMode: EditMode) => {
    setEditMode(editMode);
    if (editMode === 'link' && selection !== null) {
      const link = getLink(editor);
      const isNew = link === undefined;
      setLinkState({
        isNew,
        selection,
        url: isNew ? '' : ((link as any)?.url as string),
      });
    }
  };

  const handleLinkCancel = () => {
    if (linkState !== undefined) {
      // reselect in editor because dialog takes away focus
      ReactEditor.focus(editor);
      Transforms.select(editor, linkState.selection);
    }
    setEditMode('toolbar');
  };

  const handleLinkRemove = () => {
    if (linkState !== undefined) {
      // reselect in editor because dialog takes away focus
      ReactEditor.focus(editor);
      Transforms.select(editor, linkState.selection);

      // remove link
      unwrapLink(editor);
    }
    setEditMode('toolbar');
  };

  const handleLinkSave = (url: string) => {
    if (linkState !== undefined) {
      // reselect in editor because dialog takes away focus
      ReactEditor.focus(editor);
      Transforms.select(editor, linkState.selection);

      // insert link
      insertLink(editor, url);
    }
    setEditMode('toolbar');
  };

  return (
    <Fragment>
      <ThemeProvider theme={customTheme}>
        <Popper
          id="toolbar-popper"
          open={isToolbarOpen}
          anchorEl={anchorEl}
          placement="top"
          transition
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper
                sx={{
                  margin: '4px',
                }}
              >
                <Toolbar onEditModeChange={handleEditModeChanged} />
              </Paper>
            </Fade>
          )}
        </Popper>
      </ThemeProvider>
      {editMode === 'link' && linkState !== undefined ? (
        <LinkEditor
          linkState={linkState}
          onCancel={handleLinkCancel}
          onRemove={handleLinkRemove}
          onSave={handleLinkSave}
        />
      ) : null}
    </Fragment>
  );
};

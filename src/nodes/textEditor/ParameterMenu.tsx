import {
  Fade,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  PopperProps,
  ThemeProvider,
} from '@mui/material';
import { createStyles, makeStyles } from '@mui/styles';
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
  // console.log(domSelection, domSelection.rangeCount);
  if (domSelection === null || domSelection.rangeCount === 0) {
    return null;
  }
  // console.log(domSelection, domSelection?.getRangeAt(0));
  return domSelection.getRangeAt(0);
};

const useStyles = makeStyles(() => ({
  paper: {
    margin: '4px',
  },
}));

type MyProps = {
  parameterNameArray: string[];
  onHandleParameterSelect: (event, index) => void;
  setTarget: any;
  index: number;
};

export const ParameterMenu: React.FunctionComponent<MyProps> = (props) => {
  const classes = useStyles();
  const [editMode, setEditMode] = useState<EditMode>('toolbar');
  const [isToolbarOpen, setToolbarOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<any>(null);
  // const [anchorEl, setAnchorEl] = useState<PopperProps['anchorEl']>(null);
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
  }, [editMode, isTextSelected, selection, selectionStr]);

  return (
    <Fragment>
      <ThemeProvider theme={customTheme}>
        <Popper
          id="toolbar-popper"
          open={isToolbarOpen}
          anchorEl={anchorEl}
          placement="bottom"
          transition
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper className={classes.paper}>
                <MenuList variant="menu">
                  {props.parameterNameArray.map((char, i) => (
                    <MenuItem
                      selected={props.index === i}
                      onClick={(event) => {
                        props.onHandleParameterSelect(event, i);
                      }}
                      key={char}
                    >
                      {char}
                    </MenuItem>
                  ))}
                </MenuList>
              </Paper>
            </Fade>
          )}
        </Popper>
      </ThemeProvider>
    </Fragment>
  );
};

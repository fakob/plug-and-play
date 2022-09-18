import {
  Fade,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  ThemeProvider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { customTheme } from '../../utils/constants';
import React, { Fragment, useEffect, useState } from 'react';
import { Editor, Range } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

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

type MyProps = {
  parameterNameArray: string[];
  onHandleParameterSelect: (event, index) => void;
  setTarget: any;
  index: number;
};

export const ParameterMenu: React.FunctionComponent<MyProps> = (props) => {
  const [isToolbarOpen, setToolbarOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<any>(null);

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
  }, [isTextSelected, selection, selectionStr]);

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
              <Paper
                sx={{
                  margin: '4px',
                }}
              >
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
                  <MenuItem
                    selected={props.index === props.parameterNameArray.length}
                    onClick={(event) => {
                      props.onHandleParameterSelect(
                        event,
                        props.parameterNameArray.length
                      );
                    }}
                    key="Add new property/input"
                  >
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Add Input</ListItemText>
                  </MenuItem>
                </MenuList>
              </Paper>
            </Fade>
          )}
        </Popper>
      </ThemeProvider>
    </Fragment>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuItemProps,
  MenuList,
  Paper,
  Popper,
  PopperProps,
  Typography,
} from '@mui/material';
import { createStyles, makeStyles } from '@mui/styles';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CachedIcon from '@mui/icons-material/Cached';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SensorsIcon from '@mui/icons-material/Sensors';
import MouseIcon from '@mui/icons-material/Mouse';
import SwipeIcon from '@mui/icons-material/Swipe';
import PPSocket from './../classes/SocketClass';
import { GESTUREMODE, CONTEXTMENU_WIDTH } from '../utils/constants';

const useStyles = makeStyles((theme) =>
  createStyles({
    active: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
  })
);

type SubMenuItemProps = MenuItemProps & {
  button?: true;
  label: string;
} & Pick<PopperProps, 'placement'>;
const SubMenuItem = (props: SubMenuItemProps) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement | null>(null);

  return (
    <MenuItem
      {...props}
      ref={ref}
      className={open ? classes.active : ''}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <ListItemText>{props.label}</ListItemText>
      <Typography variant="body2" color="text.secondary">
        <ChevronRightIcon fontSize="medium" />
      </Typography>
      <Popper
        anchorEl={ref.current}
        open={open}
        placement={props.placement ?? 'right'}
        modifiers={[
          {
            name: 'flip',
            enabled: true,
          },
          {
            name: 'preventOverflow',
            enabled: true,
            options: {
              boundariesElement: 'viewport',
            },
          },
        ]}
      >
        <Paper
          elevation={3}
          sx={{
            width: 240,
            maxWidth: '100%',
            zIndex: 500,
          }}
        >
          <MenuList dense>{props.children}</MenuList>
        </Paper>
      </Popper>
    </MenuItem>
  );
};

export const GraphContextMenu = (props) => {
  useEffect(() => {
    window.addEventListener('contextmenu', handleContextMenu);
  });

  useEffect(() => {
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  function handleContextMenu(e: Event) {
    e.preventDefault();
  }

  return (
    <Paper
      sx={{
        width: CONTEXTMENU_WIDTH,
        maxWidth: '100%',
        position: 'absolute',
        zIndex: 400,
        left: props.contextMenuPosition[0],
        top: props.contextMenuPosition[1],
      }}
    >
      <MenuList dense>
        <MenuItem disabled>Playground</MenuItem>
        <MenuItem
          onClick={() => {
            props.setIsGraphSearchOpen(true);
          }}
        >
          <ListItemIcon>
            <SearchIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open playground</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+O`}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            props.uploadGraph();
          }}
        >
          <ListItemIcon>
            <UploadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Load from file</ListItemText>
        </MenuItem>
        <MenuItem
          sx={{ mt: 1 }}
          onClick={() => {
            props.setShowEdit(true);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit details</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+E`}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            props.saveGraph();
          }}
        >
          <ListItemIcon>
            <SaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+S`}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            props.saveNewGraph();
          }}
        >
          <ListItemIcon>
            <SaveAsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save as new</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+Shift+S`}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            props.downloadGraph();
          }}
        >
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+Shift+S`}
          </Typography>
        </MenuItem>
        <MenuItem
          sx={{ mt: 1 }}
          onClick={() => {
            props.currentGraph.current.clear();
          }}
        >
          <ListItemIcon>
            <ClearIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clear</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem disabled>Nodes</MenuItem>
        <MenuItem
          onClick={() => {
            props.openNodeSearch();
          }}
        >
          <ListItemIcon>
            <SearchIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Find node</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+F`}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem disabled>Viewport</MenuItem>
        <MenuItem
          onClick={() => {
            props.zoomToFitSelection(true);
          }}
        >
          <ListItemIcon>
            <ZoomOutMapIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Zoom to fit all</ListItemText>
          <Typography variant="body2" color="text.secondary">
            Shift+1
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem disabled>Settings</MenuItem>
        <SubMenuItem autoFocus={false} label="Gesture mode">
          <MenuItem
            onClick={() => {
              props.applyGestureMode(
                props.currentGraph.current.viewport,
                GESTUREMODE.MOUSE
              );
            }}
          >
            <ListItemIcon>
              <MouseIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{GESTUREMODE.MOUSE}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              props.applyGestureMode(
                props.currentGraph.current.viewport,
                GESTUREMODE.TRACKPAD
              );
            }}
          >
            <ListItemIcon>
              <SwipeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{GESTUREMODE.TRACKPAD}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              props.applyGestureMode(
                props.currentGraph.current.viewport,
                GESTUREMODE.AUTO
              );
            }}
          >
            <ListItemIcon>
              <SensorsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{GESTUREMODE.AUTO}</ListItemText>
          </MenuItem>
        </SubMenuItem>
        <MenuItem
          onClick={() => {
            props.currentGraph.current.showExecutionVisualisation =
              !props.currentGraph.current.showExecutionVisualisation;
          }}
        >
          <ListItemText>
            {props.currentGraph.current.showExecutionVisualisation
              ? 'Hide execution visualisation'
              : 'Show execution visualisation'}
          </ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+Shift+X`}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            props.setShowComments((prevState) => !prevState);
          }}
        >
          <ListItemText>
            {props.showComments ? 'Hide debug output' : 'Show debug output'}
          </ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+Shift+Y`}
          </Typography>
        </MenuItem>
      </MenuList>
    </Paper>
  );
};

export const NodeContextMenu = (props) => {
  useEffect(() => {
    window.addEventListener('contextmenu', handleContextMenu);
  });

  useEffect(() => {
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  function handleContextMenu(e: Event) {
    e.preventDefault();
  }

  const canAddInput: boolean = props.currentGraph.current.getCanAddInput();
  const canAddOutput: boolean = props.currentGraph.current.getCanAddOutput();
  return (
    <Paper
      sx={{
        width: CONTEXTMENU_WIDTH,
        maxWidth: '100%',
        position: 'absolute',
        zIndex: 400,
        left: props.contextMenuPosition[0],
        top: props.contextMenuPosition[1],
      }}
    >
      <MenuList dense>
        <MenuItem
          onClick={() => {
            props.zoomToFitSelection();
          }}
        >
          <ListItemIcon>
            <FitScreenIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Zoom to fit</ListItemText>
          <Typography variant="body2" color="text.secondary">
            Shift+2
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            props.currentGraph.current.duplicateSelection();
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+D`}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            props.openNodeSearch();
          }}
        >
          <ListItemIcon>
            <CachedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Replace with ...</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            props.currentGraph.current.action_DeleteSelectedNodes();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
          <Typography variant="body2" color="text.secondary">
            Delete
          </Typography>
        </MenuItem>
        <Divider />
        {canAddInput && (
          <MenuItem
            onClick={() => {
              props.currentGraph.current.addInput();
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Input</ListItemText>
          </MenuItem>
        )}
        {canAddOutput && (
          <MenuItem
            onClick={() => {
              props.currentGraph.current.addOutput();
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Output</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            props.currentGraph.current.addTriggerInput();
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Trigger Input</ListItemText>
        </MenuItem>
      </MenuList>
    </Paper>
  );
};

export const SocketContextMenu = (props) => {
  useEffect(() => {
    window.addEventListener('contextmenu', handleContextMenu);
  });

  useEffect(() => {
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  function handleContextMenu(e: Event) {
    e.preventDefault();
  }

  const selectedSocket: PPSocket = props.selectedSocket;
  const isDeletable = !selectedSocket
    .getNode()
    .hasSocketNameInDefaultIO(selectedSocket.name, selectedSocket.socketType);

  return (
    <Paper
      sx={{
        width: 240,
        maxWidth: '100%',
        position: 'absolute',
        zIndex: 400,
        left: props.contextMenuPosition[0],
        top: props.contextMenuPosition[1],
      }}
    >
      <MenuList dense>
        {selectedSocket.isInput() && (
          <MenuItem
            onClick={() => {
              props.currentGraph.current.addWidgetNode(selectedSocket);
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Connect widget node</ListItemText>
          </MenuItem>
        )}
        {!selectedSocket.isInput() && (
          <MenuItem
            onClick={() => {
              props.currentGraph.current.addWidgetNode(selectedSocket);
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Connect label node</ListItemText>
          </MenuItem>
        )}
        {isDeletable && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                selectedSocket.destroy();
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Socket</ListItemText>
            </MenuItem>
          </>
        )}
      </MenuList>
    </Paper>
  );
};

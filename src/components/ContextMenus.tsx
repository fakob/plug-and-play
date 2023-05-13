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
import TuneIcon from '@mui/icons-material/Tune';
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
import PPGraph from '../classes/GraphClass';
import PPStorage from '../PPStorage';

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
        <MenuItem onClick={() => PPStorage.getInstance().saveGraph()}>
          <ListItemIcon>
            <SaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+S`}
          </Typography>
        </MenuItem>
        <MenuItem onClick={() => PPStorage.getInstance().saveNewGraph()}>
          <ListItemIcon>
            <SaveAsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save as new</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+Shift+S`}
          </Typography>
        </MenuItem>
        <MenuItem onClick={() => PPStorage.getInstance().downloadGraph()}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem
          sx={{ mt: 1 }}
          onClick={() => {
            PPGraph.currentGraph.clear();
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
        <MenuItem
          onClick={() => {
            props.setShowRightSideDrawer();
          }}
        >
          <ListItemIcon>
            <TuneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Toggle node inspector</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+\\`}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem disabled>Viewport</MenuItem>
        <MenuItem
          onClick={() => {
            props.zoomToFitNodes();
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
              PPStorage.getInstance().applyGestureMode(
                PPGraph.currentGraph.viewport,
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
              PPStorage.getInstance().applyGestureMode(
                PPGraph.currentGraph.viewport,
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
              PPStorage.getInstance().applyGestureMode(
                PPGraph.currentGraph.viewport,
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
            PPGraph.currentGraph.showExecutionVisualisation =
              !PPGraph.currentGraph.showExecutionVisualisation;
          }}
        >
          <ListItemText>
            {PPGraph.currentGraph.showExecutionVisualisation
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
        <MenuItem
          onClick={() => {
            PPGraph.currentGraph.showNonPresentationNodes =
              !PPGraph.currentGraph.showNonPresentationNodes;
          }}
        >
          <ListItemText>
            {PPGraph.currentGraph.showNonPresentationNodes
              ? 'Hide non-presentation nodes'
              : 'Show non-presentation nodes'}
          </ListItemText>
        </MenuItem>
      </MenuList>
    </Paper>
  );
};

function constructListOptions(options: any): any {
  return Object.keys(options).map((key) => {
    return (
      <div key={key}>
        {' '}
        <MenuItem onClick={options[key]}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{key}</ListItemText>
        </MenuItem>
      </div>
    );
  });
}

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

  const canAddOutput: boolean = PPGraph.currentGraph?.getCanAddOutput();
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
            props.zoomToFitNodes(PPGraph.currentGraph.selection.selectedNodes);
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
        <MenuItem
          onClick={() => {
            props.setShowRightSideDrawer();
          }}
        >
          <ListItemIcon>
            <TuneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Toggle node inspector</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`${props.controlOrMetaKey}+\\`}
          </Typography>
        </MenuItem>
        <Divider />
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
            PPGraph.currentGraph.duplicateSelection();
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
            PPGraph.currentGraph.action_DeleteSelectedNodes();
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
        {canAddOutput && (
          <MenuItem
            onClick={() => {
              PPGraph.currentGraph.addOutput();
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
            PPGraph.currentGraph.addTriggerInput();
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Trigger Input</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            PPGraph.currentGraph.extractToMacro();
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Extract to Macro</ListItemText>
        </MenuItem>
        {PPGraph.currentGraph &&
        PPGraph.currentGraph.selection.selectedNodes.length > 0
          ? constructListOptions(
              PPGraph.currentGraph.selection.selectedNodes[0].getAdditionalRightClickOptions()
            )
          : ''}
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
        {selectedSocket.hasLink() && (
          <>
            <MenuItem
              onClick={() => {
                selectedSocket.links.forEach((link) =>
                  PPGraph.currentGraph.action_Disconnect(link)
                );
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Remove connection</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
        {selectedSocket.isInput() && (
          <MenuItem
            onClick={() => {
              PPGraph.currentGraph.addWidgetNode(selectedSocket);
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              Connect {selectedSocket.dataType.recommendedInputNodeWidgets()[0]}
            </ListItemText>
          </MenuItem>
        )}
        {!selectedSocket.isInput() && (
          <MenuItem
            onClick={() => {
              PPGraph.currentGraph.addWidgetNode(selectedSocket);
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              Connect{' '}
              {selectedSocket.dataType.recommendedOutputNodeWidgets()[0]}
            </ListItemText>
          </MenuItem>
        )}
        {isDeletable && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                selectedSocket.getNode().removeSocket(selectedSocket);
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

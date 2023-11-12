import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
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
import ShareIcon from '@mui/icons-material/Share';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PPSocket from './../classes/SocketClass';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import {
  ALIGNOPTIONS,
  ALIGNLEFT_TEXTURE,
  ALIGNCENTERHORIZONTALLY_TEXTURE,
  ALIGNRIGHT_TEXTURE,
  ALIGNTOP_TEXTURE,
  ALIGNCENTERVERTICALLY_TEXTURE,
  ALIGNBOTTOM_TEXTURE,
  CONTEXTMENU_WIDTH,
  DISTRIBUTEHORIZONTAL_TEXTURE,
  DISTRIBUTEVERTICAL_TEXTURE,
  GESTUREMODE,
  PLUGANDPLAY_ICON_WHITE,
} from '../utils/constants';
import { isPhone } from '../utils/utils';
import styles from '../utils/style.module.css';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import PPStorage from '../PPStorage';

const useStyles = makeStyles((theme) =>
  createStyles({
    active: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
  }),
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
            minWidth: 240,
            maxWidth: '100%',
            zIndex: 1230,
          }}
        >
          <MenuList dense>{props.children}</MenuList>
        </Paper>
      </Popper>
    </MenuItem>
  );
};

const GestureModeMenuItem = (props) => {
  const GestureIcon = props.icon;
  return (
    <MenuItem
      onClick={() => {
        PPStorage.getInstance().applyGestureMode(
          PPGraph.currentGraph.viewport,
          props.gestureMode,
        );
      }}
    >
      <ListItemIcon>
        <GestureIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>{props.gestureMode}</ListItemText>
      <Typography variant="body2" color="text.secondary">
        {props.details}
      </Typography>
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
      id="graph-contextmenu"
      sx={{
        width: CONTEXTMENU_WIDTH,
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 112px)',
        overflow: 'auto',
        position: 'absolute',
        zIndex: 1230,
        left: props.contextMenuPosition[0],
        top: props.contextMenuPosition[1],
      }}
    >
      <MenuList dense>
        <MenuItem disabled>Playground</MenuItem>
        <MenuItem onClick={() => InterfaceController.toggleLeftSideDrawer()}>
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
            InterfaceController.setShowGraphEdit(true);
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
        <MenuItem onClick={() => PPStorage.getInstance().saveGraphAction()}>
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
        <MenuItem onClick={() => props.setShowSharePlayground(true)}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        {props.isLoggedIn && (
          <MenuItem
            onClick={() => {
              const currentUrl = window.location.href;
              window.location.href = `/logout?redirectUrl=${currentUrl}`;
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        )}
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
        <MenuItem disabled>Menus</MenuItem>
        <MenuItem
          onClick={() => {
            InterfaceController.openNodeSearch();
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
            InterfaceController.toggleLeftSideDrawer();
          }}
        >
          <ListItemIcon>
            <img
              id="plugandplayground-logo"
              style={{
                width: '20px',
              }}
              src={PLUGANDPLAY_ICON_WHITE}
            />
          </ListItemIcon>
          <ListItemText>Toggle playgrounds</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`1`}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            InterfaceController.toggleShowDashboard();
          }}
        >
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Toggle dashboard</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`2`}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            InterfaceController.toggleRightSideDrawer();
          }}
        >
          <ListItemIcon>
            <TuneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Toggle inspector</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {`3`}
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
        {isPhone() ? (
          [
            <Divider
              key="Gesture mode "
              variant="inset"
              sx={{
                fontSize: '0.7rem',
                color: 'text.disabled',
              }}
            >
              Gesture mode
            </Divider>,
            gestureModes(),
            <Divider key="Gesture mode - end" variant="inset" />,
          ]
        ) : (
          <SubMenuItem autoFocus={false} label="Gesture mode">
            {gestureModes()}
          </SubMenuItem>
        )}
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
      </MenuList>
    </Paper>
  );
};

function gestureModes(): any {
  return [
    <GestureModeMenuItem
      icon={MouseIcon}
      key={GESTUREMODE.MOUSE}
      gestureMode={GESTUREMODE.MOUSE}
      details="Scroll to zoom, right click to pan"
    />,
    <GestureModeMenuItem
      icon={SwipeIcon}
      key={GESTUREMODE.TRACKPAD}
      gestureMode={GESTUREMODE.TRACKPAD}
      details="Pinch to zoom, 2 finger to pan"
    />,
    <GestureModeMenuItem
      icon={SensorsIcon}
      key={GESTUREMODE.AUTO}
      gestureMode={GESTUREMODE.AUTO}
    />,
  ];
}

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

function alignOptions(): any {
  return [
    <AlignOptionMenuItem
      image={ALIGNLEFT_TEXTURE}
      key={ALIGNOPTIONS.ALIGN_LEFT}
      alignOption={ALIGNOPTIONS.ALIGN_LEFT}
    />,
    <AlignOptionMenuItem
      image={ALIGNCENTERHORIZONTALLY_TEXTURE}
      key={ALIGNOPTIONS.ALIGN_CENTER_HORIZONTAL}
      alignOption={ALIGNOPTIONS.ALIGN_CENTER_HORIZONTAL}
    />,
    <AlignOptionMenuItem
      image={ALIGNRIGHT_TEXTURE}
      key={ALIGNOPTIONS.ALIGN_RIGHT}
      alignOption={ALIGNOPTIONS.ALIGN_RIGHT}
    />,
    <AlignOptionMenuItem
      image={ALIGNTOP_TEXTURE}
      key={ALIGNOPTIONS.ALIGN_TOP}
      alignOption={ALIGNOPTIONS.ALIGN_TOP}
    />,
    <AlignOptionMenuItem
      image={ALIGNCENTERVERTICALLY_TEXTURE}
      key={ALIGNOPTIONS.ALIGN_CENTER_VERTICAL}
      alignOption={ALIGNOPTIONS.ALIGN_CENTER_VERTICAL}
    />,
    <AlignOptionMenuItem
      image={ALIGNBOTTOM_TEXTURE}
      key={ALIGNOPTIONS.ALIGN_BOTTOM}
      alignOption={ALIGNOPTIONS.ALIGN_BOTTOM}
    />,
    <AlignOptionMenuItem
      image={DISTRIBUTEVERTICAL_TEXTURE}
      key={ALIGNOPTIONS.DISTRIBUTE_VERTICAL}
      alignOption={ALIGNOPTIONS.DISTRIBUTE_VERTICAL}
    />,
    <AlignOptionMenuItem
      image={DISTRIBUTEHORIZONTAL_TEXTURE}
      key={ALIGNOPTIONS.DISTRIBUTE_HORIZONTAL}
      alignOption={ALIGNOPTIONS.DISTRIBUTE_HORIZONTAL}
    />,
  ];
}

const AlignOptionMenuItem = (props) => {
  return (
    <MenuItem
      onClick={() => {
        PPGraph.currentGraph.selection.action_alignNodes(props.alignOption);
      }}
    >
      <img className={styles.imageMenuIcon} src={props.image} />
      <ListItemText>{props.alignOption}</ListItemText>
    </MenuItem>
  );
};

export const NodeContextMenu = (props) => {
  const [selectionCount, setSelectionCount] = useState(
    PPGraph.currentGraph.selection.selectedNodes.length,
  );
  useEffect(() => {
    window.addEventListener('contextmenu', handleContextMenu);
  });

  useEffect(() => {
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    setSelectionCount(PPGraph.currentGraph.selection.selectedNodes.length);
  }, [PPGraph.currentGraph.selection.selectedNodes.length]);

  function handleContextMenu(e: Event) {
    e.preventDefault();
  }

  return (
    <Paper
      id="node-contextmenu"
      sx={{
        width: CONTEXTMENU_WIDTH,
        maxWidth: '100%',
        position: 'absolute',
        zIndex: 1230,
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
            InterfaceController.toggleRightSideDrawer();
          }}
        >
          <ListItemIcon>
            <TuneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Toggle inspector</ListItemText>
          <Typography variant="body2" color="text.secondary">
            3
          </Typography>
        </MenuItem>
        <Divider />
        {selectionCount === 1 && (
          <MenuItem
            onClick={() => {
              InterfaceController.openNodeSearch();
            }}
          >
            <ListItemIcon>
              <CachedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Replace with ...</ListItemText>
          </MenuItem>
        )}
        {selectionCount > 1 &&
          (isPhone() ? (
            [
              <Divider
                key="Align nodes "
                variant="inset"
                sx={{
                  fontSize: '0.7rem',
                  color: 'text.disabled',
                }}
              >
                Align nodes
              </Divider>,
              alignOptions(),
              <Divider key="Align nodes - end" variant="inset" />,
            ]
          ) : (
            <SubMenuItem autoFocus={false} label="Align nodes">
              {alignOptions()}
            </SubMenuItem>
          ))}
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
        {selectionCount > 1 && (
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
        )}
        {PPGraph.currentGraph && selectionCount > 0
          ? constructListOptions(
              PPGraph.currentGraph.selection.selectedNodes[0].getAdditionalRightClickOptions(),
            )
          : ''}
      </MenuList>
    </Paper>
  );
};

function constructRecommendedNodeOptions(selectedSocket: PPSocket): any {
  const preferredNodes = selectedSocket.getPreferredNodes();
  return preferredNodes.map((preferredNodesType) => {
    return (
      <MenuItem
        key={preferredNodesType}
        onClick={() => {
          PPGraph.currentGraph.action_addWidgetNode(
            selectedSocket,
            preferredNodesType,
          );
        }}
      >
        <ListItemIcon>
          <AddIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <Box
            component="span"
            sx={{
              display: 'inline',
              color: 'text.secondary',
              typography: 'body2',
            }}
          >
            Connect{' '}
          </Box>
          {preferredNodesType}
        </ListItemText>
      </MenuItem>
    );
  });
}

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
  const node: PPNode = selectedSocket.getNode();
  const isDeletable = !node.hasSocketNameInDefaultIO(
    selectedSocket.name,
    selectedSocket.socketType,
  );

  return (
    <Paper
      id="socket-contextmenu"
      sx={{
        minWidth: 240,
        maxWidth: '100%',
        position: 'absolute',
        zIndex: 1230,
        left: props.contextMenuPosition[0],
        top: props.contextMenuPosition[1],
      }}
    >
      <MenuList dense>
        <MenuItem
          onClick={() => {
            InterfaceController.onAddToDashboard(selectedSocket);
          }}
        >
          <ListItemIcon>
            <DashboardCustomizeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add to dashboard</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            PPGraph.currentGraph.selection.selectNodes(
              [selectedSocket.getNode()],
              false,
              true,
            );
            PPGraph.currentGraph.socketToInspect = selectedSocket;
            InterfaceController.notifyListeners(
              ListenEvent.ToggleInspectorWithFocus,
              {
                socket: PPGraph.currentGraph.socketToInspect,
              },
            );
          }}
        >
          <ListItemIcon>
            <TuneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Show node inspector</ListItemText>
        </MenuItem>
        <Divider />
        {selectedSocket.hasLink() && (
          <>
            <MenuItem
              onClick={() => {
                selectedSocket.links.forEach((link) =>
                  PPGraph.currentGraph.action_Disconnect(link),
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
        {constructRecommendedNodeOptions(selectedSocket)}
        {isDeletable && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                node.removeSocket(selectedSocket);
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

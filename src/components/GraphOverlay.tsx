import React, { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import GraphOverlayDrawer from './GraphOverlayDrawer';
import GraphOverlayDashboard from './GraphOverlayDashboard';
import { useIsSmallScreen } from '../utils/utils';
import {
  CONTEXTMENU_WIDTH,
  CONTEXTMENU_GRAPH_HEIGHT,
  PLUGANDPLAY_ICON,
} from '../utils/constants';

function PlaygroundButtonGroup(props) {
  const smallScreen = useIsSmallScreen();

  const posX = smallScreen ? 8 : window.innerWidth / 2 - CONTEXTMENU_WIDTH / 2;
  const posY = smallScreen
    ? 8
    : window.innerHeight - CONTEXTMENU_GRAPH_HEIGHT - 88;

  return (
    <Box
      id="playground-button-group"
      sx={{
        position: 'fixed',
        bottom: '12px',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '1300',
      }}
    >
      <Button
        size="small"
        title="Toggle playground menu"
        onClick={(event) => {
          event.stopPropagation();
          props.setContextMenuPosition([posX, posY]);
          props.setIsGraphContextMenuOpen((isOpen) => !isOpen);
          if (smallScreen) {
            InterfaceController.toggleLeftSideDrawer(false);
            InterfaceController.toggleRightSideDrawer(false);
          }
        }}
        sx={{
          width: '28px',
          height: '28px',
        }}
      >
        <img
          id="plugandplayground-logo"
          style={{
            backgroundColor: props.randomMainColor,
            borderRadius: '32px',
            width: '56px',
          }}
          src={PLUGANDPLAY_ICON}
        />
      </Button>
    </Box>
  );
}

type GraphOverlayProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
  toggle: boolean;
  toggleLeft: boolean;
  setContextMenuPosition: React.Dispatch<React.SetStateAction<number[]>>;
  setIsGraphContextMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const GraphOverlay: React.FunctionComponent<GraphOverlayProps> = (props) => {
  const [selectedNodes, setSelectedNodes] = useState<PPNode[]>([]);

  useEffect(() => {
    // register callbacks when currentGraph mounted
    const ids = [];
    ids.push(
      InterfaceController.addListener(
        ListenEvent.SelectionChanged,
        setSelectedNodes,
      ),
    );

    return () => {
      ids.forEach((id) => InterfaceController.removeListener(id));
    };
  }, []);

  return (
    <>
      <PlaygroundButtonGroup
        setContextMenuPosition={props.setContextMenuPosition}
        setIsGraphContextMenuOpen={props.setIsGraphContextMenuOpen}
        randomMainColor={props.randomMainColor}
      />
      <GraphOverlayDrawer
        toggle={props.toggle}
        toggleLeft={props.toggleLeft}
        selectedNodes={selectedNodes}
        randomMainColor={props.randomMainColor}
      />
      <GraphOverlayDashboard
        randomMainColor={props.randomMainColor}
        toggleLeft={props.toggleLeft}
      />
    </>
  );
};

export default GraphOverlay;

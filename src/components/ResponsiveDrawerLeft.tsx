import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Drawer, Paper, Stack } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TuneIcon from '@mui/icons-material/Tune';
import Color from 'color';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import Socket from '../classes/SocketClass';
import InspectorContainer from '../InspectorContainer';
import { COLOR_DARK, COLOR_WHITE_TEXT } from '../utils/constants';
import { useIsSmallScreen } from '../utils/utils';
import styles from '../utils/style.module.css';

export function DrawerToggle(props) {
  return (
    <Box>
      <Button
        title={`${props.posLeft ? 'Close inspector' : 'Open inspector'}`}
        size="small"
        onClick={props.handleDrawerToggle}
        color="primary"
        sx={{
          position: 'absolute',
          top: '40px',
          left: `${props.posLeft ? '-32px' : 'auto'}`,
          right: `${props.posLeft ? 'auto' : '32px'}`,
          width: '32px',
          minWidth: '32px',
          background: `${
            props.areNodesSelected
              ? Color(props.randomMainColor).alpha(0.2)
              : 'unset'
          }`,
        }}
      >
        {props.posLeft ? (
          <ChevronRightIcon />
        ) : (
          props.areNodesSelected && <TuneIcon />
        )}
      </Button>
    </Box>
  );
}

const ResponsiveDrawer = (props) => {
  // leaving this commented here for potential future testing
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState(null);
  const [socketToInspect, setSocketToInspect] = useState<Socket | undefined>(
    undefined,
  );
  const smallScreen = useIsSmallScreen();

  const toggleInspectorAndFocus = ({ filter, socket, open }) => {
    if (open !== undefined) {
      setOpen(open);
    } else {
      handleDrawerToggle();
    }
    if (filter) {
      setFilter(filter);
      setSocketToInspect(undefined);
    } else if (socket) {
      setSocketToInspect(socket);
    }
  };

  useEffect(() => {
    // register callbacks when currentGraph mounted
    const ids = [];
    ids.push(
      InterfaceController.addListener(
        ListenEvent.ToggleInspectorWithFocus,
        toggleInspectorAndFocus,
      ),
    );

    return () => {
      ids.forEach((id) => InterfaceController.removeListener(id));
    };
  }, []);

  const handleDrawerToggle = () => {
    setOpen((prevState) => !prevState);
  };

  const handleMouseDown = (e) => {
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointermove', handlePointerMove, true);
  };

  const handlePointerUp = () => {
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('pointermove', handlePointerMove, true);
  };

  const handlePointerMove = useCallback((e) => {
    const minDrawerWidth = 50;
    const maxDrawerWidth = window.innerWidth - 100;
    const newWidth =
      document.body.offsetLeft + document.body.offsetWidth - e.clientX + 20;

    if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) {
      props.setDrawerWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    handleDrawerToggle();
  }, [props.toggle]);

  return (
    <>
      {!open && (
        <DrawerToggle
          areNodesSelected={props.selectedNodes?.length > 0}
          randomMainColor={props.randomMainColor}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}
      <Drawer
        anchor="left"
        variant="persistent"
        hideBackdrop
        open={open}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          elevation: 8,
          style: {
            width: smallScreen ? '100%' : props.drawerWidth,
            border: 0,
            background: `${Color(props.randomMainColor).alpha(0.8)}`,
            overflowY: 'unset',
            height: '100vh',
          },
        }}
      >
        <div
          onMouseDown={(e) => handleMouseDown(e)}
          className={styles.dragger}
        ></div>
        <DrawerToggle
          posLeft={true}
          randomMainColor={props.randomMainColor}
          handleDrawerToggle={handleDrawerToggle}
        />

        <Paper
          component={Stack}
          direction="column"
          justifyContent="center"
          sx={{ height: '100%', background: 'unset' }}
        >
          <Box
            sx={{
              height: 'inherit',
              overflow: 'auto',
              p: 1,
              color: Color(props.randomMainColor).isDark()
                ? COLOR_WHITE_TEXT
                : COLOR_DARK,
            }}
          >
            <h1>Welcome to Plug and Playground</h1>
            <p>
              Your visual toolkit for creative prototyping, to explore,
              transform or visualise data.
            </p>
            <h2>What data can be used?</h2>
            <p>
              Excel (Tabular data)TextImagesAnd whatever you get from an API
            </p>
            <h2>How does it work?</h2>
            <p>
              Double click to find a nodePlug nodes togetherThey are executed
              right away
            </p>
            <p>
              There are many ready made nodes available, but you can also write
              your own logic.
            </p>
            <p>Click the buttons on the right to learn more</p>
            <h2>How do I create and connect nodes?</h2>
            <h3>Search for nodes</h3>
            <p>To open the node search:</p>
            <ul>
              <li>double click the canvas</li>
              <li>press Cmd/Ctrl-F</li>
              <li>start dragging a connection and release the mouse</li>
            </ul>
            <h3>Create a connection</h3>
            <ol>
              <li>Click and drag and input/output socket</li>
              <li>Connect it to an output/input socket of another node</li>
            </ol>
            <p>
              You can also just drag the connection onto the node and release
              the mouse. This will connect to the socket which fits best.
            </p>
            <h3>Remove nodes</h3>
            <ul>
              <li>Select a node and press Delete</li>
              <li>Right click a node and click "Delete"</li>
            </ul>
            <h3>Remove a connection</h3>
            <ul>
              <li>Click and unplug the input side of a connection</li>
              <li>Right click a socket and click "Remove connection"</li>
            </ul>
            <h3>Change their update behaviour</h3>
            <p>
              By default, nodes update when one of their inputs updates. Change
              this behaviour using the node inspector on the right.
            </p>
            <h2>What nodes are available?</h2>
            <h2>How do I create my own nodes?</h2>
            <h3>Create your own node</h3>
            <ol>
              <li>Open the node search</li>
              <li>Find and add a Custom node</li>
              <li>
                Select the added node and write your own JavaScript function in
                the code field
              </li>
            </ol>
            <p>
              Tip: You can also just type a new name in the node search and
              create a custom node using the new name.
            </p>
            <h3>Write your own function</h3>
            <p>
              A function is a block of JavaScript code that gets executed. You
              can add as many inputs as you like, process them and output the
              result.&nbsp;
            </p>
            <p>Learn more about JavaScript functions</p>
            <p>Tip: To write your function in a separate code editor</p>
            <ol>
              <li>Unhide the Code input</li>
              <li>Right click the input and choose "Connect CodeEditor"</li>
            </ol>
            <h2>How do I import data?</h2>
            <ul>
              <li>Drag in excel, text, image, video or database files</li>
              <li>OR get data from any API</li>
            </ul>
            <h2>How do I transform data?</h2>
            <ul>
              <li>
                Select the data you need and transform it using ready made nodes
              </li>
              <li>OR create your own nodes</li>
            </ul>
            <h2>How do I visualise data?</h2>
            <ul>
              <li>Use the drawing methods and composite them together</li>
              <li>If you want to reuse logic, create a macro</li>
            </ul>
            <h2>How do I share my playgrounds?</h2>
            <p>
              We are a local first platform. To share your playgrounds online
            </p>
            <ol>
              <li>Log in to Github</li>
              <li>Store your playground as a Gist</li>
              <li>Create a shareable link</li>
            </ol>
            <p>
              Of course you can also just save the file locally and share it the
              old school way :-)
            </p>
            <h2>My playground does not work. How can I fix it?</h2>
            <ul>
              <li>Use the Console print node</li>
              <li>Use the Logger node</li>
              <li>Use the browsers devtools</li>
            </ul>
            <h2>Do you want to contribute?</h2>
            <p>
              This project is open source. Check out the project on Github and
              make a pull request.
            </p>
            <h2>Start a new playground?</h2>
          </Box>
        </Paper>
      </Drawer>
    </>
  );
};

// not neccessary to memoize this for the moment, but can be relevant later so leaving this uncommented
export default React.memo(ResponsiveDrawer, (prevProps, newProps) => {
  return (
    prevProps.selectedNodes === newProps.selectedNodes &&
    prevProps.drawerWidth === newProps.drawerWidth &&
    prevProps.toggle === newProps.toggle
  );
});

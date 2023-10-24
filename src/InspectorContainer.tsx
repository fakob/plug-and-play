import React, { useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import Color from 'color';
import styles from './utils/style.module.css';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { PropertyArrayContainer } from './PropertyArrayContainer';
import { COLOR_WHITE_TEXT, COLOR_DARK, customTheme } from './utils/constants';

function InspectorHeaderReadOnly(props) {
  return (
    <Box
      id="inspector-header-readonly"
      sx={{
        color: `${
          Color(props.randomMainColor).isDark() ? COLOR_WHITE_TEXT : COLOR_DARK
        }`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <IconButton
          title="Unselect nodes"
          color="secondary"
          size="small"
          sx={{
            color: `${
              Color(props.randomMainColor).isDark()
                ? COLOR_WHITE_TEXT
                : COLOR_DARK
            }`,
          }}
          onClick={() => {
            PPGraph.currentGraph.selection.deselectAllNodes();
          }}
        >
          <ArrowBackIcon fontSize="inherit" />
        </IconButton>
        <Typography
          sx={{
            pl: 1,
            py: 0.5,
          }}
        >
          {`${props.selectedNodes.length} nodes selected`}
        </Typography>
      </Box>
    </Box>
  );
}

function InspectorHeader(props) {
  const textInput = useRef(null);

  return (
    <Box
      id="inspector-header"
      sx={{
        color: `${
          Color(props.randomMainColor).isDark() ? COLOR_WHITE_TEXT : COLOR_DARK
        }`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <IconButton
          title="Unselect nodes"
          color="secondary"
          size="small"
          sx={{
            color: `${
              Color(props.randomMainColor).isDark()
                ? COLOR_WHITE_TEXT
                : COLOR_DARK
            }`,
          }}
          onClick={() => {
            PPGraph.currentGraph.selection.deselectAllNodes();
          }}
        >
          <ArrowBackIcon fontSize="inherit" />
        </IconButton>
        <TextField
          title={props.selectedNodes[0].id}
          hiddenLabel
          inputRef={textInput}
          disabled={props.selectedNodes.length !== 1}
          onChange={(event) => {
            const value = event.target.value;
            props.selectedNodes[0].nodeName = value;
            props.setNodeName(value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              textInput.current.blur();
            }
          }}
          value={props.nodeName}
          sx={{
            width: '100%',
            '&& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 0,
              },
              '& input': {
                color: `${
                  Color(props.randomMainColor).isDark()
                    ? COLOR_WHITE_TEXT
                    : COLOR_DARK
                }`,
                padding: '4px 8px',
              },
              '& input:hover': {
                backgroundColor: Color(props.randomMainColor).alpha(0.5).hexa(),
              },
              '& input:focus': {
                boxShadow: `0 0 0 1px ${props.randomMainColor}`,
                backgroundColor: Color(props.randomMainColor).alpha(0.5).hexa(),
              },
            },
          }}
        />
        <IconButton
          title="Edit node name"
          color="secondary"
          size="small"
          sx={{
            color: `${
              Color(props.randomMainColor).isDark()
                ? COLOR_WHITE_TEXT
                : COLOR_DARK
            }`,
          }}
          onClick={() => {
            setTimeout(() => {
              textInput.current.focus();
            }, 100);
          }}
        >
          <EditIcon fontSize="inherit" />
        </IconButton>
      </Box>
      {props.selectedNodes[0].type !== props.nodeName && (
        <Typography
          sx={{
            opacity: 0.5,
            fontSize: '10px',
            wordBreak: 'break-all',
            pl: 1,
          }}
        >
          {props.selectedNodes[0].type}
        </Typography>
      )}
    </Box>
  );
}

type InspectorContainerProps = {
  selectedNodes: PPNode[];
  socketToInspect: Socket;
  randomMainColor: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
};

const InspectorContainer: React.FunctionComponent<InspectorContainerProps> = (
  props,
) => {
  const [nodeName, setNodeName] = React.useState(
    props.selectedNodes?.[0]?.name,
  );

  useEffect(() => {
    setNodeName(props.selectedNodes?.[0]?.name);
  }, [props.selectedNodes]);

  return (
    <ThemeProvider theme={customTheme}>
      <Stack
        id="inspector-container"
        spacing={1}
        className={`${styles.inspectorContainer}`}
        sx={{
          fontFamily: "'Roboto', 'Helvetica', 'Arial', 'sans-serif'",
          height: '100%',
          paddingRight: 0,
        }}
      >
        {props.selectedNodes.length === 1 ? (
          <InspectorHeader
            nodeName={nodeName}
            setNodeName={setNodeName}
            selectedNodes={props.selectedNodes}
            randomMainColor={props.randomMainColor}
          />
        ) : (
          <InspectorHeaderReadOnly
            nodeName={nodeName}
            setNodeName={setNodeName}
            selectedNodes={props.selectedNodes}
            randomMainColor={props.randomMainColor}
          />
        )}
        <PropertyArrayContainer
          selectedNodes={props.selectedNodes}
          socketToInspect={props.socketToInspect}
          randomMainColor={props.randomMainColor}
          filter={props.filter}
          setFilter={props.setFilter}
        />
      </Stack>
    </ThemeProvider>
  );
};

export default InspectorContainer;

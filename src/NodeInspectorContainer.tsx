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

function InspectorHeader(props) {
  const [nodeName, setNodeName] = React.useState('');
  const textInput = useRef(null);
  const isEditable = props.isEditable;
  const originalName = props.selectedNodes[0].getName();

  useEffect(() => {
    setNodeName(props.selectedNodes?.[0]?.name);
  }, [props.selectedNodes]);

  return (
    <Box
      id={isEditable ? 'inspector-header' : 'inspector-header-readonly'}
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
        {props.isEditable ? (
          <>
            <TextField
              title={props.selectedNodes[0].id}
              hiddenLabel
              inputRef={textInput}
              disabled={props.selectedNodes.length !== 1}
              onChange={(event) => {
                const value = event.target.value;
                props.selectedNodes[0].setNodeName(value);
                setNodeName(value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  textInput.current.blur();
                }
              }}
              value={nodeName}
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
                    backgroundColor: Color(props.randomMainColor)
                      .alpha(0.5)
                      .hexa(),
                  },
                  '& input:focus': {
                    boxShadow: `0 0 0 1px ${props.randomMainColor}`,
                    backgroundColor: Color(props.randomMainColor)
                      .alpha(0.5)
                      .hexa(),
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
          </>
        ) : (
          <Typography
            sx={{
              pl: 1,
              py: 0.5,
              width: '100%',
            }}
          >
            {`${props.selectedNodes.length} nodes selected`}
          </Typography>
        )}
      </Box>
      {props.isEditable && (
        <Typography
          sx={{
            opacity: 0.5,
            fontSize: '10px',
            wordBreak: 'break-all',
            pl: 1,
          }}
        >
          {originalName}
        </Typography>
      )}
    </Box>
  );
}

type InspectorContainerProps = {
  selectedNodes: PPNode[];
  socketToInspect: Socket;
  setSocketToInspect: React.Dispatch<React.SetStateAction<Socket>>;
  randomMainColor: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
};

const NodeInspectorContainer: React.FunctionComponent<
  InspectorContainerProps
> = (props) => {
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
        {false && (
          <InspectorHeader
            isEditable={props.selectedNodes.length === 1}
            selectedNodes={props.selectedNodes}
            randomMainColor={props.randomMainColor}
          />
        )}
        <PropertyArrayContainer
          selectedNodes={props.selectedNodes}
          socketToInspect={props.socketToInspect}
          setSocketToInspect={props.setSocketToInspect}
          randomMainColor={props.randomMainColor}
          filter={props.filter}
          setFilter={props.setFilter}
        />
      </Stack>
    </ThemeProvider>
  );
};

export default NodeInspectorContainer;

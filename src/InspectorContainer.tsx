import React, { useEffect } from 'react';
import { Box, Stack, TextField, ThemeProvider } from '@mui/material';
import Color from 'color';
import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import { PropertyArrayContainer } from './PropertyArrayContainer';
import { COLOR_WHITE_TEXT, COLOR_DARK, customTheme } from './utils/constants';

function InspectorHeader(props) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <TextField
        hiddenLabel
        disabled={props.selectedNodes.length !== 1}
        onChange={(event) => {
          const value = event.target.value;
          props.selectedNodes[0].nodeName = value;
          props.setNodeName(value);
        }}
        value={
          props.selectedNodes.length === 1
            ? props.nodeName
            : `${props.selectedNodes.length} nodes`
        }
        sx={{
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
              padding: '12px 8px',
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
    </Box>
  );
}

type InspectorContainerProps = {
  selectedNodes: PPNode[];
  randomMainColor: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
};

const InspectorContainer: React.FunctionComponent<InspectorContainerProps> = (
  props
) => {
  const [nodeName, setNodeName] = React.useState(
    props.selectedNodes?.[0]?.name
  );

  return (
    <ThemeProvider theme={customTheme}>
      <Stack
        spacing={1}
        className={`${styles.inspectorContainer}`}
        sx={{
          fontFamily: "'Roboto', 'Helvetica', 'Arial', 'sans-serif'",
          height: '100%',
        }}
      >
        <InspectorHeader
          nodeName={nodeName}
          setNodeName={setNodeName}
          selectedNodes={props.selectedNodes}
          randomMainColor={props.randomMainColor}
        />
        <PropertyArrayContainer
          selectedNodes={props.selectedNodes}
          randomMainColor={props.randomMainColor}
          filter={props.filter}
          setFilter={props.setFilter}
        />
      </Stack>
    </ThemeProvider>
  );
};

export default InspectorContainer;

import React, { useEffect } from 'react';
import { Box, Stack, ThemeProvider, Typography } from '@mui/material';
import Color from 'color';
import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import { NodeArrayContainer } from './NodeArrayContainer';
import { COLOR_WHITE_TEXT, COLOR_DARK, customTheme } from './utils/constants';

function GraphInspectorHeader(props) {
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
        <Typography
          sx={{
            pl: 1,
            py: 0.5,
          }}
        >
          Graph inspector
        </Typography>
      </Box>
    </Box>
  );
}

type InspectorContainerProps = {
  selectedNodes: PPNode[];
  randomMainColor: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  filterText: string;
  setFilterText: React.Dispatch<React.SetStateAction<string>>;
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
        <GraphInspectorHeader
          nodeName={nodeName}
          setNodeName={setNodeName}
          selectedNodes={props.selectedNodes}
          randomMainColor={props.randomMainColor}
        />
        <NodeArrayContainer
          selectedNodes={props.selectedNodes}
          randomMainColor={props.randomMainColor}
          filter={props.filter}
          setFilter={props.setFilter}
          filterText={props.filterText}
          setFilterText={props.setFilterText}
        />
      </Stack>
    </ThemeProvider>
  );
};

export default InspectorContainer;

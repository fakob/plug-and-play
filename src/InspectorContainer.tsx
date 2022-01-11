import React from 'react';
// import MonacoEditor from 'react-monaco-editor';
import Color from 'color';
import { Box, Stack, ThemeProvider, createTheme } from '@mui/material';

import { theme, darkThemeOverride } from './utils/customTheme';
import styles from './utils/style.module.css';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import { PropertyArrayContainer } from './PropertyArrayContainer';

type MyProps = {
  currentGraph: PPGraph;
  selectedNode: PPNode;
  isCustomNode: boolean;
  onSave?: (code: string) => void;
  randomMainColor: string;
  isMac: boolean;
};

const ReactContainer: React.FunctionComponent<MyProps> = (props) => {
  return (
    <ThemeProvider
      theme={createTheme(darkThemeOverride, {
        palette: {
          primary: { main: props.randomMainColor },
          secondary: { main: `${Color(props.randomMainColor).lighten(0.85)}` },
          background: {
            default: `${Color(props.randomMainColor).darken(0.85)}`,
            paper: `${Color(props.randomMainColor).darken(0.1)}`,
          },
        },
      })}
    >
      <Stack
        spacing={1}
        className={`${styles.inspectorContainer}`}
        sx={{
          background: `${Color(props.randomMainColor).alpha(0.8)}`,
          fontFamily: "'Roboto', 'Helvetica', 'Arial', 'sans-serif'",
          height: '100%',
        }}
        id="editorwrapper"
        key={props?.selectedNode?.id}
      >
        <Box
          sx={{
            pt: '8px',
            px: '8px',
            color: 'text.primary',
            fontWeight: 'medium',
          }}
        >
          {props.selectedNode?.name}
        </Box>
        <PropertyArrayContainer
          currentGraph={props.currentGraph}
          selectedNode={props.selectedNode}
          isCustomNode={props.isCustomNode}
          onSave={props.onSave}
          randomMainColor={props.randomMainColor}
          inputSocketArray={props.selectedNode?.inputSocketArray}
          outputSocketArray={props.selectedNode?.outputSocketArray}
          isMac={props.isMac}
        />
      </Stack>
    </ThemeProvider>
  );
};

export default ReactContainer;

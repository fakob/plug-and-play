import React from 'react';
import { Box, Stack, ThemeProvider } from '@mui/material';
import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import { PropertyArrayContainer } from './PropertyArrayContainer';
import { customTheme } from './utils/constants';

type MyProps = {
  selectedNode: PPNode;
  randomMainColor: string;
};

const InspectorContainer: React.FunctionComponent<MyProps> = (props) => {
  return (
    <ThemeProvider theme={customTheme}>
      <Stack
        spacing={1}
        className={`${styles.inspectorContainer}`}
        sx={{
          fontFamily: "'Roboto', 'Helvetica', 'Arial', 'sans-serif'",
          height: '100%',
        }}
        id="editorwrapper"
        key={props?.selectedNode?.id}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              pt: '8px',
              px: '8px',
              color: 'text.primary',
              fontWeight: 'medium',
              flexGrow: 1,
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title={props.selectedNode?.id}
          >
            {props.selectedNode?.name}
          </Box>
        </Box>
        <PropertyArrayContainer
          selectedNode={props.selectedNode}
          randomMainColor={props.randomMainColor}
        />
      </Stack>
    </ThemeProvider>
  );
};

export default InspectorContainer;

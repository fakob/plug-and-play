import React from 'react';
import {
  Box,
  Icon,
  Stack,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import styles from './utils/style.module.css';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import { PropertyArrayContainer } from './PropertyArrayContainer';
import {
  DRAWER30_ICON,
  DRAWER60_ICON,
  DRAWER90_ICON,
  customTheme,
} from './utils/constants';

type MyProps = {
  currentGraph: PPGraph;
  selectedNode: PPNode;
  randomMainColor: string;
  widthPercentage: number;
  setWidthPercentage: (value: number | ((prevVar: number) => number)) => void;
};

const InspectorContainer: React.FunctionComponent<MyProps> = (props) => {
  const handleWidthPercentage = (
    event: React.MouseEvent<HTMLElement>,
    newPercentage: number | null
  ) => {
    props.setWidthPercentage(newPercentage);
  };

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
            {props.selectedNode?.getName()}
          </Box>
          <ToggleButtonGroup
            value={props.widthPercentage}
            exclusive
            onChange={handleWidthPercentage}
            size="small"
            sx={{
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
              },
            }}
          >
            <ToggleButton value="0.9">
              <Icon classes={{ root: styles.iconRoot }}>
                <img className={styles.imageIcon} src={DRAWER90_ICON} />
              </Icon>
            </ToggleButton>
            <ToggleButton value="0.6">
              <Icon classes={{ root: styles.iconRoot }}>
                <img className={styles.imageIcon} src={DRAWER60_ICON} />
              </Icon>
            </ToggleButton>
            <ToggleButton value="0.3">
              <Icon classes={{ root: styles.iconRoot }}>
                <img className={styles.imageIcon} src={DRAWER30_ICON} />
              </Icon>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <PropertyArrayContainer
          currentGraph={props.currentGraph}
          selectedNode={props.selectedNode}
          randomMainColor={props.randomMainColor}
        />
      </Stack>
    </ThemeProvider>
  );
};

export default InspectorContainer;

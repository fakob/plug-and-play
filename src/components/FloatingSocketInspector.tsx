import React, { useEffect, useState } from 'react';
import {
  Box,
  Popover,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
} from '@mui/material';
// import CodeIcon from '@mui/icons-material/Code';
// import UpdateIcon from '@mui/icons-material/Update';
// import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getCircularReplacer } from './../utils/utils';
// import PPNode from '../classes/NodeClass';
import { PropertyContainer } from '../PropertyArrayContainer';
import styles from './../utils/style.module.css';
import { theme } from './../utils/customTheme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const FloatingSocketInspector = (props) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <Popover
        open={props.socketInfoOpen}
        anchorReference="anchorPosition"
        anchorPosition={{
          left: props.socketInfoPosition?.[0],
          top: props.socketInfoPosition?.[1],
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={props.onCloseSocketInfo}
        sx={{
          pointerEvents: 'none',
          '& .MuiPopover-paper': {
            pointerEvents: 'auto',
          },
        }}
        PaperProps={{
          onMouseLeave: props.socketInfoLeave,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label="Item One" {...a11yProps(0)} />
            <Tab label="Item Two" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <Typography
            fontFamily="Roboto Mono"
            fontSize="12px"
            sx={{ p: 2, bgcolor: 'background.paper' }}
            className={`${styles.serializedNode} ${styles.scrollablePortal}`}
          >
            {JSON.stringify(props.socketInfo.data, getCircularReplacer(), 2)}
          </Typography>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <PropertyContainer
            key={0}
            property={props.socketInfo}
            index={0}
            dataType={props.socketInfo.dataType}
            isInput={true}
            hasLink={props.socketInfo.hasLink()}
            data={props.socketInfo.data}
            randomMainColor={props.randomMainColor}
          />
        </TabPanel>
      </Popover>
    </ThemeProvider>
  );
};

export default FloatingSocketInspector;

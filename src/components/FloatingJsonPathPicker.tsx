import React, { useState } from 'react';
import {
  Box,
  Button,
  Icon,
  IconButton,
  Modal,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { JsonPathPicker } from './JsonPathPicker';
import PPNode from '../classes/NodeClass';
import Socket from '../classes/SocketClass';
import {
  DRAWER60M_ICON,
  DRAWER30M_ICON,
  customTheme,
} from './../utils/constants';
import styles from './../utils/style.module.css';

type MyProps = {
  jsonSocketName: string;
  jsonPathSocketName: string;
  forceRefresh: number;
  randomMainColor: string;
  selectedNode: PPNode;
};

const FloatingJsonPathPicker: React.FunctionComponent<MyProps> = (props) => {
  const [open, setOpen] = useState(false);
  const [newWidth, setNewWidth] = useState(undefined);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const node: PPNode = props.selectedNode;
  const json =
    node?.inputSocketArray.find((socket: Socket) => {
      return socket.name === props.jsonSocketName;
    })?.data ?? '';
  const path =
    node?.inputSocketArray.find((socket: Socket) => {
      return socket.name === props.jsonPathSocketName;
    })?.data ?? '';

  const handleChoosePath = (path: string): void => {
    node.setInputData(props.jsonPathSocketName, path);
    node.executeOptimizedChain();
    handleClose();
  };

  const handleWidthPercentage = (
    event: React.MouseEvent<HTMLElement>,
    newWidth: number | null
  ) => {
    setNewWidth(newWidth);
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Button onClick={handleOpen}>Open Picker</Button>
      <Button
        href="https://jsonpath-plus.github.io/JSONPath/docs/ts/"
        target="_blank"
      >
        Help
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: newWidth ? newWidth : '0.6',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 'small',
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
              }}
            ></Box>
            <ToggleButtonGroup
              value={newWidth}
              exclusive
              onChange={handleWidthPercentage}
              size="small"
              sx={{
                '& .MuiToggleButtonGroup-grouped': {
                  border: 0,
                },
              }}
            >
              <ToggleButton value="0.6">
                <Icon classes={{ root: styles.iconRoot }}>
                  <img className={styles.imageIcon} src={DRAWER60M_ICON} />
                </Icon>
              </ToggleButton>
              <ToggleButton value="0.3">
                <Icon classes={{ root: styles.iconRoot }}>
                  <img className={styles.imageIcon} src={DRAWER30M_ICON} />
                </Icon>
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          </Box>
          <Box sx={{ overflow: 'auto', bgcolor: 'background.default' }}>
            <JsonPathPicker
              json={json}
              onChoose={handleChoosePath}
              path={path}
              randomMainColor={props.randomMainColor}
            />
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
};

export default FloatingJsonPathPicker;

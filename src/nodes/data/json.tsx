/* eslint-disable prettier/prettier */
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
import { JSONPath } from 'jsonpath-plus';
import { JsonPathPicker } from '../../components/JsonPathPicker';
import PureNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import {
  DRAWER60M_ICON,
  DRAWER30M_ICON,
  SOCKET_TYPE,
} from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import styles from '../../utils/style.module.css';
import { customTheme } from '../../utils/constants';

const JSONName = 'JSON';
const JSONParamName = 'Name 1';
const outValueName = 'Value';

function FloatingJsonPathPicker(props) {
  const [open, setOpen] = useState(false);
  const [newWidth, setNewWidth] = useState(undefined);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const node: PureNode = props.selectedNode;
  const json =
    node?.inputSocketArray.find((socket) => {
      return socket.name === props.jsonSocketName;
    })?.data ?? '';
  const path =
    node?.inputSocketArray.find((socket) => {
      return socket.name === props.jsonPathSocketName;
    })?.data ?? '';

  const handleChoosePath = (path: string): void => {
    node.setInputData(props.jsonPathSocketName, path);
    node.execute(new Set());
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
                px: '8px',
                py: '4px',
                color: 'text.primary',
                fontWeight: 'medium',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {props.inputPathArray?.[0]}
            </Box>
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
              <ToggleButton value="0.3">
                <Icon classes={{ root: styles.iconRoot }}>
                  <img className={styles.imageIcon} src={DRAWER30M_ICON} />
                </Icon>
              </ToggleButton>
              <ToggleButton value="0.6">
                <Icon classes={{ root: styles.iconRoot }}>
                  <img className={styles.imageIcon} src={DRAWER60M_ICON} />
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
}

export class JSONGet extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()),
      new Socket(
        SOCKET_TYPE.IN,
        JSONParamName,
        new StringType(),
        undefined,
        undefined,
        {
          inspectorInjection: {
            reactComponent: FloatingJsonPathPicker,
            props: {
              jsonSocketName: JSONName,
              jsonPathSocketName: JSONParamName,
              forceRefresh: Math.random(),
            },
          },
        }
      ),
      new Socket(SOCKET_TYPE.OUT, outValueName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    let current = inputObject[JSONName];
    if (current) {
      this.inputSocketArray.forEach((input) => {
        // pretty hacky
        if (input.name.includes('Name')) {
          current = JSONPath({ path: input.data, json: current, wrap: false });
        }
      });
      outputObject[outValueName] = current;
    }
  }

  public getCanAddInput(): boolean {
    return true;
  }

  public addDefaultInput(): void {
    const newName = this.constructSocketName('Name', this.inputSocketArray);
    this.addInput(newName, new StringType(), undefined, undefined, {
      inspectorInjection: {
        reactComponent: FloatingJsonPathPicker,
        props: {
          jsonSocketName: JSONName,
          jsonPathSocketName: newName,
          forceRefresh: Math.random(),
        },
      },
    });
  }
}

export class JSONKeys extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()),
      new Socket(SOCKET_TYPE.OUT, outValueName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[outValueName] = Object.keys(inputObject?.[JSONName] ?? {});
  }
}

export class JSONValues extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()),
      new Socket(SOCKET_TYPE.OUT, outValueName, new JSONType()),
    ];
  }
  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    outputObject[outValueName] = Object.values(inputObject?.[JSONName] ?? {});
  }
}

/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import Draggable from 'react-draggable';
import {
  Box,
  Icon,
  IconButton,
  Paper,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  createTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Color from 'color';
import { JsonPathPicker } from '../../components/JsonPathPicker';
import PureNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { darkThemeOverride } from '../../utils/customTheme';
import {
  DRAWER60M_ICON,
  DRAWER30M_ICON,
  SOCKET_TYPE,
} from '../../utils/constants';
import { queryJSON } from '../../utils/utils';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import { TriggerType } from '../datatypes/triggerType';
import styles from '../../utils/style.module.css';

const JSONName = 'JSON';
const JSONParamName = 'Name 1';
const outValueName = 'Value';

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-title"
      cancel={'[id=draggable-content]'}
      key={`${props.socketinfo?.parent.id}.${props.socketinfo?.name}`}
    >
      <Paper {...props} />
    </Draggable>
  );
}

function JsonPathPickerModal(props) {
  const [open, setOpen] = useState(true);
  const [newWidth, setNewWidth] = useState(undefined);

  const handleClose = () => {
    setOpen(false);
  };

  const handleChoosePath = (path: string): void => {
    props.onChoose(path);
    handleClose();
  };

  useEffect(() => {
    setOpen(true);
  }, [props.forceRefresh]);

  const handleWidthPercentage = (
    event: React.MouseEvent<HTMLElement>,
    newWidth: number | null
  ) => {
    setNewWidth(newWidth);
  };

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
      {open && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2000,
          }}
        >
          <PaperComponent
            elevation={8}
            sx={{
              width: newWidth ? newWidth : '60vw',
              height: '80vh',
              // bgcolor: 'background.default',
              boxShadow: 24,
              display: 'flex',
              flexDirection: 'column',
            }}
            socketinfo={props.socketInfo}
          >
            <Box
              id="draggable-title"
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'move',
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
              >
                {/* <IconButton size="small" onClick={copyDataToClipBoard}>
                  <ContentCopyIcon sx={{ fontSize: '16px' }} />
                </IconButton> */}
              </Box>
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
            <Box
              id="draggable-content"
              sx={{ overflow: 'auto', bgcolor: 'background.default' }}
            >
              <JsonPathPicker
                json={props.json}
                onChoose={handleChoosePath}
                path={props.path}
              />
            </Box>
          </PaperComponent>
        </Box>
      )}
    </ThemeProvider>
  );
}

export class JSONGet extends PureNode {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, JSONName, new JSONType()),
      new Socket(SOCKET_TYPE.IN, JSONParamName, new StringType()),
      new Socket(
        SOCKET_TYPE.IN,
        'OpenPathPicker',
        new TriggerType(),
        undefined,
        false
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
          current = queryJSON(current, input.data);
        }
      });
      outputObject[outValueName] = current;
    }
  }

  public getCanAddInput(): boolean {
    return true;
  }

  public addDefaultInput(): void {
    this.addInput(
      this.constructSocketName('Name', this.inputSocketArray),
      new StringType()
    );
  }

  trigger(): void {
    const json = this.getInputData(JSONName) ?? '';
    const path = this.getInputData(JSONParamName) ?? '';
    const inputPathArray = this.inputSocketArray
      .filter((input) => input.name.includes('Name'))
      .map((input) => input.name);
    console.log(inputPathArray);
    const onChoosePath = (path: string): void => {
      this.setInputData(JSONParamName, path);
      this.execute(new Set());
    };

    this.createStaticContainerComponent(document, JsonPathPickerModal, {
      forceRefresh: Math.random(),
      json,
      path,
      onChoose: onChoosePath,
      inputPathArray,
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

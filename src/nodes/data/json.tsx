/* eslint-disable prettier/prettier */
import React, { useEffect } from 'react';
import { Box, Modal, ThemeProvider, createTheme } from '@mui/material';
import Color from 'color';
import { JsonPathPicker } from '../../components/JsonPathPicker';
import PureNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import { darkThemeOverride } from '../../utils/customTheme';
import { SOCKET_TYPE } from '../../utils/constants';
import { queryJSON } from '../../utils/utils';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import { TriggerType } from '../datatypes/triggerType';

const JSONName = 'JSON';
const JSONParamName = 'Name 1';
const outValueName = 'Value';

function JsonPathPickerModal(props) {
  const [open, setOpen] = React.useState(true);
  console.log(props, props.randomMainColor);

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    setOpen(true);
  }, [props.forceRefresh]);

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
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: 'absolute' as const,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60vw',
            height: '80vh',
            overflow: 'auto',
            bgcolor: 'background.default',
            boxShadow: 24,
            p: 4,
          }}
        >
          <JsonPathPicker
            json={props.json}
            onChoose={props.onChoose}
            path={props.path}
          />
        </Box>
      </Modal>
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

    const onChoosePath = (path: string): void => {
      this.setInputData(JSONParamName, path);
      this.execute(new Set());
    };

    this.createStaticContainerComponent(document, JsonPathPickerModal, {
      forceRefresh: Math.random(),
      json,
      path,
      onChoose: onChoosePath,
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

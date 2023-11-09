import { useState } from 'react';
import Socket from '../../classes/SocketClass';
import { AbstractType } from './abstractType';
import useInterval from 'use-interval';
import { FormGroup, TextField } from '@mui/material';
import React from 'react';

export interface FormatJSONInterface {
  Enabled: boolean;
  Alias: string;
}
export type NumberOutputWidgetProps = {
  property: Socket;
};

export default class FormatJSONType extends AbstractType {
  getInputWidget(props: any) {
    return FormatJSONWidget();
  }
  allowedAsOutput(): boolean {
    return false;
  }
}

export const FormatJSONWidget: React.FunctionComponent<FormatJSONInterface> = (
  props,
) => {
  const [enable, setEnabled] = useState();
  const [alias, setAlias] = useState();

  useInterval(() => {
    if (data !== props.property.data) {
      setData(Number(props.property.data));
    }
  }, 100);

  return (
    <>
      <FormGroup
        row={true}
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
        }}
      >
        <TextField
          variant="filled"
          label="Value"
          sx={{
            flexGrow: 1,
          }}
          disabled={true}
          inputProps={{
            type: 'number',
          }}
          value={data}
        />
      </FormGroup>
    </>
  );
};

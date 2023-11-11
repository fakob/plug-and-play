import { useState } from 'react';
import { AbstractType, DataTypeProps } from './abstractType';
import { Checkbox, FormGroup, TextField } from '@mui/material';
import React from 'react';

export interface FormatJSONInterface {
  Enabled: boolean;
  Alias: string;
}
export default class FormatJSONType extends AbstractType {
  getInputWidget = (props: any): any => {
    return FormatJSONWidget(props);
  };
  allowedAsOutput(): boolean {
    return false;
  }
}

export const FormatJSONWidget: React.FunctionComponent<DataTypeProps> = (
  props,
) => {
  const [enabled, setEnabled] = useState(props.property.data.Enabled);
  const [alias, setAlias] = useState(props.property.data.Alias);

  /*useInterval(() => {
    if (data !== props.property.data) {
      setData(Number(props.property.data));
    }
  }, 100);
  */

  return (
    <>
      <FormGroup
        row={true}
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
        }}
      >
        <Checkbox
          checked={enabled}
          onChange={() => {
            setEnabled(!enabled);
            //props.property
          }}
          disabled={!enabled}
        />
        <TextField
          variant="filled"
          label="Value"
          sx={{
            flexGrow: 1,
          }}
          disabled={enabled}
          inputProps={{
            type: 'number',
          }}
          value={alias}
        />
      </FormGroup>
    </>
  );
};

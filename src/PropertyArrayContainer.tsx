import React, { useEffect, useState } from 'react';
import {
  Box,
  ButtonGroup,
  MenuItem,
  Paper,
  Select,
  Stack,
  ToggleButton,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import Socket from './classes/SocketClass';
import styles from './utils/style.module.css';
import { AbstractType } from './nodes/datatypes/abstractType';
import { allDataTypes } from './nodes/datatypes/dataTypesMap';

type PropertyArrayContainerProps = {
  inputSocketArray: Socket[];
  outputSocketArray: Socket[];
};

export const PropertyArrayContainer: React.FunctionComponent<PropertyArrayContainerProps> =
  (props) => {
    return (
      <Stack spacing={1}>
        {props.inputSocketArray?.map((property, index) => {
          return (
            <PropertyContainer
              key={index}
              property={property}
              index={index}
              dataType={property.dataType}
              isInput={true}
              hasLink={property.hasLink()}
              data={property.data}
            />
          );
        })}
        {props.outputSocketArray?.map((property, index) => {
          return (
            <PropertyContainer
              key={index}
              property={property}
              index={index}
              dataType={property.dataType}
              isInput={false}
              hasLink={property.hasLink()}
              data={property.data}
            />
          );
        })}
      </Stack>
    );
  };

type PropertyContainerProps = {
  property: Socket;
  index: number;
  dataType: AbstractType;
  isInput: boolean;
  hasLink: boolean;
  data: any;
};

const PropertyContainer: React.FunctionComponent<PropertyContainerProps> = (
  props
) => {
  const [dataTypeValue, setDataTypeValue] = useState(props.dataType);
  const baseProps = {
    key: props.dataType.getName(),
    property: props.property,
    index: props.index,
    isInput: props.isInput,
    hasLink: props.hasLink,
    data: props.data,
  };

  const widget = dataTypeValue.getInputWidget(baseProps);

  const onChangeDropdown = (event) => {
    const value = event.target.value;
    const entry = new allDataTypes[value]();
    props.property.dataType = entry;
    setDataTypeValue(entry);
  };

  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <PropertyHeader
        key={`PropertyHeader-${props.dataType.getName()}`}
        property={props.property}
        index={props.index}
        isInput={props.isInput}
        hasLink={props.hasLink}
        onChangeDropdown={onChangeDropdown}
      />
      {widget}
    </Box>
  );
};

type PropertyHeaderProps = {
  property: Socket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  onChangeDropdown: (event) => void;
};

const PropertyHeader: React.FunctionComponent<PropertyHeaderProps> = (
  props
) => {
  const [visible, setVisible] = useState(props.property.visible);
  const [name, setName] = useState(props.property.name);

  useEffect(() => {
    props.property.setVisible(visible);
  }, [visible]);

  useEffect(() => {
    props.property.setName(name);
  }, [name]);

  return (
    <ButtonGroup
      fullWidth={true}
      style={{
        height: '16px',
        fontSize: '12px',
      }}
    >
      <ToggleButton
        value="check"
        size="small"
        selected={!visible}
        onChange={() => {
          setVisible((value) => !value);
        }}
        sx={{
          fontSize: '12px',
        }}
      >
        {visible ? (
          <VisibilityIcon fontSize="inherit" />
        ) : (
          <VisibilityOffIcon fontSize="inherit" />
        )}
      </ToggleButton>
      <Paper component={Stack} direction="row" sx={{ flexGrow: 1, px: 1 }}>
        <Box sx={{ px: 1 }}>{props.isInput ? 'IN' : 'OUT'}</Box>
        <Box sx={{ px: 1 }}>
          {props.property.name} {props.hasLink && 'LINKED'}
        </Box>
      </Paper>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={props.property.dataType.constructor.name}
        label="Property type"
        onChange={props.onChangeDropdown}
        disabled={props.hasLink}
        sx={{
          fontSize: '12px',
        }}
      >
        {Object.keys(allDataTypes).map((name) => {
          const entry = new allDataTypes[name]().getName();
          return (
            <MenuItem key={name} value={name}>
              {entry}
            </MenuItem>
          );
        })}
      </Select>
    </ButtonGroup>
  );
};

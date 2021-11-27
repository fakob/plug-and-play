import React, { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  FormGroup,
  MenuItem,
  Select,
  ToggleButton,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
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
      <>
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
      </>
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
    <div className={styles.inputContainer}>
      <PropertyHeader
        key={`PropertyHeader-${props.dataType.getName()}`}
        property={props.property}
        index={props.index}
        isInput={props.isInput}
        hasLink={props.hasLink}
        onChangeDropdown={onChangeDropdown}
      />
      {widget}
    </div>
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
    <FormControl size="small">
      <FormGroup row={true}>
        <ToggleButton
          value="check"
          size="small"
          selected={!visible}
          onChange={() => {
            setVisible((value) => !value);
          }}
        >
          {props.hasLink && <LockIcon />}
          {props.isInput ? 'IN' : 'OUT'}
        </ToggleButton>
        <Box sx={{ p: 1, typography: 'subtitle2' }}>{name}</Box>
        {/* <InputLabel id="demo-simple-select-label">Type</InputLabel> */}
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={props.property.dataType.constructor.name}
          label="Property type"
          onChange={props.onChangeDropdown}
          disabled={props.hasLink}
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
      </FormGroup>
    </FormControl>
  );
};

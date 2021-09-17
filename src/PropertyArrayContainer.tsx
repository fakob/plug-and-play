import React, { useEffect, useState } from 'react';
import {
  ControlGroup,
  EditableText,
  HTMLSelect,
  Icon,
  Tag,
} from '@blueprintjs/core';
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
    <ControlGroup>
      <Tag
        minimal={!visible}
        className={styles.propertyTag}
        onClick={() => {
          setVisible((value) => !value);
        }}
      >
        {props.hasLink && <Icon icon="lock" iconSize={8}></Icon>}
        {props.isInput ? 'IN' : 'OUT'}
      </Tag>
      <EditableText
        className={`${styles.editablePropertyName} ${
          visible ? styles.darkOnBright : styles.brightOnDark
        } ${props.hasLink && styles.opacity30}`}
        selectAllOnFocus
        value={name}
        onChange={(name) => {
          setName(name);
        }}
        disabled={props.hasLink}
      />
      {
        <HTMLSelect
          className={`${styles.opacity30} bp3-minimal`}
          onChange={props.onChangeDropdown}
          value={props.property.dataType.constructor.name}
          disabled={props.hasLink}
        >
          {Object.keys(allDataTypes).map((name) => {
            const entry = new allDataTypes[name]().getName();
            return (
              <option key={name} value={name}>
                {entry}
              </option>
            );
          })}
        </HTMLSelect>
      }
    </ControlGroup>
  );
};

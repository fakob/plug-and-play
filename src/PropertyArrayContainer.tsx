import React, { useEffect, useRef, useState } from 'react';
import prettyFormat from 'pretty-format';
import {
  Button,
  Checkbox,
  ControlGroup,
  Divider,
  EditableText,
  HTMLSelect,
  Icon,
  NumericInput,
  Slider,
  Tag,
  TextArea,
} from '@blueprintjs/core';
import { SketchPicker } from 'react-color';
import Socket from './classes/SocketClass';
import { DATATYPE } from './utils/constants';
import { limitRange, roundNumber } from './utils/utils';
import styles from './utils/style.module.css';
import { TRgba } from './utils/interfaces';
import {
  BooleanWidget,
  ColorWidget,
  DefaultOutputWidget,
  SelectWidget,
  SliderWidget,
  TextWidget,
  TriggerWidget,
} from './widgets';

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
  dataType: string;
  isInput: boolean;
  hasLink: boolean;
  data: any;
};

const PropertyContainer: React.FunctionComponent<PropertyContainerProps> = (
  props
) => {
  const [dataTypeValue, setDataTypeValue] = useState(props.dataType);
  const baseProps = {
    key: props.dataType.toString(),
    property: props.property,
    index: props.index,
    isInput: props.isInput,
    hasLink: props.hasLink,
    data: props.data,
  };

  let widget = null;
  if (props.isInput && !props.hasLink) {
    switch (dataTypeValue) {
      case DATATYPE.NUMBER:
        widget = <SliderWidget {...baseProps} />;
        break;
      case DATATYPE.STRING:
      case DATATYPE.ARRAY:
        widget = <TextWidget {...baseProps} />;
        break;
      case DATATYPE.ENUM:
        widget = <SelectWidget {...baseProps} />;
        break;
      case DATATYPE.TRIGGER:
        widget = <TriggerWidget {...baseProps} />;
        break;
      case DATATYPE.COLOR:
        widget = <ColorWidget {...baseProps} />;
        break;
      case DATATYPE.BOOLEAN:
        widget = <BooleanWidget {...baseProps} />;
        break;
      default:
    }
  } else if (!props.isInput) {
    switch (dataTypeValue) {
      case DATATYPE.TRIGGER:
        widget = <TriggerWidget {...baseProps} />;
        break;
      case DATATYPE.COLOR:
        widget = <ColorWidget {...baseProps} />;
        break;
      case DATATYPE.BOOLEAN:
      case DATATYPE.NUMBER:
      case DATATYPE.STRING:
      case DATATYPE.ARRAY:
        widget = <DefaultOutputWidget data={props.data} {...baseProps} />;
        break;
      default:
    }
  }

  const onChangeDropdown = (event) => {
    const value = event.target.value;
    props.property.dataType = value;
    setDataTypeValue(value);
  };

  return (
    <div className={styles.inputContainer}>
      <PropertyHeader
        key={`PropertyHeader-${props.dataType.toString()}`}
        property={props.property}
        index={props.index}
        isInput={props.isInput}
        hasLink={props.hasLink}
        dataType={dataTypeValue}
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
  dataType: string;
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
        onClick={
          props.hasLink
            ? undefined
            : () => {
                setVisible((value) => !value);
              }
        }
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
      <HTMLSelect
        className={`${styles.opacity30} bp3-minimal`}
        onChange={props.onChangeDropdown}
        value={props.dataType}
        disabled={props.hasLink}
      >
        {Object.values(DATATYPE).map((value) => {
          return (
            <option key={value} value={value}>
              {value}
            </option>
          );
        })}
      </HTMLSelect>
    </ControlGroup>
  );
};

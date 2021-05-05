import React, { useEffect, useRef, useState } from 'react';
import prettyFormat from 'pretty-format';
import {
  Button,
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
import { rgbToRgba } from './pixi/utils-pixi';
import styles from './utils/style.module.css';

type PropertyArrayContainerProps = {
  inputSocketArray: Socket[];
  outputSocketArray: Socket[];
};

export const PropertyArrayContainer: React.FunctionComponent<PropertyArrayContainerProps> = (
  props
) => {
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
  if (props.isInput) {
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
      default:
    }
  } else {
    switch (dataTypeValue) {
      case DATATYPE.TRIGGER:
        widget = <TriggerWidget {...baseProps} />;
        break;
      case DATATYPE.COLOR:
        widget = <ColorWidget {...baseProps} />;
        break;
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
        }`}
        selectAllOnFocus
        value={name}
        onChange={(name) => {
          setName(name);
        }}
      />
      <HTMLSelect
        className={`${styles.typeSelector} bp3-minimal`}
        onChange={props.onChangeDropdown}
        value={props.dataType}
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

type SliderWidgetProps = {
  property: Socket;
  isInput: boolean;
  hasLink: boolean;
  index: number;
  data: number;
};

const SliderWidget: React.FunctionComponent<SliderWidgetProps> = (props) => {
  const [data, setData] = useState(Number(props.data));
  const [minValue, setMinValue] = useState(
    Math.min(props.property.custom?.minValue ?? 0, data)
  );
  const [maxValue, setMaxValue] = useState(
    Math.max(props.property.custom?.maxValue ?? 100, data)
  );
  const [round, setRound] = useState(props.property.custom?.round ?? false);
  const [stepSizeValue] = useState(props.property.custom?.stepSize ?? 0.01);

  useEffect(() => {
    const newValue = round ? Math.round(data) : data;
    props.property.data = newValue;
    props.property.notifyChange(new Set());
  }, [data]);

  useEffect(() => {
    const newValue = limitRange(
      round ? Math.round(data) : data,
      minValue,
      maxValue
    );
    setData(newValue);
    props.property.data = newValue;
    props.property.custom = {
      minValue,
      maxValue,
      round,
    };
    props.property.notifyChange(new Set());
  }, [minValue, maxValue, round]);

  return (
    <>
      <ControlGroup>
        <Button
          disabled={props.hasLink}
          onClick={() => {
            setRound((value) => !value);
          }}
        >
          {round ? 'Integer' : 'Float'}
        </Button>
        <NumericInput
          disabled={props.hasLink}
          allowNumericCharactersOnly={false}
          selectAllOnFocus
          fill
          minorStepSize={round ? null : stepSizeValue}
          onValueChange={(value) => {
            setData(value);
          }}
          value={data || 0}
        />
        <Divider />
        <NumericInput
          disabled={props.hasLink}
          className={styles.minMaxInput}
          allowNumericCharactersOnly={false}
          selectAllOnFocus
          minorStepSize={round ? null : stepSizeValue}
          onValueChange={(value) => {
            setMinValue(value);
          }}
          value={minValue}
        />
        <NumericInput
          disabled={props.hasLink}
          className={styles.minMaxInput}
          allowNumericCharactersOnly={false}
          selectAllOnFocus
          minorStepSize={round ? null : stepSizeValue}
          onValueChange={(value) => {
            setMaxValue(value);
          }}
          value={maxValue}
        />
      </ControlGroup>
      <Slider
        disabled={props.hasLink}
        className={styles.slider}
        key={`${props.property.name}-${props.index}`}
        min={minValue}
        max={maxValue}
        stepSize={round ? 1 : stepSizeValue}
        labelValues={[minValue, maxValue]}
        onChange={(value) => {
          setData(roundNumber(value, 4));
        }}
        value={data || 0}
      />
    </>
  );
};

type SelectWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: number;
};

const SelectWidget: React.FunctionComponent<SelectWidgetProps> = (props) => {
  const [data, setData] = useState(props.data);
  const [options] = useState(props.property.custom?.options);

  const onChangeDropdown = (event) => {
    const value = event.target.value;
    props.property.data = value;
    props.property.notifyChange(new Set());
    setData(value);
  };

  return (
    <>
      <HTMLSelect
        // className={`bp3-minimal`}
        onChange={onChangeDropdown}
        value={data}
      >
        {options.map(({ text }, index) => {
          return (
            <option key={index} value={text}>
              {text}
            </option>
          );
        })}
      </HTMLSelect>
    </>
  );
};

type TextWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: string;
};

const TextWidget: React.FunctionComponent<TextWidgetProps> = (props) => {
  const [data, setData] = useState(props.data);

  useEffect(() => {
    props.property.data = data;
    props.property.notifyChange(new Set());
  }, [data]);

  return (
    <>
      <TextArea
        disabled={props.hasLink}
        className={`${styles.textArea} bp3-fill`}
        growVertically={true}
        onChange={(event) => {
          const value = event.target.value;
          setData(value);
        }}
        value={data || ''}
      />
    </>
  );
};

type TriggerWidgetProps = {
  property: Socket;
  index: number;
};

const TriggerWidget: React.FunctionComponent<TriggerWidgetProps> = (props) => {
  return (
    <>
      <Button
        rightIcon="play"
        onClick={() => {
          // nodes with trigger input need a trigger function
          (props.property.parent as any).trigger();
        }}
        fill
      >
        Execute
      </Button>
    </>
  );
};

type ColorWidgetProps = {
  property: Socket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  data: number[];
};

const ColorWidget: React.FunctionComponent<ColorWidgetProps> = (props) => {
  let defaultColor = [0, 0, 0, 1.0];
  if (props.data) {
    defaultColor = props.data;
    if (props.data?.length === 3) {
      // add alpha if missing
      defaultColor.push(1.0);
    }
  }
  const [colorPicker, showColorPicker] = useState(false);
  const [finalColor, changeColor] = useState(rgbToRgba(defaultColor));
  const componentMounted = useRef(true);

  useEffect(() => {
    if (componentMounted.current) {
      // uses useRef to avoid running when component mounts
      componentMounted.current = false;
    } else {
      console.log(finalColor);
      const colorArray: number[] = Object.values(finalColor);
      props.property.data = colorArray;
      props.property.notifyChange(new Set());
    }
    return () => undefined;
  }, [finalColor]);

  return (
    <>
      <div
        className={styles.colorPickerSwatch}
        style={{
          backgroundColor: `rgba(${finalColor.r}, ${finalColor.g}, ${finalColor.b}, ${finalColor.a})`,
        }}
        onClick={
          props.hasLink
            ? undefined
            : () => {
                showColorPicker(!colorPicker);
              }
        }
      >
        {props.isInput && !props.hasLink ? 'Pick a color' : ''}
      </div>
      {props.isInput && colorPicker && (
        <span className="chrome-picker">
          <SketchPicker
            color={finalColor}
            onChangeComplete={(colore) => {
              changeColor(colore.rgb);
            }}
          />
        </span>
      )}
    </>
  );
};

type DefaultOutputWidgetProps = {
  property: Socket;
  index: number;
  data: any;
};

const DefaultOutputWidget: React.FunctionComponent<DefaultOutputWidgetProps> = (
  props
) => {
  const [data] = useState(props.data);

  return (
    <>
      <TextArea
        className={`${styles.textArea} bp3-fill`}
        growVertically={true}
        value={prettyFormat(data)}
        readOnly
      />
    </>
  );
};

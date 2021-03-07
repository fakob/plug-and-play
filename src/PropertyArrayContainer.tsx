import React, { useEffect, useRef, useState } from 'react';
import prettyFormat from 'pretty-format';
import {
  Button,
  ControlGroup,
  Divider,
  EditableText,
  HTMLSelect,
  NumericInput,
  Slider,
  Tag,
  TextArea,
} from '@blueprintjs/core';
import { SketchPicker } from 'react-color';
import InputSocket from './classes/InputSocketClass';
import OutputSocket from './classes/OutputSocketClass';
import { INPUTTYPE, OUTPUTTYPE } from './utils/constants';
import { limitRange, roundNumber } from './utils/utils';
import { rgbToRgba } from './pixi/utils-pixi';
import styles from './utils/style.module.css';

type PropertyArrayContainerProps = {
  inputSocketArray: InputSocket[];
  outputSocketArray: OutputSocket[];
};

export const PropertyArrayContainer: React.FunctionComponent<PropertyArrayContainerProps> = (
  props
) => {
  // console.log(props.inputSocketArray);
  return (
    <>
      {props.inputSocketArray?.map((property, index) => {
        return (
          <PropertyContainer
            key={index}
            property={property}
            index={index}
            type={property.type}
            isInput={true}
          />
        );
      })}
      {props.outputSocketArray?.map((property, index) => {
        return (
          <PropertyContainer
            key={index}
            property={property}
            index={index}
            type={property.type}
            isInput={false}
          />
        );
      })}
    </>
  );
};

type PropertyContainerProps = {
  property: InputSocket | OutputSocket;
  index: number;
  type: string;
  isInput: boolean;
};

const PropertyContainer: React.FunctionComponent<PropertyContainerProps> = (
  props
) => {
  const [typeValue, setTypeValue] = useState(props.type);
  const baseProps = {
    key: props.type.toString(),
    property: props.property,
    index: props.index,
    isInput: props.isInput,
  };

  let widget = null;
  if (props.isInput) {
    switch (typeValue) {
      case INPUTTYPE.NUMBER.TYPE:
        widget = <SliderWidget {...baseProps} />;
        break;
      case INPUTTYPE.STRING.TYPE:
      case INPUTTYPE.ARRAY.TYPE:
        widget = <TextWidget {...baseProps} />;
        break;
      case INPUTTYPE.TRIGGER.TYPE:
        widget = <TriggerWidget {...baseProps} />;
        break;
      case INPUTTYPE.COLOR.TYPE:
        widget = <ColorWidget {...baseProps} />;
        break;
      default:
    }
  } else {
    switch (typeValue) {
      case OUTPUTTYPE.TRIGGER.TYPE:
        widget = <TriggerWidget {...baseProps} />;
        break;
      case OUTPUTTYPE.COLOR.TYPE:
        widget = <ColorWidget {...baseProps} />;
        break;
      case OUTPUTTYPE.NUMBER.TYPE:
      case OUTPUTTYPE.STRING.TYPE:
      case OUTPUTTYPE.ARRAY.TYPE:
        widget = <DefaultOutputWidget {...baseProps} />;
        break;
      default:
    }
  }

  const onChangeDropdown = (event) => {
    const value = event.target.value;
    props.property.type = value;
    setTypeValue(value);
  };

  return (
    <div className={styles.inputContainer}>
      <PropertyHeader
        key={`PropertyHeader-${props.type.toString()}`}
        property={props.property}
        index={props.index}
        isInput={props.isInput}
        type={typeValue}
        onChangeDropdown={onChangeDropdown}
      />
      {widget}
    </div>
  );
};

type PropertyHeaderProps = {
  property: InputSocket | OutputSocket;
  index: number;
  isInput: boolean;
  type: string;
  onChangeDropdown: (event) => void;
};

const PropertyHeader: React.FunctionComponent<PropertyHeaderProps> = (
  props
) => {
  const [visible, setVisible] = useState(props.property.visible);
  const [name, setName] = useState(props.property.name);

  useEffect(() => {
    props.property.visible = visible;
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
        value={props.type}
      >
        {Object.values(INPUTTYPE).map((value) => {
          return (
            <option key={value.TYPE} value={value.TYPE}>
              {value.TYPE}
            </option>
          );
        })}
      </HTMLSelect>
    </ControlGroup>
  );
};

type SliderWidgetProps = {
  property: InputSocket | OutputSocket;
  isInput: boolean;
  index: number;
  min?: number;
  max?: number;
  stepSize?: number;
};

const SliderWidget: React.FunctionComponent<SliderWidgetProps> = (props) => {
  // console.log(props);
  const [data, setData] = useState(props.property.data);
  const [round, setRound] = useState(false);
  const [minValue, setMinValue] = useState(props.min || 0);
  const [maxValue, setMaxValue] = useState(props.max || 100);
  const [stepSizeValue] = useState(props.stepSize || 0.01);

  useEffect(() => {
    const newValue = round ? Math.round(data) : data;
    props.property.data = newValue;
    if (props.isInput) {
      (props.property as InputSocket).defaultData = newValue;
    }
  }, [data]);

  useEffect(() => {
    const newValue = limitRange(
      round ? Math.round(data) : data,
      minValue,
      maxValue
    );
    setData(newValue);
    props.property.data = newValue;
    if (props.isInput) {
      (props.property as InputSocket).defaultData = newValue;
    }
  }, [minValue, maxValue, round]);

  return (
    <>
      <ControlGroup>
        <Tag
          minimal
          className={styles.propertyTag}
          onClick={() => {
            setRound((value) => !value);
          }}
        >
          {round ? 'Integer' : 'Float'}
        </Tag>
        <NumericInput
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

type TextWidgetProps = {
  property: InputSocket | OutputSocket;
  index: number;
};

const TextWidget: React.FunctionComponent<TextWidgetProps> = (props) => {
  console.log(props.property.data);
  const [data, setData] = useState(props.property.data);

  useEffect(() => {
    props.property.data = data;
  }, [data]);

  return (
    <>
      <TextArea
        className="bp3-fill"
        growVertically={true}
        onChange={(event) => {
          const value = event.target.value;
          setData(value);
        }}
        value={props.property.data || ''}
      />
    </>
  );
};

type TriggerWidgetProps = {
  property: InputSocket | OutputSocket;
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
  property: InputSocket | OutputSocket;
  index: number;
  isInput: boolean;
};

const ColorWidget: React.FunctionComponent<ColorWidgetProps> = (props) => {
  console.log(props.property.data);
  const [colorPicker, showColorPicker] = useState(false);
  const [finalColor, changeColor] = useState(
    rgbToRgba(props.property.data ? props.property.data : [0, 0, 0, 1.0])
  );
  const componentMounted = useRef(true);

  useEffect(() => {
    if (componentMounted.current) {
      // uses useRef to avoid running when component mounts
      componentMounted.current = false;
    } else {
      console.log(finalColor);
      const colorArray = Object.values(finalColor);
      props.property.data = colorArray;
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
        onClick={() => {
          showColorPicker(!colorPicker);
        }}
      >
        {props.isInput ? 'Pick a color' : ''}
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
  property: InputSocket | OutputSocket;
  index: number;
};

const DefaultOutputWidget: React.FunctionComponent<DefaultOutputWidgetProps> = (
  props
) => {
  return (
    <>
      <TextArea
        className={`${styles.outputTextArea} bp3-fill`}
        growVertically={true}
        value={prettyFormat(props.property.data)}
        readOnly
      />
    </>
  );
};

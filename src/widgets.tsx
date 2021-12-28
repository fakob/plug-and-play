import React, { useEffect, useRef, useState } from 'react';
import prettyFormat from 'pretty-format';
import {
  Button,
  Checkbox,
  ControlGroup,
  Divider,
  HTMLSelect,
  NumericInput,
  Slider,
  TextArea,
  Icon,
} from '@blueprintjs/core';
import { SketchPicker } from 'react-color';
import Socket from './classes/SocketClass';
import { roundNumber } from './utils/utils';
import styles from './utils/style.module.css';
import { TRgba } from './utils/interfaces';
import { EnumStructure } from './nodes/datatypes/enumType';
import { NumberType } from './nodes/datatypes/numberType';

export type SliderWidgetProps = {
  property: Socket;
  isInput: boolean;
  hasLink: boolean;
  index: number;
  data: number;
  type: NumberType;
};

function potentiallyNotify(property, newValue) {
  if (property.data !== newValue) {
    property.data = newValue;
    property.notifyChange(new Set());
  }
}

export const SliderWidget: React.FunctionComponent<SliderWidgetProps> = (
  props
) => {
  const [data, setData] = useState(Number(props.data));
  const [minValue, setMinValue] = useState(
    Math.min(props.type.minValue ?? 0, data)
  );
  const [maxValue, setMaxValue] = useState(
    Math.max(props.type.maxValue ?? 100, data)
  );
  const [round, setRound] = useState(props.type.round ?? false);
  const [stepSizeValue] = useState(props.type.stepSize ?? 0.01);

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
            potentiallyNotify(props.property, value);
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
          potentiallyNotify(props.property, value);
          setData(roundNumber(value, 4));
        }}
        value={data || 0}
      />
    </>
  );
};

export type SelectWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: number;
  options: EnumStructure;
};

export const SelectWidget: React.FunctionComponent<SelectWidgetProps> = (
  props
) => {
  const [data, setData] = useState(props.data);
  const [options] = useState(props.options);

  const onChange = (event) => {
    const value = event.target.value;
    potentiallyNotify(props.property, value);
    setData(value);
  };

  return (
    <>
      <HTMLSelect onChange={onChange} value={data}>
        {options?.map(({ text }, index) => {
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

export type BooleanWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: boolean;
};

export const BooleanWidget: React.FunctionComponent<BooleanWidgetProps> = (
  props
) => {
  const [data, setData] = useState(props.data);

  const onChange = (event) => {
    const value = event.target.checked;
    potentiallyNotify(props.property, value);
    setData(value);
  };

  return (
    <>
      <Checkbox
        checked={data}
        label={props.property.custom?.label}
        onChange={onChange}
      />
    </>
  );
};

export type TextWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: string;
};

export const TextWidget: React.FunctionComponent<TextWidgetProps> = (props) => {
  const [data, setData] = useState(props.data);

  return (
    <>
      <TextArea
        disabled={props.hasLink}
        className={`${styles.textArea} bp3-fill`}
        growVertically={true}
        onChange={(event) => {
          const value = event.target.value;
          potentiallyNotify(props.property, value);
          setData(value);
        }}
        value={data || ''}
      />
    </>
  );
};

export const JSONWidget: React.FunctionComponent<TextWidgetProps> = (props) => {
  const [data, setData] = useState(props.data);
  const [displayedString, setDisplayedString] = useState(
    typeof data === 'object' ? JSON.stringify(data) : data
  );
  const [validJSON, setValidJSON] = useState(true);

  return (
    <>
      <TextArea
        disabled={props.hasLink}
        className={`${styles.textArea} bp3-fill`}
        growVertically={true}
        onChange={(event) => {
          const value = event.target.value;
          setDisplayedString(value);
          try {
            const parsedValue = JSON.parse(value);
            setData(parsedValue);
            potentiallyNotify(props.property, parsedValue);
            setValidJSON(true);
          } catch (error) {
            setValidJSON(false);
          }
        }}
        value={displayedString}
      />
      {!validJSON && (
        <div style={{ display: 'flex' }}>
          <div>Invalid JSON </div>
          <Icon icon="cross" />
        </div>
      )}
    </>
  );
};

export type TriggerWidgetProps = {
  property: Socket;
  index: number;
};

export const TriggerWidget: React.FunctionComponent<TriggerWidgetProps> = (
  props
) => {
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

export type ColorWidgetProps = {
  property: Socket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  data: TRgba;
};

export const ColorWidget: React.FunctionComponent<ColorWidgetProps> = (
  props
) => {
  const defaultColor: TRgba = props.data ?? {
    r: 0,
    g: 0,
    b: 0,
    a: 1.0,
  };

  const [colorPicker, showColorPicker] = useState(false);
  const [finalColor, changeColor] = useState(defaultColor);
  const componentMounted = useRef(true);

  useEffect(() => {
    if (componentMounted.current) {
      // uses useRef to avoid running when component mounts
      componentMounted.current = false;
    } else {
      potentiallyNotify(props.property, finalColor);
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
            presetColors={[
              '#F4FAF9',
              '#F5F5F5',
              '#0C0C0C',
              '#E1547D',
              '#E154BB',
              '#AB53DE',
              '#5952DF',
              '#549BE0',
              '#56E1CC',
              '#55E179',
              '#7FE158',
              '#D4E25A',
              '#E19757',
              '#A43F6C',
              '#5F3EA3',
              '#3E54A3',
              '#4092A4',
              '#40A577',
              '#42A541',
              '#7BA442',
              '#A58E43',
              '#A45140',
            ]}
          />
        </span>
      )}
    </>
  );
};

export type DefaultOutputWidgetProps = {
  property: Socket;
  index: number;
  data: any;
};

export const DefaultOutputWidget: React.FunctionComponent<DefaultOutputWidgetProps> =
  (props) => {
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

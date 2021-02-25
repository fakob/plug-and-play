import React, { useEffect, useState } from 'react';
import {
  ControlGroup,
  FormGroup,
  HTMLSelect,
  NumericInput,
  Slider,
} from '@blueprintjs/core';
import InputSocket from './InputSocketClass';
import { INPUTTYPE } from './constants';
import styles from './style.module.css';

type SliderWidgetProps = {
  input: InputSocket;
  index: number;
  min?: number;
  max?: number;
  stepSize?: number;
};

const SliderWidget: React.FunctionComponent<SliderWidgetProps> = (props) => {
  // console.log(props);
  const [value, setValue] = useState(props.input.value);
  const [minValue, setMinValue] = useState(props.min || 0);
  const [maxValue, setMaxValue] = useState(props.max || 100);

  useEffect(() => {
    props.input.value = value;
  }, [value, minValue, maxValue]);

  return (
    <>
      <Slider
        key={`${props.input.name}-${props.index}`}
        min={minValue}
        max={maxValue}
        labelValues={[minValue, maxValue]}
        onChange={(value) => {
          setValue(value);
        }}
        value={value || 0}
      />
      <ControlGroup>
        <NumericInput
          allowNumericCharactersOnly={false}
          onValueChange={(value) => {
            setMinValue(value);
          }}
          value={minValue}
          fill={true}
        />
        <NumericInput
          allowNumericCharactersOnly={false}
          onValueChange={(value) => {
            setValue(value);
          }}
          value={value || 0}
          fill={true}
        />
        <NumericInput
          allowNumericCharactersOnly={false}
          onValueChange={(value) => {
            setMaxValue(value);
          }}
          value={maxValue}
          fill={true}
        />
      </ControlGroup>
    </>
  );
};

type TypeSelectWidgetProps = {
  input: InputSocket;
  index: number;
  type: string;
  onChangeDropdown: (event) => void;
};

const TypeSelectWidget: React.FunctionComponent<TypeSelectWidgetProps> = (
  props
) => {
  console.log(props.type);

  return (
    <FormGroup label={props.input.name} inline>
      <HTMLSelect onChange={props.onChangeDropdown} value={props.type}>
        {Object.values(INPUTTYPE).map((value) => {
          return (
            <option key={value} value={value}>
              {value}
            </option>
          );
        })}
      </HTMLSelect>
    </FormGroup>
  );
};

type InputContainerProps = {
  input: InputSocket;
  index: number;
  type: string;
};

const InputContainer: React.FunctionComponent<InputContainerProps> = (
  props
) => {
  const [typeValue, setTypeValue] = useState(props.type);

  let widget = null;
  switch (typeValue) {
    case INPUTTYPE.NUMBER:
      widget = (
        <SliderWidget
          key={props.type.toString()}
          input={props.input}
          index={props.index}
        />
      );
      break;
    default:
  }

  const onChangeDropdown = (event) => {
    const value = event.target.value;
    // console.log(value);
    props.input.type = value;
    setTypeValue(value);
  };

  return (
    <div className={styles.inputContainer}>
      <TypeSelectWidget
        key={`TypeSelectWidget-${props.type.toString()}`}
        input={props.input}
        index={props.index}
        type={typeValue}
        onChangeDropdown={onChangeDropdown}
      />
      {widget}
    </div>
  );
};

type InputArrayContainerProps = {
  inputSocketArray: InputSocket[];
};

export const InputArrayContainer: React.FunctionComponent<InputArrayContainerProps> = (
  props
) => {
  console.log(props.inputSocketArray);
  return (
    <>
      {props.inputSocketArray?.map((input, index) => {
        return (
          <InputContainer
            key={index}
            input={input}
            index={index}
            type={input.type}
          />
        );
      })}
    </>
  );
};

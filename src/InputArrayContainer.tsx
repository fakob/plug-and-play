import React, { useEffect, useState } from 'react';
import { HTMLSelect, Slider } from '@blueprintjs/core';
import InputSocket from './InputSocketClass';
import { INPUTTYPE } from './constants';
import { type } from 'os';

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

  useEffect(() => {
    props.input.value = value;
  }, [value]);

  return (
    <Slider
      key={`${props.input.name}-${props.index}`}
      min={props.min}
      max={props.max}
      stepSize={0.1}
      // labelStepSize={10}
      onChange={(value) => {
        setValue(value);
      }}
      value={value || 0}
      // vertical={vertical}
    />
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
    <HTMLSelect onChange={props.onChangeDropdown} value={props.type}>
      {Object.values(INPUTTYPE).map((value) => {
        return (
          <option key={value} value={value}>
            {value}
          </option>
        );
      })}
    </HTMLSelect>
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
    <>
      <TypeSelectWidget
        key={`TypeSelectWidget-${props.type.toString()}`}
        input={props.input}
        index={props.index}
        type={typeValue}
        onChangeDropdown={onChangeDropdown}
      />
      {widget}
    </>
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

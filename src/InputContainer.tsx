import React, { useEffect, useState } from 'react';
import { HTMLSelect, Slider } from '@blueprintjs/core';
import InputSocket from './InputSocketClass';
import { INPUTTYPE } from './constants';

type MyProps = {
  inputSocketArray: InputSocket[];
};

type SliderWidgetProps = {
  input: InputSocket;
  index: number;
  min?: number;
  max?: number;
  stepSize?: number;
};

const SliderWidget: React.FunctionComponent<SliderWidgetProps> = (props) => {
  // export const InputContainer = ({ inputSocketArray }) => {
  console.log(props);
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
      value={value}
      // vertical={vertical}
    />
  );
};

type TypeSelectWidgetProps = {
  input: InputSocket;
  index: number;
};

const TypeSelectWidget: React.FunctionComponent<TypeSelectWidgetProps> = (
  props
) => {
  // export const InputContainer = ({ inputSocketArray }) => {
  console.log(props);
  const [value, setValue] = useState(props.input.value);

  useEffect(() => {
    props.input.type = INPUTTYPE[value];
  }, [value]);

  return (
    <HTMLSelect
      onChange={(value) => {
        setValue(value);
      }}
    >
      {Object.entries(INPUTTYPE).map(([key, value]) => {
        return <option value={key}>{value}</option>;
      })}
    </HTMLSelect>
  );
};

export const InputContainer: React.FunctionComponent<MyProps> = (props) => {
  // export const InputContainer = ({ inputSocketArray }) => {
  console.log(props.inputSocketArray);

  return (
    <>
      {props.inputSocketArray?.map((input, index) => {
        // return JSON.stringify(input.serialize());
        switch (input.type) {
          case INPUTTYPE.NUMBER:
            return <SliderWidget input={input} index={index} />;
          default:
            return <TypeSelectWidget input={input} index={index} />;
        }
      })}
    </>
  );
};

// export default InputContainer;

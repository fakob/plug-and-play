import React, { useEffect, useState } from 'react';
import { HTMLSelect, Slider } from '@blueprintjs/core';
import InputSocket from './InputSocketClass';
import { INPUTTYPE } from './constants';

type SliderWidgetProps = {
  input: InputSocket;
  index: number;
  min?: number;
  max?: number;
  stepSize?: number;
};

const SliderWidget: React.FunctionComponent<SliderWidgetProps> = (props) => {
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
      value={value || 0}
      // vertical={vertical}
    />
  );
};

type TypeSelectWidgetProps = {
  input: InputSocket;
  index: number;
  type: string;
};

const TypeSelectWidget: React.FunctionComponent<TypeSelectWidgetProps> = (
  props
) => {
  console.log(props);
  // const [typeValue, setTypeValue] = useState('');

  // useEffect(() => {
  //   console.log(props.input.type, INPUTTYPE[typeValue]);
  //   props.input.type = INPUTTYPE[typeValue];
  // }, [typeValue]);

  const onChangeDropdown = (event) => {
    console.log(event.target.value);
    // setTypeValue(event.target.value);
    props.input.type = INPUTTYPE[event.target.value];
  };

  return (
    <HTMLSelect onChange={onChangeDropdown}>
      {Object.entries(INPUTTYPE).map(([key, value]) => {
        return (
          <option value={key} selected={props.type === value}>
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
};

const InputContainer: React.FunctionComponent<InputContainerProps> = (
  props
) => {
  console.log(props.input.type, INPUTTYPE.NUMBER);

  let widget = null;
  switch (props.input.type) {
    case INPUTTYPE.NUMBER:
      widget = <SliderWidget input={props.input} index={props.index} />;
      break;
    default:
  }

  return (
    <>
      <TypeSelectWidget
        input={props.input}
        index={props.index}
        type={props.input.type}
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
        return <InputContainer input={input} index={index} />;
      })}
    </>
  );
};

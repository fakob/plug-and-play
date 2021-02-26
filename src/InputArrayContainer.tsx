import React, { useEffect, useState } from 'react';
import {
  Button,
  ControlGroup,
  FormGroup,
  HTMLSelect,
  NumericInput,
  Slider,
  TextArea,
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
        className={styles.slider}
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

type TextWidgetProps = {
  input: InputSocket;
  index: number;
};

const TextWidget: React.FunctionComponent<TextWidgetProps> = (props) => {
  console.log(props.input.value);
  const [value, setValue] = useState(props.input.value);

  useEffect(() => {
    props.input.value = value;
  }, [value]);

  return (
    <>
      <TextArea
        className="bp3-fill"
        growVertically={true}
        onChange={(event) => {
          const value = event.target.value;
          setValue(value);
        }}
        value={value}
      />
    </>
  );
};

type TriggerWidgetProps = {
  input: InputSocket;
  index: number;
};

const TriggerWidget: React.FunctionComponent<TriggerWidgetProps> = (props) => {
  return (
    <>
      <Button
        rightIcon="play"
        onClick={() => {
          // nodes with trigger input need a trigger function
          (props.input.parent as any).trigger();
        }}
        fill
      >
        Execute
      </Button>
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
    case INPUTTYPE.STRING:
    case INPUTTYPE.ARRAY:
      widget = (
        <TextWidget
          key={props.type.toString()}
          input={props.input}
          index={props.index}
        />
      );
      break;
    case INPUTTYPE.TRIGGER:
      widget = (
        <TriggerWidget
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

import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  ControlGroup,
  FormGroup,
  HTMLSelect,
  NumericInput,
  Slider,
  TextArea,
} from '@blueprintjs/core';
import { SketchPicker } from 'react-color';
import OutputSocket from './classes/OutputSocketClass';
import { OUTPUTTYPE } from './utils/constants';
import { rgbToRgba } from './pixi/utils-pixi';
import styles from './utils/style.module.css';

type SliderWidgetProps = {
  output: OutputSocket;
  index: number;
  min?: number;
  max?: number;
  stepSize?: number;
};

const SliderWidget: React.FunctionComponent<SliderWidgetProps> = (props) => {
  // console.log(props);
  const [value, setValue] = useState(props.output.data);
  const [minValue, setMinValue] = useState(props.min || 0);
  const [maxValue, setMaxValue] = useState(props.max || 100);
  const [stepSizeValue, setStepSizeValue] = useState(props.stepSize || 0.01);

  useEffect(() => {
    props.output.data = value;
  }, [value, minValue, maxValue]);

  return (
    <>
      <Slider
        className={styles.slider}
        key={`${props.output.name}-${props.index}`}
        min={minValue}
        max={maxValue}
        stepSize={stepSizeValue}
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
  output: OutputSocket;
  index: number;
};

const TextWidget: React.FunctionComponent<TextWidgetProps> = (props) => {
  console.log(props.output.data);
  const [value, setValue] = useState(props.output.data);

  useEffect(() => {
    props.output.data = value;
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
  output: OutputSocket;
  index: number;
};

const TriggerWidget: React.FunctionComponent<TriggerWidgetProps> = (props) => {
  return (
    <>
      <Button
        rightIcon="play"
        onClick={() => {
          // nodes with trigger output need a trigger function
          (props.output.parent as any).trigger();
        }}
        fill
      >
        Execute
      </Button>
    </>
  );
};

type ColorWidgetProps = {
  output: OutputSocket;
  index: number;
};

const ColorWidget: React.FunctionComponent<ColorWidgetProps> = (props) => {
  // console.log(props.output.data);
  const [colorPicker, showColorPicker] = useState(false);
  const [finalColor, changeColor] = useState(rgbToRgba(props.output.data));
  const componentMounted = useRef(true);

  useEffect(() => {
    if (componentMounted.current) {
      // uses useRef to avoid running when component mounts
      componentMounted.current = false;
    } else {
      console.log(finalColor);
      const colorArray = Object.values(finalColor);
      props.output.data = colorArray;
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
        Pick a color
      </div>
      {colorPicker && (
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

type TypeSelectWidgetProps = {
  output: OutputSocket;
  index: number;
  type: string;
  onChangeDropdown: (event) => void;
};

const TypeSelectWidget: React.FunctionComponent<TypeSelectWidgetProps> = (
  props
) => {
  console.log(props.type);

  return (
    <FormGroup label={props.output.name} inline>
      <HTMLSelect
        className={`${styles.typeSelector} bp3-minimal`}
        onChange={props.onChangeDropdown}
        value={props.type}
      >
        {Object.values(OUTPUTTYPE).map((value) => {
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

type OutputContainerProps = {
  output: OutputSocket;
  index: number;
  type: string;
};

const OutputContainer: React.FunctionComponent<OutputContainerProps> = (
  props
) => {
  const [typeValue, setTypeValue] = useState(props.type);

  let widget = null;
  switch (typeValue) {
    case OUTPUTTYPE.NUMBER:
      widget = (
        <SliderWidget
          key={props.type.toString()}
          output={props.output}
          index={props.index}
        />
      );
      break;
    case OUTPUTTYPE.STRING:
    case OUTPUTTYPE.ARRAY:
      widget = (
        <TextWidget
          key={props.type.toString()}
          output={props.output}
          index={props.index}
        />
      );
      break;
    case OUTPUTTYPE.TRIGGER:
      widget = (
        <TriggerWidget
          key={props.type.toString()}
          output={props.output}
          index={props.index}
        />
      );
      break;
    case OUTPUTTYPE.COLOR:
      widget = (
        <ColorWidget
          key={props.type.toString()}
          output={props.output}
          index={props.index}
        />
      );
      break;
    default:
  }

  const onChangeDropdown = (event) => {
    const value = event.target.value;
    // console.log(value);
    props.output.type = value;
    setTypeValue(value);
  };

  return (
    <div className={styles.outputContainer}>
      <TypeSelectWidget
        key={`TypeSelectWidget-${props.type.toString()}`}
        output={props.output}
        index={props.index}
        type={typeValue}
        onChangeDropdown={onChangeDropdown}
      />
      {widget}
    </div>
  );
};

type OutputArrayContainerProps = {
  outputSocketArray: OutputSocket[];
};

export const OutputArrayContainer: React.FunctionComponent<OutputArrayContainerProps> = (
  props
) => {
  console.log(props.outputSocketArray);
  return (
    <>
      {props.outputSocketArray?.map((output, index) => {
        return (
          <OutputContainer
            key={index}
            output={output}
            index={index}
            type={output.type}
          />
        );
      })}
    </>
  );
};

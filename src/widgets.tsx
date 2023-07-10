import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SketchPicker } from 'react-color';
import { CodeEditor } from './components/Editor';
import Socket from './classes/SocketClass';
import {
  COLOR_DARK,
  COLOR_WHITE_TEXT,
  MAX_STRING_LENGTH,
  PRESET_COLORS,
  TRIGGER_TYPE_OPTIONS,
} from './utils/constants';
import {
  convertToString,
  getLoadedValue,
  parseJSON,
  roundNumber,
} from './utils/utils';
import styles from './utils/style.module.css';
import { TRgba } from './utils/interfaces';
import { EnumStructure } from './nodes/datatypes/enumType';
import { NumberType } from './nodes/datatypes/numberType';
import { TriggerType } from './nodes/datatypes/triggerType';
import useInterval from 'use-interval';
import { ActionHandler } from './utils/actionHandler';

async function potentiallyUpdateSocketData(property: Socket, newValue) {
  const nodeID = property.getNode().id;
  const name = property.name;
  const type = property.socketType;
  if (property.data !== newValue) {
    ActionHandler.interfaceApplyValueFunction(
      property.name,
      property.data,
      newValue,
      (newValue) => {
        const socket = ActionHandler.getSafeSocket(nodeID, type, name);
        socket.data = newValue;
        if (socket.getNode().updateBehaviour.update) {
          socket.getNode().executeOptimizedChain();
        }
      }
    );
  }
}

function SliderValueLabelComponent(props) {
  const { children, value } = props;

  return (
    <Tooltip enterTouchDelay={0} placement="top" title={value}>
      {children}
    </Tooltip>
  );
}

export type SliderWidgetProps = {
  property: Socket;
  isInput: boolean;
  hasLink: boolean;
  index: number;
  data: unknown;
  type: NumberType;
};

export const SliderWidget: React.FunctionComponent<SliderWidgetProps> = (
  props
) => {
  const [data, setData] = useState(Number(props.data || 0));

  useInterval(() => {
    if (data !== props.property.data) {
      setData(Number(props.property.data || 0));
    }
  }, 100);

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
      <Slider
        size="small"
        color="secondary"
        valueLabelDisplay="auto"
        disabled={props.hasLink}
        key={`${props.property.name}-${props.index}`}
        min={minValue}
        max={maxValue}
        step={round ? 1 : stepSizeValue}
        marks={[{ value: minValue }, { value: maxValue }]}
        slots={{
          valueLabel: SliderValueLabelComponent,
        }}
        onChange={(event, value) => {
          potentiallyUpdateSocketData(props.property, value);
          if (!Array.isArray(value)) {
            setData(roundNumber(value, 4));
          }
        }}
        value={data}
        sx={{
          ml: 1,
        }}
      />
      <FormGroup
        row={true}
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
        }}
      >
        <ToggleButton
          value="check"
          size="small"
          selected={round}
          color="secondary"
          disabled={props.hasLink}
          onChange={() => {
            setRound((value) => {
              // have to add this in here as there is an issue with getting the value from the event
              // https://github.com/mui/material-ui/issues/17454
              (props.type as NumberType).round = !value;
              return !value;
            });
          }}
          sx={{
            fontSize: '12px',
          }}
        >
          {round ? 'Int' : 'Float'}
        </ToggleButton>
        <TextField
          variant="filled"
          label="Value"
          sx={{
            flexGrow: 1,
          }}
          disabled={props.hasLink}
          inputProps={{
            type: 'number',
            inputMode: 'numeric',
            step: round ? null : stepSizeValue,
          }}
          onChange={(event) => {
            potentiallyUpdateSocketData(
              props.property,
              Number(event.target.value)
            );
            setData(Number(event.target.value));
          }}
          value={data || 0}
        />
        <TextField
          variant="filled"
          label="Min"
          sx={{
            width: '104px',
          }}
          disabled={props.hasLink}
          inputProps={{
            type: 'number',
            inputMode: 'numeric',
            step: round ? null : stepSizeValue,
          }}
          onChange={(event) => {
            const newMinValue = Number(event.target.value);
            setMinValue(newMinValue);
            (props.type as NumberType).minValue = newMinValue;
          }}
          value={minValue}
        />
        <TextField
          variant="filled"
          label="Max"
          sx={{
            width: '104px',
          }}
          disabled={props.hasLink}
          inputProps={{
            type: 'number',
            inputMode: 'numeric',
            step: round ? null : stepSizeValue,
          }}
          onChange={(event) => {
            const newMaxValue = Number(event.target.value);
            setMaxValue(newMaxValue);
            (props.type as NumberType).maxValue = newMaxValue;
          }}
          value={maxValue}
        />
      </FormGroup>
    </>
  );
};

export type SelectWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: unknown;
  options: EnumStructure;
  randomMainColor: string;
  onChange?: (value: string) => void;
  setOptions?: () => EnumStructure;
};

export const SelectWidget: React.FunctionComponent<SelectWidgetProps> = (
  props
) => {
  const [data, setData] = useState(props.data ?? '');
  const [options, setOptions] = useState(props.options);

  useInterval(() => {
    if (data !== props.property.data) {
      setData(props.property.data);
    }
  }, 100);

  const onOpen = () => {
    if (props.setOptions) {
      setOptions(props.setOptions());
    }
  };

  const onChange = (event) => {
    const value = event.target.value;
    potentiallyUpdateSocketData(props.property, value);
    setData(value);
    if (props.onChange) {
      props.onChange(value);
    }
    if (props.property.getNode()) {
      props.property.getNode().metaInfoChanged();
    }
  };

  useEffect(() => {
    if (props.setOptions) {
      setOptions(props.setOptions());
    }
  }, []);

  return (
    <FormGroup>
      <Select
        variant="filled"
        value={data}
        onOpen={onOpen}
        onChange={onChange}
        disabled={props.hasLink}
        MenuProps={{
          style: { zIndex: 1500 },
        }}
      >
        {options?.map(({ text }, index) => {
          return (
            <MenuItem
              key={index}
              value={text}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: `${Color(props.randomMainColor).negate()}`,
                },
              }}
            >
              {text}
            </MenuItem>
          );
        })}
      </Select>
    </FormGroup>
  );
};

export type BooleanWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: unknown;
};

export const BooleanWidget: React.FunctionComponent<BooleanWidgetProps> = (
  props
) => {
  const [data, setData] = useState(Boolean(props.data));

  useInterval(() => {
    if (data !== props.property.data) {
      setData(Boolean(props.property.data));
    }
  }, 100);

  const onChange = (event) => {
    const value = event.target.checked;
    potentiallyUpdateSocketData(props.property, value);
    setData(value);
  };

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox
            checked={data}
            onChange={onChange}
            disabled={props.hasLink}
          />
        }
        label={props.property.custom?.label ?? ''}
      />
    </FormGroup>
  );
};

export type TextWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: unknown;
  randomMainColor: string;
};

export const TextWidget: React.FunctionComponent<TextWidgetProps> = (props) => {
  const dataLength = convertToString(props.data)?.length;
  const [loadAll, setLoadAll] = useState(dataLength < MAX_STRING_LENGTH);

  const [loadedData, setLoadedData] = useState(
    getLoadedValue(convertToString(props.data), loadAll)
  );

  const onLoadAll = () => {
    setLoadedData(convertToString(props.data));
    setLoadAll(true);
  };

  useInterval(() => {
    if (loadedData !== props.property.data) {
      setLoadedData(
        getLoadedValue(convertToString(props.property.data), loadAll)
      );
    }
  }, 100);

  return (
    <FormGroup sx={{ position: 'relative' }}>
      {!loadAll && (
        <Button
          sx={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}
          color="secondary"
          variant="contained"
          size="small"
          onClick={onLoadAll}
        >
          Load all (to edit)
        </Button>
      )}
      <TextField
        hiddenLabel
        variant="filled"
        multiline
        disabled={!loadAll || props.hasLink}
        onChange={(event) => {
          const value = event.target.value;
          potentiallyUpdateSocketData(props.property, value);
          setLoadedData(value);
        }}
        value={loadedData}
      />
    </FormGroup>
  );
};

export type CodeWidgetProps = {
  property: Socket;
  index: number;
  hasLink: boolean;
  data: unknown;
  randomMainColor: string;
};

export const CodeWidget: React.FunctionComponent<CodeWidgetProps> = (props) => {
  const [data, setData] = useState(props.data);

  useInterval(() => {
    const formattedData = convertToString(props.property.data);
    if (data !== formattedData) {
      setData(formattedData);
    }
  }, 100);
  return (
    <CodeEditor
      value={data}
      randomMainColor={props.randomMainColor}
      editable={!props.hasLink}
      onChange={(value) => {
        potentiallyUpdateSocketData(props.property, value);
        setData(value);
      }}
    />
  );
};

export const JSONWidget: React.FunctionComponent<TextWidgetProps> = (props) => {
  const [data, setData] = useState(props.data);
  const [displayedString, setDisplayedString] = useState(props.data);
  const [validJSON, setValidJSON] = useState(true);

  useInterval(() => {
    const formattedData = convertToString(props.property.data);
    if (data !== formattedData) {
      setData(formattedData);
    }
  }, 100);

  return (
    <Box>
      <CodeEditor
        value={displayedString || ''}
        randomMainColor={props.randomMainColor}
        editable={!props.hasLink}
        onChange={(value) => {
          try {
            setDisplayedString(value);
            const parsedJSON = parseJSON(value);
            if (parsedJSON) {
              setData(parsedJSON as any);
              potentiallyUpdateSocketData(props.property, parsedJSON);
              setValidJSON(true);
            } else {
              setValidJSON(false);
            }
          } catch (error) {
            console.warn(error);
            setValidJSON(false);
          }
        }}
      />
      {!validJSON && <Alert severity="error">Invalid JSON!</Alert>}
    </Box>
  );
};

export type TriggerWidgetProps = {
  property: Socket;
  isInput: boolean;
  index: number;
  hasLink: boolean;
  data: unknown;
  type: TriggerType;
  randomMainColor: string;
};

export const TriggerWidget: React.FunctionComponent<TriggerWidgetProps> = (
  props
) => {
  const [data, setData] = useState(props.data);
  const [triggerType, setChangeFunctionString] = useState(
    props.type.triggerType
  );
  const [customFunctionString, setCustomFunctionString] = useState(
    props.type.customFunctionString
  );

  const onChangeTriggerType = (event) => {
    const value = event.target.value;
    (props.type as TriggerType).triggerType = value;
    setChangeFunctionString(value);
  };

  const onChangeFunction = (event) => {
    const value = event.target.value;
    (props.type as TriggerType).customFunctionString = value;
    setCustomFunctionString(value);
  };

  return (
    <>
      {props.hasLink && (
        <CodeEditor
          value={data || ''}
          randomMainColor={props.randomMainColor}
          onChange={(value) => {
            potentiallyUpdateSocketData(props.property, value);
            setData(value);
          }}
        />
      )}
      <FormControl variant="filled" fullWidth>
        <InputLabel>Trigger method</InputLabel>
        <Select
          variant="filled"
          value={triggerType}
          onChange={onChangeTriggerType}
          MenuProps={{
            style: { zIndex: 1500 },
          }}
        >
          {TRIGGER_TYPE_OPTIONS?.map(({ text }, index) => {
            return (
              <MenuItem
                key={index}
                value={text}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: `${Color(props.randomMainColor).negate()}`,
                  },
                }}
              >
                {text}
              </MenuItem>
            );
          })}
        </Select>
        <TextField
          hiddenLabel
          variant="filled"
          placeholder="Name of function to trigger"
          label={
            customFunctionString === ''
              ? 'executeOptimizedChain'
              : 'Name of function to trigger'
          }
          onChange={onChangeFunction}
          value={customFunctionString}
        />
        {!props.hasLink && (
          <Button
            startIcon={<PlayArrowIcon />}
            onClick={() => {
              // nodes with trigger input need a trigger function
              (props.property.getNode() as any)[
                customFunctionString === ''
                  ? 'executeOptimizedChain'
                  : customFunctionString
              ]();
            }}
            variant="contained"
            fullWidth
          >
            {customFunctionString === ''
              ? 'executeOptimizedChain'
              : customFunctionString}
          </Button>
        )}
      </FormControl>
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
  const defaultColor: TRgba = Object.assign(new TRgba(), props.data);

  const [colorPicker, showColorPicker] = useState(false);
  const [finalColor, changeColor] = useState(defaultColor);
  const componentMounted = useRef(true);

  useEffect(() => {
    if (componentMounted.current) {
      // uses useRef to avoid running when component' mounts
      componentMounted.current = false;
    } else {
      potentiallyUpdateSocketData(props.property, finalColor);
    }
    return () => undefined;
  }, [finalColor]);

  return (
    <>
      <div
        className={styles.colorPickerSwatch}
        style={{
          backgroundColor: finalColor.rgb(),
          color: `${finalColor.isDark() ? COLOR_WHITE_TEXT : COLOR_DARK}`,
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
            color={finalColor.object()}
            onChangeComplete={(color) => {
              const pickedrgb = color.rgb;
              changeColor(
                new TRgba(pickedrgb.r, pickedrgb.g, pickedrgb.b, pickedrgb.a)
              );
            }}
            presetColors={PRESET_COLORS}
          />
        </span>
      )}
    </>
  );
};

export type DefaultOutputWidgetProps = {
  property: Socket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  data: unknown;
  randomMainColor?: string;
};

export const DefaultOutputWidget: React.FunctionComponent<
  DefaultOutputWidgetProps
> = (props) => {
  const [data, setData] = useState(props.data);

  useInterval(() => {
    const formattedData = convertToString(props.property.data);
    if (data !== formattedData) {
      setData(formattedData);
    }
  }, 100);

  return (
    <CodeEditor
      value={data}
      randomMainColor={props.randomMainColor}
      editable={false}
    />
  );
};

export type NumberOutputWidgetProps = {
  property: Socket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  data: unknown;
  randomMainColor?: string;
};

export const NumberOutputWidget: React.FunctionComponent<
  NumberOutputWidgetProps
> = (props) => {
  const [data, setData] = useState(Number(props.data));

  useInterval(() => {
    if (data !== props.property.data) {
      setData(Number(props.property.data));
    }
  }, 100);

  return (
    <>
      <FormGroup
        row={true}
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
        }}
      >
        <TextField
          variant="filled"
          label="Value"
          sx={{
            flexGrow: 1,
          }}
          disabled={true}
          inputProps={{
            type: 'number',
          }}
          value={data}
        />
      </FormGroup>
    </>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  FormControl,
  FormGroup,
  InputLabel,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Popper,
  Select,
  Slider,
  Switch,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SketchPicker } from 'react-color';
import prettyBytes from 'pretty-bytes';
import InterfaceController from './InterfaceController';
import { CodeEditor } from './components/Editor';
import PPStorage from './PPStorage';
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
  getFileExtension,
  getLoadedValue,
  parseJSON,
  roundNumber,
} from './utils/utils';
import styles from './utils/style.module.css';
import { TRgba } from './utils/interfaces';
import { DataTypeProps } from './nodes/datatypes/abstractType';
import { BooleanTypeProps } from './nodes/datatypes/booleanType';
import { CodeTypeProps } from './nodes/datatypes/codeType';
import { ColorTypeProps } from './nodes/datatypes/colorType';
import { DynamicEnumTypeProps } from './nodes/datatypes/dynamicEnumType';
import { EnumTypeProps } from './nodes/datatypes/enumType';
import { JSONTypeProps } from './nodes/datatypes/jsonType';
import { NumberTypeProps } from './nodes/datatypes/numberType';
import { FileTypeProps } from './nodes/datatypes/fileType';
import { StringTypeProps } from './nodes/datatypes/stringType';
import { TriggerTypeProps } from './nodes/datatypes/triggerType';
import useInterval from 'use-interval';
import { ActionHandler } from './utils/actionHandler';

export async function potentiallyUpdateSocketData(property: Socket, newValue) {
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
      },
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

export const SliderWidget: React.FunctionComponent<NumberTypeProps> = (
  props,
) => {
  const [data, setData] = useState(Number(props.property.data || 0));

  useInterval(() => {
    if (data !== props.property.data) {
      setData(Number(props.property.data || 0));
    }
  }, 100);

  const [minValue, setMinValue] = useState(
    Math.min(props.dataType.minValue ?? 0, data),
  );
  const [maxValue, setMaxValue] = useState(
    Math.max(props.dataType.maxValue ?? 100, data),
  );
  const [round, setRound] = useState(props.dataType.round ?? false);
  const [stepSizeValue] = useState(props.dataType.stepSize ?? 0.01);

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
          width: 'calc(100% - 16px)',
        }}
      />
      <FormGroup
        row={true}
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '2px',
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
              props.dataType.round = !value;
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
              Number(event.target.value),
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
            props.dataType.minValue = newMinValue;
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
            props.dataType.maxValue = newMaxValue;
          }}
          value={maxValue}
        />
      </FormGroup>
    </>
  );
};

export const SelectWidget: React.FunctionComponent<
  EnumTypeProps | DynamicEnumTypeProps
> = (props) => {
  const [data, setData] = useState(props.property.data ?? '');
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

export const BooleanWidget: React.FunctionComponent<BooleanTypeProps> = (
  props,
) => {
  const [data, setData] = useState(Boolean(props.property.data));

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
    <FormGroup sx={{ pl: 1, userSelect: 'none' }}>
      <FormControlLabel
        control={
          <Switch
            checked={data}
            onChange={onChange}
            disabled={props.hasLink || !props.isInput}
            inputProps={{ 'aria-label': 'controlled' }}
          />
        }
        label={data.toString()}
      />
    </FormGroup>
  );
};

export const TextWidget: React.FunctionComponent<StringTypeProps> = (props) => {
  const dataLength = convertToString(props.property.data)?.length;
  const [loadAll, setLoadAll] = useState(dataLength < MAX_STRING_LENGTH);

  const [loadedData, setLoadedData] = useState(
    getLoadedValue(convertToString(props.property.data), loadAll),
  );

  const onLoadAll = () => {
    setLoadedData(convertToString(props.property.data));
    setLoadAll(true);
  };

  useInterval(() => {
    if (loadedData !== props.property.data) {
      setLoadedData(
        getLoadedValue(convertToString(props.property.data), loadAll),
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

export const FileBrowserWidget: React.FunctionComponent<FileTypeProps> = (
  props,
) => {
  const [filename, setFilename] = useState(props.property.data);
  const [options, setOptions] = useState([]);
  const [filterExtensions, setFilterExtensions] = useState(
    props.dataType.filterExtensions,
  );

  const openFileBrowser = () => {
    InterfaceController.onOpenFileBrowser();
  };

  const onOpen = async () => {
    const listOfResources: any[] = await PPStorage.getInstance().getResources();
    const filtered = listOfResources.filter(({ name }) => {
      if (filterExtensions.length === 0) {
        return true;
      }
      const extension = getFileExtension(name);
      return filterExtensions.includes(extension);
    });
    setOptions(filtered);
  };

  const onChange = (event) => {
    const value = event.target.value;
    potentiallyUpdateSocketData(props.property, value);
    setData(value);
  };

  const setData = (localResourceId) => {
    potentiallyUpdateSocketData(props.property, localResourceId);
    setFilename(localResourceId);
  };

  useInterval(() => {
    if (filename !== props.property.data) {
      setFilterExtensions(props.dataType.filterExtensions);
      setFilename(convertToString(props.property.data));
      onOpen();
    }
  }, 100);

  useEffect(() => {
    onOpen();
  }, []);

  return (
    <FormGroup sx={{ position: 'relative' }}>
      <FormControl variant="filled" fullWidth>
        <InputLabel>Select file (browser cache)</InputLabel>
        <Select
          variant="filled"
          value={filename}
          onOpen={onOpen}
          onChange={onChange}
          disabled={props.hasLink}
          sx={{ width: '100%' }}
          MenuProps={{
            style: { zIndex: 1500 },
          }}
        >
          {options.map(({ id, name, size }) => {
            return (
              <MenuItem
                key={id}
                value={id}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: `${Color(props.randomMainColor).negate()}`,
                  },
                }}
              >
                <ListItemText>{name}</ListItemText>
                <ListItemSecondaryAction>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ pr: 1.5 }}
                  >
                    {prettyBytes(size)}
                  </Typography>
                </ListItemSecondaryAction>
              </MenuItem>
            );
          })}
        </Select>
        <Button
          color="secondary"
          variant="contained"
          onClick={openFileBrowser}
          sx={{
            mt: 1,
          }}
        >
          OR Load new file
        </Button>
      </FormControl>
    </FormGroup>
  );
};

export const CodeWidget: React.FunctionComponent<CodeTypeProps> = (props) => {
  const [data, setData] = useState(convertToString(props.property.data));

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

export const JSONWidget: React.FunctionComponent<JSONTypeProps> = (props) => {
  const [data, setData] = useState(props.property.data);
  const [displayedString, setDisplayedString] = useState(props.property.data);
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

export const TriggerWidget: React.FunctionComponent<TriggerTypeProps> = (
  props,
) => {
  const [data, setData] = useState(props.property.data);
  const [triggerType, setChangeFunctionString] = useState(
    props.dataType.triggerType,
  );
  const [customFunctionString, setCustomFunctionString] = useState(
    props.dataType.customFunctionString,
  );

  const onChangeTriggerType = (event) => {
    const value = event.target.value;
    props.dataType.triggerType = value;
    setChangeFunctionString(value);
  };

  const onChangeFunction = (event) => {
    const value = event.target.value;
    props.dataType.customFunctionString = value;
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

export const ColorWidget: React.FunctionComponent<ColorTypeProps> = (props) => {
  const defaultColor: TRgba = Object.assign(new TRgba(), props.property.data);

  const [colorPicker, showColorPicker] = useState(false);
  const [finalColor, changeColor] = useState(defaultColor);
  const anchorRef = useRef(null);
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

  const handleClickAway = (e) => {
    showColorPicker(false);
  };

  return (
    <>
      <Box
        ref={anchorRef}
        className={styles.colorPickerSwatch}
        sx={{
          backgroundColor: finalColor.rgb(),
          color: `${finalColor.isDark() ? COLOR_WHITE_TEXT : COLOR_DARK}`,
          userSelect: 'none',
          height: '100%',
        }}
        onClick={
          props.hasLink
            ? undefined
            : (event) => {
                event.stopPropagation();
                showColorPicker(!colorPicker);
              }
        }
      >
        {props.isInput && !props.hasLink ? 'Pick a color' : ''}
      </Box>
      <ClickAwayListener onClickAway={handleClickAway}>
        <Popper
          id={`color-picker-${props.property.name}`}
          open={props.isInput && colorPicker}
          anchorEl={anchorRef.current}
          sx={{ zIndex: 10 }}
        >
          <SketchPicker
            color={finalColor.object()}
            onChangeComplete={(color) => {
              const pickedrgb = color.rgb;
              changeColor(
                new TRgba(pickedrgb.r, pickedrgb.g, pickedrgb.b, pickedrgb.a),
              );
            }}
            presetColors={PRESET_COLORS}
          />
        </Popper>
      </ClickAwayListener>
    </>
  );
};

export const DefaultOutputWidget: React.FunctionComponent<DataTypeProps> = (
  props,
) => {
  const [data, setData] = useState(props.property.data);

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

export const NumberOutputWidget: React.FunctionComponent<DataTypeProps> = (
  props,
) => {
  const [data, setData] = useState(Number(props.property.data));

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
          hiddenLabel
          variant="filled"
          sx={{
            flexGrow: 1,
          }}
          disabled={true}
          inputProps={{
            type: 'number',
          }}
          value={data}
          size="small"
        />
      </FormGroup>
    </>
  );
};

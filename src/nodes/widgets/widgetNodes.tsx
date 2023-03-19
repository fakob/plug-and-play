/* eslint-disable @typescript-eslint/no-empty-function */

import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  ClickAwayListener,
  Fade,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Popper,
  Slider,
  Stack,
  Select,
  SelectChangeEvent,
  Switch,
  ThemeProvider,
  Typography,
} from '@mui/material';
import ColorizeIcon from '@mui/icons-material/Colorize';
import { SketchPicker } from 'react-color';
import Socket from '../../classes/SocketClass';
import { Widget_Base } from './abstract';
import { TRgba } from '../../utils/interfaces';
import {
  PRESET_COLORS,
  RANDOMMAINCOLOR,
  SOCKET_TYPE,
  customTheme,
} from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { BooleanType } from '../datatypes/booleanType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';
import { ColorType } from '../datatypes/colorType';

const selectedName = 'Initial selection';
const initialValueName = 'Initial value';
const minValueName = 'Min';
const roundName = 'Round';
const stepSizeName = 'Step size';
const maxValueName = 'Max';
const offValueName = 'Off';
const onValueName = 'On';
const labelName = 'Label';
const optionsName = 'Options';
const selectedOptionName = 'Selected option';
const multiSelectName = 'Select multiple';
const outName = 'Out';

const margin = 4;

const defaultOptions = ['Option1', 'Option2', 'Option3'];

export class WidgetButton extends Widget_Base {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(SOCKET_TYPE.IN, labelName, new StringType(), 'Button', false),
      new Socket(SOCKET_TYPE.OUT, outName, new AnyType()),
    ];
  }

  public getName(): string {
    return 'Button';
  }

  public getDescription(): string {
    return 'Adds a button to trigger values';
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  public onWidgetTrigger = () => {
    console.log('onWidgetTrigger');
    this.executeOptimizedChain();
  };

  protected getParentComponent(props: any): any {
    const node = props.node;

    useEffect(() => {
      node.setOutputData(outName, node.getInputData(offValueName));
      node.executeChildren();
    }, []);

    const handleOnPointerDown = () => {
      node.onWidgetTrigger();
      const inputData = node.getInputData(onValueName);
      node.setOutputData(outName, inputData);
      node.executeChildren();
    };

    const handleOnPointerUp = () => {
      const inputData = node.getInputData(offValueName);
      node.setOutputData(outName, inputData);
      node.executeChildren();
    };

    return (
      <ThemeProvider theme={customTheme}>
        <Paper
          component={Stack}
          direction="column"
          justifyContent="center"
          sx={{
            bgcolor: 'background.default',
            fontSize: '16px',
            border: 0,
            width: `${node.nodeWidth}px`,
            height: `${node.nodeHeight}px`,
            boxShadow: 16,
            '&:hover': {
              boxShadow: 12,
            },
          }}
        >
          <Button
            variant="contained"
            onPointerDown={handleOnPointerDown}
            onPointerUp={handleOnPointerUp}
            sx={{
              pointerEvents: 'auto',
              margin: 'auto',
              fontSize: '16px',
              lineHeight: '20px',
              border: 0,
              width: `${node.nodeWidth - 8 * margin}px`,
              height: `${node.nodeHeight - 8 * margin}px`,
              borderRadius: `${node.nodeWidth / 16}px`,
              boxShadow: 16,
              '&:hover': {
                boxShadow: 12,
              },
              '&:active': {
                boxShadow: 4,
              },
            }}
          >
            {props[labelName]}
          </Button>
        </Paper>
      </ThemeProvider>
    );
  }
}

export class WidgetColorPicker extends Widget_Base {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        initialValueName,
        new ColorType(),
        RANDOMMAINCOLOR,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        labelName,
        new StringType(),
        'Pick a color',
        false
      ),
      new Socket(SOCKET_TYPE.OUT, outName, new ColorType()),
    ];
  }

  public getName(): string {
    return 'Color picker';
  }

  public getDescription(): string {
    return 'Adds a color picker';
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  protected getParentComponent(props: any): any {
    const node = props.node;
    const ref = useRef<HTMLDivElement | null>(null);
    const [finalColor, setFinalColor] = useState(
      props[initialValueName] || TRgba.white()
    );
    const [colorPicker, showColorPicker] = useState(false);

    useEffect(() => {
      node.setOutputData(outName, finalColor);
      node.executeChildren();
    }, []);

    const handleOnChange = (color) => {
      const pickedrgb = color.rgb;
      const newColor = new TRgba(
        pickedrgb.r,
        pickedrgb.g,
        pickedrgb.b,
        pickedrgb.a
      );
      setFinalColor(newColor);
      node.setInputData(initialValueName, newColor);
      node.setOutputData(outName, newColor);
      node.executeChildren();
    };

    return (
      <ThemeProvider theme={customTheme}>
        <Paper
          component={Stack}
          direction="column"
          justifyContent="center"
          ref={ref}
          sx={{
            bgcolor: 'background.default',
            fontSize: '16px',
            border: 0,
            width: `${node.nodeWidth}px`,
            height: `${node.nodeHeight}px`,
            boxShadow: 16,
            '&:hover': {
              boxShadow: 12,
            },
          }}
        >
          <Button
            variant="contained"
            onClick={() => {
              showColorPicker(!colorPicker);
            }}
            sx={{
              pointerEvents: 'auto',
              margin: 'auto',
              fontSize: '16px',
              lineHeight: '20px',
              border: 0,
              bgcolor: finalColor.hex(),
              color: finalColor.getContrastTextColor().hex(),
              width: `${node.nodeWidth - 8 * margin}px`,
              height: `${node.nodeHeight - 8 * margin}px`,
              borderRadius: `${node.nodeWidth / 4}px`,
              boxShadow: 16,
              '&:hover': {
                bgcolor: finalColor.darken(0.1).hex(),
                boxShadow: 12,
              },
              '&:active': {
                boxShadow: 4,
              },
            }}
          >
            {props[labelName]}
            <ColorizeIcon sx={{ pl: 1 }} />
          </Button>
          <Popper
            id="toolbar-popper"
            open={colorPicker}
            anchorEl={ref.current}
            placement="top"
            transition
          >
            {({ TransitionProps }) => (
              <Fade {...TransitionProps} timeout={350}>
                <Paper
                  sx={{
                    margin: '4px',
                  }}
                >
                  <ClickAwayListener onClickAway={() => showColorPicker(false)}>
                    <span className="chrome-picker">
                      <SketchPicker
                        color={finalColor.object()}
                        onChangeComplete={handleOnChange}
                        onChange={handleOnChange}
                        presetColors={PRESET_COLORS}
                      />
                    </span>
                  </ClickAwayListener>
                </Paper>
              </Fade>
            )}
          </Popper>
        </Paper>
      </ThemeProvider>
    );
  }
}

export class WidgetSwitch extends Widget_Base {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, selectedName, new BooleanType(), false, false),
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(SOCKET_TYPE.IN, labelName, new StringType(), 'Switch', false),
      new Socket(SOCKET_TYPE.OUT, outName, new AnyType()),
    ];
  }

  public getName(): string {
    return 'Switch';
  }

  public getDescription(): string {
    return 'Adds a switch to toggle between values';
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  protected getParentComponent(props: any): any {
    const node = props.node;

    const [selected, setSelected] = useState(node.getInputData(selectedName));

    useEffect(() => {
      prepareAndExecute(selected);
    }, []);

    const prepareAndExecute = (newValue) => {
      const onValue = node.getInputData(onValueName);
      const offValue = node.getInputData(offValueName);
      node.setInputData(selectedName, newValue ? onValue : offValue);
      node.setOutputData(outName, newValue ? onValue : offValue);
      node.executeChildren();
    };

    const handleOnChange = () => {
      const newValue = !selected;
      setSelected(newValue);
      prepareAndExecute(newValue);
    };

    return (
      <ThemeProvider theme={customTheme}>
        <Paper
          component={Stack}
          direction="column"
          justifyContent="center"
          sx={{
            bgcolor: 'background.default',
            fontSize: '16px',
            border: 0,
            width: `${node.nodeWidth}px`,
            height: `${node.nodeHeight}px`,

            boxShadow: 16,
            '&:hover': {
              boxShadow: 12,
            },
          }}
        >
          <FormControl
            component="fieldset"
            sx={{ margin: 'auto', pointerEvents: 'auto' }}
          >
            <FormGroup aria-label="position" row>
              <FormControlLabel
                value={props[labelName]}
                control={
                  <Switch
                    size="medium"
                    checked={selected}
                    color="primary"
                    onChange={handleOnChange}
                    sx={{
                      transform: 'scale(1.5)',
                      marginLeft: '24px',
                      marginRight: '8px',
                    }}
                  />
                }
                label={props[labelName]}
                labelPlacement="end"
              />
            </FormGroup>
          </FormControl>
        </Paper>
      </ThemeProvider>
    );
  }
}

export class WidgetSlider extends Widget_Base {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, initialValueName, new NumberType(), 0, false),
      new Socket(SOCKET_TYPE.IN, minValueName, new NumberType(), 0, false),
      new Socket(SOCKET_TYPE.IN, maxValueName, new NumberType(), 100, false),
      new Socket(SOCKET_TYPE.IN, roundName, new BooleanType(), 100, false),
      new Socket(SOCKET_TYPE.IN, stepSizeName, new NumberType(), 0.01, false),
      new Socket(SOCKET_TYPE.IN, labelName, new StringType(), 'Slider', false),
      new Socket(SOCKET_TYPE.OUT, outName, new NumberType()),
    ];
  }

  public getName(): string {
    return 'Slider';
  }

  public getDescription(): string {
    return 'Adds a number slider';
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  protected getParentComponent(props: any): any {
    const node = props.node;
    const [data, setData] = useState(Number(props[initialValueName]));
    const [minValue, setMinValue] = useState(
      Math.min(props[minValueName] ?? 0, data)
    );
    const [maxValue, setMaxValue] = useState(
      Math.max(props[maxValueName] ?? 100, data)
    );
    const [round, setRound] = useState(props[roundName] ?? false);
    const [stepSizeValue, setStepSizeValue] = useState(
      props[stepSizeName] ?? 0.01
    );

    useEffect(() => {
      node.setOutputData(outName, data);
      node.executeChildren();
    }, []);

    useEffect(() => {
      setData(Number(props[initialValueName]));
      setMinValue(Math.min(props[minValueName] ?? 0, data));
      setMaxValue(Math.max(props[maxValueName] ?? 100, data));
      setRound(props[roundName] ?? false);
      setStepSizeValue(props[stepSizeName] ?? 0.01);
    }, [
      props[initialValueName],
      props[minValueName],
      props[maxValueName],
      props[roundName],
      props[stepSizeName],
    ]);

    const handleOnChange = (event, value) => {
      if (!Array.isArray(value)) {
        if (value !== props[initialValueName]) {
          node.setInputData(initialValueName, value);
        }
        setData(value);
        node.setOutputData(outName, value);
        node.executeChildren();
      }
    };

    return (
      <ThemeProvider theme={customTheme}>
        <Paper
          component={Stack}
          direction="column"
          justifyContent="center"
          sx={{
            bgcolor: 'background.default',
            fontSize: '16px',
            border: 0,
            width: `${node.nodeWidth}px`,
            height: `${node.nodeHeight}px`,
            boxShadow: 16,
            '&:hover': {
              boxShadow: 12,
            },
          }}
        >
          <Slider
            size="small"
            color="secondary"
            valueLabelDisplay="on"
            min={minValue}
            max={maxValue}
            step={round ? 1 : stepSizeValue}
            onChange={handleOnChange}
            value={data || 0}
            sx={{
              margin: `${6 * margin}px ${8 * margin}px ${margin}px`,
              height: '8px',
              pointerEvents: 'auto',
              '&.MuiSlider-root': {
                width: 'unset',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'primary.dark',
              },
              '& .MuiSlider-track': {
                border: 'none',
                backgroundColor: 'primary.main',
              },
              '& .MuiSlider-valueLabel': {
                fontSize: '1rem',
                fontWeight: 'normal',
                top: -4,
                backgroundColor: 'unset',
                color: 'text.primary',
                '&:before': {
                  display: 'none',
                },
                '& *': {
                  background: 'transparent',
                  color: 'text.primary',
                },
              },
              '& .MuiSlider-thumb': {
                height: 32,
                width: 32,
                backgroundColor: 'text.primary',
                borderColor: 'primary.main',
                borderWidth: '4px',
                borderStyle: 'solid',
                '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                  boxShadow: 'inherit',
                },
                '&:before': {
                  display: 'none',
                },
              },
            }}
          />
          <Typography
            sx={{
              textAlign: 'center',
              textOverflow: 'ellipsis',
              px: 2,
            }}
          >
            {props[labelName]}
          </Typography>
        </Paper>
      </ThemeProvider>
    );
  }
}

export class WidgetDropdown extends Widget_Base {
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        optionsName,
        new ArrayType(),
        defaultOptions,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        selectedOptionName,
        new ArrayType(),
        undefined,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        multiSelectName,
        new BooleanType(),
        false,
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        labelName,
        new StringType(),
        'Dropdown',
        false
      ),
      new Socket(SOCKET_TYPE.OUT, outName, new AnyType()),
    ];
  }

  public getName(): string {
    return 'Dropdown';
  }

  public getDescription(): string {
    return 'Adds a dropdown to select values';
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  protected getParentComponent(props: any): any {
    const node = props.node;
    const [options, setOptions] = useState<any[]>(props[optionsName]);
    const [selectedOption, setSelectedOption] = useState<string | string[]>(
      formatSelected(props[selectedOptionName], props[multiSelectName])
    );

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
      PaperProps: {
        style: {
          maxHeight: ITEM_HEIGHT * 9.5 + ITEM_PADDING_TOP,
        },
      },
    };

    const handleChange = (event: SelectChangeEvent<typeof selectedOption>) => {
      const {
        target: { value },
      } = event;
      // single select: value is string
      // multi select: value is array of strings
      const formattedValue = formatSelected(value, props[multiSelectName]);
      setSelectedOption(formattedValue);
      node.setInputData(selectedOptionName, formattedValue);
      node.setOutputData(outName, formattedValue);
      node.executeChildren();
    };

    useEffect(() => {
      node.setOutputData(outName, selectedOption);
      node.executeChildren();
    }, []);

    useEffect(() => {
      setOptions(props[optionsName]);
    }, [props[optionsName]]);

    useEffect(() => {
      const formattedValue = formatSelected(
        props[selectedOptionName],
        props[multiSelectName]
      );
      setOptions(props[optionsName]);
      setSelectedOption(formattedValue);
      node.setInputData(selectedOptionName, formattedValue);
      node.setOutputData(outName, formattedValue);
      node.executeChildren();
    }, [props[multiSelectName], props[selectedOptionName]]);

    return (
      <ThemeProvider theme={customTheme}>
        <Paper
          component={Stack}
          direction="column"
          justifyContent="center"
          sx={{
            bgcolor: 'background.default',
            fontSize: '16px',
            border: 0,
            width: `${node.nodeWidth}px`,
            height: `${node.nodeHeight}px`,
            boxShadow: 16,
            '&:hover': {
              boxShadow: 12,
            },
          }}
        >
          <FormControl variant="filled" sx={{ m: 2, pointerEvents: 'auto' }}>
            <InputLabel>{props[labelName]}</InputLabel>
            <Select
              variant="filled"
              multiple={props[multiSelectName]}
              value={
                props[multiSelectName] && !Array.isArray(selectedOption)
                  ? String(selectedOption).split(',')
                  : selectedOption
              }
              onChange={handleChange}
              renderValue={(selected) =>
                typeof selected === 'string' ? selected : selected.join(', ')
              }
              MenuProps={MenuProps}
            >
              {Array.isArray(options) &&
                options.map((name) => (
                  <MenuItem key={name} value={name}>
                    {props[multiSelectName] && (
                      <Checkbox checked={selectedOption.indexOf(name) > -1} />
                    )}
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Paper>
      </ThemeProvider>
    );
  }
}

const formatSelected = (
  selected: unknown,
  multiSelect: boolean
): string | string[] => {
  if (multiSelect && !Array.isArray(selected)) {
    return String(selected).split(',');
  } else if (!multiSelect && Array.isArray(selected)) {
    return selected.join(', ');
  } else if (!Array.isArray(selected)) {
    return String(selected);
  } else {
    return selected;
  }
};

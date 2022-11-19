/* eslint-disable @typescript-eslint/no-empty-function */

import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
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
} from '@mui/material';
import ColorizeIcon from '@mui/icons-material/Colorize';
import { SketchPicker } from 'react-color';
import Socket from '../../classes/SocketClass';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import {
  PRESET_COLORS,
  SOCKET_TYPE,
  customTheme,
  RANDOMMAINCOLOR,
} from '../../utils/constants';
import { roundNumber } from '../../utils/utils';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { BooleanType } from '../datatypes/booleanType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';
import HybridNode from '../../classes/HybridNode';
import { ColorType } from '../datatypes/colorType';

const selectedName = 'Initial selection';
const initialValueName = 'Initial value';
const minValueName = 'Min';
const roundName = 'Round';
const stepSizeName = 'Step size';
const maxValueName = 'Max';
const offValueName = 'Off';
const onValueName = 'On';
const buttonTextName = 'Button text';
const optionsName = 'Options';
const selectedOptionName = 'Selected option';
const multiSelectName = 'Select multiple';
const outName = 'Out';

const margin = 4;

const defaultOptions = ['Option1', 'Option2', 'Option3'];

export class WidgetButton extends HybridNode {
  update: () => void;
  onWidgetTrigger: () => void;

  getOpacity(): number {
    return 0.01;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(
        SOCKET_TYPE.IN,
        buttonTextName,
        new StringType(),
        'Button',
        false
      ),
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

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const buttonText = this.getInputData(buttonTextName);
      this.createContainerComponent(
        WidgetParent,
        {
          nodeWidth: this.nodeWidth,
          nodeHeight: this.nodeHeight,
          margin,
          buttonText,
        },
        {
          overflow: 'visible',
        }
      );
      super.onNodeAdded();
    };

    this.update = (): void => {
      const buttonText = this.getInputData(buttonTextName);
      this.renderReactComponent(WidgetParent, {
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
        margin,
        buttonText,
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();
    };

    this.onWidgetTrigger = () => {
      console.log('onWidgetTrigger');
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    type MyProps = {
      doubleClicked: boolean; // is injected by the NodeClass
      nodeWidth: number;
      nodeHeight: number;
      margin: number;
      buttonText: number;
    };

    const WidgetParent: FunctionComponent<MyProps> = (props) => {
      const handleOnPointerDown = () => {
        this.onWidgetTrigger();
        const inputData = this.getInputData(onValueName);
        this.setOutputData(outName, inputData);
        this.executeChildren();
      };

      const handleOnPointerUp = () => {
        const inputData = this.getInputData(offValueName);
        this.setOutputData(outName, inputData);
        this.executeChildren();
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
              width: `${this.nodeWidth}px`,
              height: `${this.nodeHeight}px`,
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
                width: `${this.nodeWidth - 8 * margin}px`,
                height: `${this.nodeHeight - 8 * margin}px`,
                borderRadius: `${this.nodeWidth / 16}px`,
                boxShadow: 16,
                '&:hover': {
                  boxShadow: 12,
                },
                '&:active': {
                  boxShadow: 4,
                },
              }}
            >
              {props.buttonText}
            </Button>
          </Paper>
        </ThemeProvider>
      );
    };
  }
}

export class WidgetColorPicker extends HybridNode {
  update: () => void;

  getOpacity(): number {
    return 0.01;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        initialValueName,
        new ColorType(),
        RANDOMMAINCOLOR,
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

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    if (customArgs?.initialData) {
      this.setInputData(initialValueName, customArgs?.initialData);
    }

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(
        WidgetParent,
        {
          nodeWidth: this.nodeWidth,
          nodeHeight: this.nodeHeight,
          margin,
          initialData: this.getInputData(initialValueName),
        },
        {
          overflow: 'visible',
        }
      );
      this.setOutputData(outName, this.getInputData(initialValueName));
      super.onNodeAdded();
    };

    this.update = (): void => {
      this.renderReactComponent(WidgetParent, {
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
        margin,
        initialData: this.getInputData(initialValueName),
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();
      this.setOutputData(outName, this.getInputData(initialValueName));
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.update();
    };

    this.onExecute = async function (input, output) {
      output[outName] = input[initialValueName];
      this.update();
    };

    type MyProps = {
      doubleClicked: boolean; // is injected by the NodeClass
      nodeWidth: number;
      nodeHeight: number;
      margin: number;
      initialData: TRgba;
    };

    const WidgetParent: FunctionComponent<MyProps> = (props) => {
      const ref = useRef<HTMLLIElement | null>(null);
      const [finalColor, setFinalColor] = useState(props.initialData);
      const [colorPicker, showColorPicker] = useState(false);

      const handleOnChange = (color) => {
        const pickedrgb = color.rgb;
        const newColor = new TRgba(
          pickedrgb.r,
          pickedrgb.g,
          pickedrgb.b,
          pickedrgb.a
        );
        setFinalColor(newColor);
        this.setInputData(initialValueName, newColor);
        this.setOutputData(outName, newColor);
        this.executeChildren();
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
              width: `${this.nodeWidth}px`,
              height: `${this.nodeHeight}px`,
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
                width: `${this.nodeWidth - 8 * margin}px`,
                height: `${this.nodeHeight - 8 * margin}px`,
                borderRadius: `${this.nodeWidth / 4}px`,
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
              Pick a color
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
                    <ClickAwayListener
                      onClickAway={() => showColorPicker(false)}
                    >
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
    };
  }
}

export class WidgetSwitch extends HybridNode {
  update: () => void;
  onWidgetTrigger: () => void;

  getOpacity(): number {
    return 0.01;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, selectedName, new BooleanType(), false, false),
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
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

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(
        WidgetParent,
        {
          nodeWidth: this.nodeWidth,
          nodeHeight: this.nodeHeight,
          margin,
        },
        {
          overflow: 'visible',
        }
      );
      super.onNodeAdded();
    };

    this.update = (): void => {
      this.renderReactComponent(WidgetParent, {
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
        margin,
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();

      // set initial value and execute
      this.setOutputData(outName, this.getInputData(selectedName));
      this.executeChildren();
    };

    this.onWidgetTrigger = () => {
      console.log('onWidgetTrigger');
    };

    this.onNodeResize = () => {
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    const WidgetParent = (props) => {
      const [selected, setSelected] = useState(this.getInputData(selectedName));

      const handleOnChange = () => {
        this.onWidgetTrigger();
        const newValue = !selected;
        setSelected(newValue);
        // const selectedValue = this.getInputData(selectedName);
        const onValue = this.getInputData(onValueName);
        const offValue = this.getInputData(offValueName);
        this.setInputData(selectedName, newValue ? onValue : offValue);
        this.setOutputData(outName, newValue ? onValue : offValue);
        this.executeChildren();
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
              width: `${this.nodeWidth}px`,
              height: `${this.nodeHeight}px`,

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
                  value={this.getName()}
                  control={
                    <Switch
                      size="medium"
                      checked={selected}
                      color="primary"
                      onChange={handleOnChange}
                      sx={{
                        transform: 'scale(1.5)',
                        marginRight: '8px',
                      }}
                    />
                  }
                  label={this.getName()}
                  labelPlacement="end"
                />
              </FormGroup>
            </FormControl>
          </Paper>
        </ThemeProvider>
      );
    };
  }
}

export class WidgetSlider extends HybridNode {
  update: () => void;
  onWidgetTrigger: () => void;

  getOpacity(): number {
    return 0.01;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, initialValueName, new NumberType(), 0, false),
      new Socket(SOCKET_TYPE.IN, minValueName, new NumberType(), 0, false),
      new Socket(SOCKET_TYPE.IN, maxValueName, new NumberType(), 100, false),
      new Socket(SOCKET_TYPE.IN, roundName, new BooleanType(), 100, false),
      new Socket(SOCKET_TYPE.IN, stepSizeName, new NumberType(), 0.01, false),
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

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(
        WidgetParent,
        {
          nodeWidth: this.nodeWidth,
          nodeHeight: this.nodeHeight,
          margin,
          initialValue: this.getInputData(initialValueName),
          minValue: this.getInputData(minValueName),
          maxValue: this.getInputData(maxValueName),
          round: this.getInputData(roundName),
          stepSize: this.getInputData(stepSizeName),
        },
        {
          overflow: 'visible',
        }
      );
      super.onNodeAdded();
    };

    this.update = (): void => {
      this.renderReactComponent(WidgetParent, {
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
        margin,
        initialValue: this.getInputData(initialValueName),
        minValue: this.getInputData(minValueName),
        maxValue: this.getInputData(maxValueName),
        round: this.getInputData(roundName),
        stepSize: this.getInputData(stepSizeName),
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();

      // set initial value and execute
      this.setOutputData(outName, this.getInputData(initialValueName));
      this.executeChildren();
    };

    this.onWidgetTrigger = () => {
      console.log('onWidgetTrigger');
    };

    this.onNodeResize = () => {
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    const WidgetParent = (props) => {
      const [data, setData] = useState(Number(props.initialValue));
      const [minValue, setMinValue] = useState(
        Math.min(props.minValue ?? 0, data)
      );
      const [maxValue, setMaxValue] = useState(
        Math.max(props.maxValue ?? 100, data)
      );
      const [round, setRound] = useState(props.round ?? false);
      const [stepSizeValue, setStepSizeValue] = useState(
        props.stepSize ?? 0.01
      );

      useEffect(() => {
        setData(Number(props.initialValue));
        setMinValue(Math.min(props.minValue ?? 0, data));
        setMaxValue(Math.max(props.maxValue ?? 100, data));
        setRound(props.round ?? false);
        setStepSizeValue(props.stepSize ?? 0.01);
      }, [
        props.initialValue,
        props.minValue,
        props.maxValue,
        props.round,
        props.stepSize,
      ]);

      const handleOnChange = (event, value) => {
        if (!Array.isArray(value)) {
          this.onWidgetTrigger();
          setData(roundNumber(value, 4));
          this.setOutputData(outName, value);
          this.executeChildren();
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
              width: `${this.nodeWidth}px`,
              height: `${this.nodeHeight}px`,
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
                margin: `${8 * margin}px`,
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
          </Paper>
        </ThemeProvider>
      );
    };
  }
}

export class WidgetDropdown extends HybridNode {
  update: () => void;

  getOpacity(): number {
    return 0.01;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

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

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.nodeName = 'Dropdown';

    if (customArgs?.initialData) {
      console.log(customArgs?.initialData);
      this.setInputData(optionsName, customArgs?.initialData);
    }

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      const options = this.getInputData(optionsName) || defaultOptions;
      const selectedOptionRaw = this.getInputData(selectedOptionName);
      const multiSelect = this.getInputData(multiSelectName);
      const selectedOption = formatSelected(selectedOptionRaw, multiSelect);

      this.createContainerComponent(
        WidgetParent,
        {
          nodeWidth: this.nodeWidth,
          nodeHeight: this.nodeHeight,
          margin,
          name: this.nodeName,
          options,
          selectedOption,
          multiSelect,
        },
        {
          overflow: 'visible',
        }
      );
      this.setOutputData(outName, options);
      super.onNodeAdded();
    };

    this.update = (): void => {
      const options = this.getInputData(optionsName) || defaultOptions;
      const selectedOptionRaw = this.getInputData(selectedOptionName);
      const multiSelect = this.getInputData(multiSelectName);
      const selectedOption = formatSelected(selectedOptionRaw, multiSelect);

      this.renderReactComponent(WidgetParent, {
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
        margin,
        name: this.nodeName,
        options,
        selectedOption,
        multiSelect,
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();
      this.setOutputData(outName, this.getInputData(selectedOptionName));
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    type MyProps = {
      doubleClicked: boolean; // is injected by the NodeClass
      nodeWidth: number;
      nodeHeight: number;
      margin: number;
      name: string;
      options: any[];
      selectedOption: string | string[];
      multiSelect: boolean;
    };

    const WidgetParent: FunctionComponent<MyProps> = (props) => {
      const [options, setOptions] = useState<any[]>(props.options);
      const [selectedOption, setSelectedOption] = useState<string | string[]>(
        props.selectedOption
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

      const handleChange = (
        event: SelectChangeEvent<typeof selectedOption>
      ) => {
        const {
          target: { value },
        } = event;
        // single select: value is string
        // multi select: value is array of strings
        console.log(typeof value, value, props.name);
        const formattedValue = formatSelected(value, props.multiSelect);
        setSelectedOption(formattedValue);
        this.setInputData(selectedOptionName, formattedValue);
        this.setOutputData(outName, formattedValue);
        this.executeChildren();
      };

      useEffect(() => {
        this.setOutputData(outName, selectedOption);
        this.executeChildren();
      }, []);

      useEffect(() => {
        setOptions(props.options);
      }, [props.options]);

      useEffect(() => {
        setOptions(props.options);
        setSelectedOption(props.selectedOption);
        this.setInputData(selectedOptionName, props.selectedOption);
        this.setOutputData(outName, props.selectedOption);
        this.executeChildren();
      }, [props.multiSelect, props.selectedOption]);

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
              width: `${this.nodeWidth}px`,
              height: `${this.nodeHeight}px`,
              boxShadow: 16,
              '&:hover': {
                boxShadow: 12,
              },
            }}
          >
            <FormControl variant="filled" sx={{ m: 2, pointerEvents: 'auto' }}>
              <InputLabel>{props.name}</InputLabel>
              <Select
                variant="filled"
                multiple={props.multiSelect}
                value={
                  props.multiSelect && !Array.isArray(selectedOption)
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
                      {props.multiSelect && (
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
    };
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

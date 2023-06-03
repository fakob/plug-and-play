/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import {
  CheckBox,
  List,
  Button as PixiUIButton,
  Slider as PixiUISlider,
  RadioGroup,
} from '@pixi/ui';
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
  Stack,
  Select,
  SelectChangeEvent,
  Switch,
  ThemeProvider,
} from '@mui/material';
import ColorizeIcon from '@mui/icons-material/Colorize';
import { SketchPicker } from 'react-color';
import Socket from '../../classes/SocketClass';
import { WidgetBase, WidgetHybridBase } from './abstract';
import { TRgba } from '../../utils/interfaces';
import { limitRange, roundNumber } from '../../utils/utils';
import {
  NODE_MARGIN,
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
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { ActionHandler } from '../../utils/actionHandler';

const selectedName = 'Initial Selection';
const initialValueName = 'Initial Value';
const minValueName = 'Min';
const roundName = 'Round';
const maxValueName = 'Max';
const offValueName = 'Off';
const onValueName = 'On';
const labelName = 'Label';
const optionsName = 'Options';
const selectedOptionIndex = 'Selected Index';
const selectedOptionName = 'Selected Option';
const multiSelectName = 'Select multiple';
const outName = 'Out';

const foregroundColorName = 'Foreground Color';
const backgroundColorName = 'Background Color';
const textColorName = 'Text Color';

const margin = 4;

const defaultOptions = ['Option1', 'Option2', 'Option3'];

const fillWhiteHex = TRgba.white().hex();
const fillColorDarkHex = TRgba.fromString(RANDOMMAINCOLOR).darken(0.5).hex();
const fillColorHex = TRgba.fromString(RANDOMMAINCOLOR).hex();
const contrastColorHex = TRgba.fromString(RANDOMMAINCOLOR)
  .getContrastTextColor()
  .hex();

const baseStyle = {
  fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  fontSize: 16,
  letterSpacing: 0.45,
  fill: contrastColorHex,
  wordWrap: true,
};

export class WidgetButton extends WidgetBase {
  _refLabel: PIXI.Text;
  _refWidget: PixiUIButton;
  _refGraphics: PIXI.Graphics;

  private labelTextStyle = new PIXI.TextStyle({
    ...baseStyle,
    align: 'center',
    fontWeight: '500',
    fill: contrastColorHex,
  });

  public getName(): string {
    return 'Button';
  }

  public getDescription(): string {
    return 'Adds a button to trigger values';
  }

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(false, false, 1000);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(SOCKET_TYPE.IN, labelName, new StringType(), 'Button', false),
      new Socket(SOCKET_TYPE.OUT, outName, new AnyType()),
    ];
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  handleOnPointerDown = () => {
    this.onWidgetTrigger();

    this._refWidget.view.scale.x = 0.99;
    this._refWidget.view.scale.y = 0.99;
    this._refWidget.view.alpha = 0.8;
    const inputData = this.getInputData(onValueName);
    this.setOutputData(outName, inputData);
    this.executeChildren();
  };

  handleOnPointerUp = () => {
    this._refWidget.view.scale.x = 1;
    this._refWidget.view.scale.y = 1;
    this._refWidget.view.alpha = 1;
    const inputData = this.getInputData(offValueName);
    this.setOutputData(outName, inputData);
    this.executeChildren();
  };

  public onWidgetTrigger = () => {
    console.log('onWidgetTrigger');
    this.executeOptimizedChain();
  };

  public drawNodeShape(): void {
    super.drawNodeShape();

    if (this._refWidget == undefined) {
      this._refGraphics = new PIXI.Graphics();
      this._refWidget = new PixiUIButton(this._refGraphics);

      this._refGraphics.pivot.x = 0;
      this._refGraphics.pivot.y = 0;
      this._refWidget.view.x = NODE_MARGIN + 4 * margin;
      this._refWidget.view.y = 4 * margin;
      this._refWidget.onDown.connect(this.handleOnPointerDown);
      this._refWidget.onUp.connect(this.handleOnPointerUp);
      this.addChild(this._refWidget.view);

      this._refLabel = new PIXI.Text(
        String(this.getInputData(labelName)).toUpperCase(),
        this.labelTextStyle
      );
      this._refLabel.anchor.x = 0.5;
      this._refLabel.anchor.y = 0.5;
      this._refLabel.eventMode = 'none';
      this.addChild(this._refLabel);
    }

    this._refGraphics.clear();
    this._refGraphics
      .beginFill(fillColorHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 8 * margin,
        16
      );
    this._refWidget.view.width = this.nodeWidth - 8 * margin;
    this._refWidget.view.height = this.nodeHeight - 8 * margin;
    this._refLabel.x = NODE_MARGIN + this.nodeWidth / 2;
    this._refLabel.y = this.nodeHeight / 2;
    this._refLabel.style.wordWrapWidth = this.nodeWidth - 10 * margin;
  }

  public onExecute = async (input, output) => {
    const text = String(input[labelName]).toUpperCase();
    this._refLabel.text = text;
  };
}

export class WidgetRadio extends WidgetBase {
  radio: RadioGroup | undefined = undefined;

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, optionsName, new ArrayType(), ['A', 'B', 'C']),
      new Socket(
        SOCKET_TYPE.IN,
        selectedOptionIndex,
        new NumberType(true, 0, 10)
      ),
      new Socket(
        SOCKET_TYPE.IN,
        backgroundColorName,
        new ColorType(),
        new TRgba(255, 255, 255),
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        foregroundColorName,
        new ColorType(),
        new TRgba(0, 0, 0),
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        textColorName,
        new ColorType(),
        new TRgba(255, 255, 255),
        false
      ),
      new Socket(SOCKET_TYPE.OUT, selectedOptionName, new StringType()),
    ];
  }

  public getName(): string {
    return 'Radio Button';
  }

  public getDescription(): string {
    return 'Adds a radio button';
  }

  public getDefaultNodeWidth(): number {
    return 150;
  }

  public getDefaultNodeHeight(): number {
    return 150;
  }

  public drawNodeShape(): void {
    super.drawNodeShape();
    this.removeChild(this.radio);

    const inputs: [] = this.getInputData(optionsName);
    if (!Array.isArray(inputs)) {
      return;
    }

    const width = 30;
    const padding = 5;
    const textColor = this.getInputData(textColorName);

    const items: CheckBox[] = [];
    for (let i = 0; i < inputs.length; i++) {
      items.push(
        new CheckBox({
          text: inputs[i],
          style: {
            unchecked: this.drawRadio(false, width, padding),
            checked: this.drawRadio(true, width, padding),
            text: {
              fontSize: 20,
              fill: textColor,
            },
          },
        })
      );
    }

    // Component usage
    const radioGroup = new RadioGroup({
      selectedItem: Math.min(
        inputs.length - 1,
        Math.max(this.getInputData(selectedOptionIndex), 0)
      ),
      items,
      type: 'vertical',
      elementsMargin: 10,
    });

    radioGroup.x = 50;
    radioGroup.y = 50;

    radioGroup.onChange.connect((selectedItemID: number) => {
      const applyFunction = (newValue) => {
        this.setInputData(selectedOptionIndex, newValue);
        this.executeOptimizedChain();
      };
      ActionHandler.interfaceApplyValueFunction(
        this.id,
        this.getInputData(selectedOptionIndex),
        selectedItemID,
        applyFunction
      );
    });

    this.radio = radioGroup;

    this.addChild(this.radio);
  }

  drawRadio(checked, width, padding) {
    const graphics = new PIXI.Graphics().beginFill(
      this.getInputData(backgroundColorName)
    );

    graphics.drawCircle(width / 2, width / 2, width / 2);
    if (checked) {
      graphics.beginFill(this.getInputData(foregroundColorName));
      const center = width / 2;
      graphics.drawCircle(center, center, center - padding);
    }

    return graphics;
  }

  public onExecute = async (input, output) => {
    output[selectedOptionName] = input[optionsName].at(
      Math.max(
        0,
        Math.min(
          input[optionsName].length - 1,
          this.getInputData(selectedOptionIndex)
        )
      )
    );
    this.drawNodeShape();
    const preferredHeight = this.radio.height + this.radio.y * 2;
    const preferredWidth = this.radio.width + this.radio.x * 2;
    if (
      this.nodeHeight != preferredHeight ||
      this.nodeWidth != preferredWidth
    ) {
      this.resizeAndDraw(preferredWidth, preferredHeight);
    }
  };

  public allowResize(): boolean {
    return false;
  }
  public executeOnPlace(): boolean {
    return true;
  }
}

export class WidgetColorPicker extends WidgetHybridBase {
  public getName(): string {
    return 'Color picker';
  }

  public getDescription(): string {
    return 'Adds a color picker';
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

export class WidgetSwitch extends WidgetHybridBase {
  public getName(): string {
    return 'Switch';
  }

  public getDescription(): string {
    return 'Adds a switch to toggle between values';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, selectedName, new BooleanType(), false, false),
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(SOCKET_TYPE.IN, labelName, new StringType(), 'Switch', false),
      new Socket(SOCKET_TYPE.OUT, outName, new AnyType()),
    ];
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

export class WidgetSlider extends WidgetBase {
  _refLabel: PIXI.Text;
  _refValue: PIXI.Text;
  _refWidget: PixiUISlider;
  _refBg: PIXI.Graphics;
  _refFill: PIXI.Graphics;
  _refSlider: PIXI.Graphics;

  public getName(): string {
    return 'Slider';
  }

  public getDescription(): string {
    return 'Adds a number slider';
  }

  private valueTextStyle = new PIXI.TextStyle({
    ...baseStyle,
    align: 'center',
    fontWeight: '500',
    fill: fillWhiteHex,
  });

  private labelTextStyle = new PIXI.TextStyle({
    ...baseStyle,
    align: 'center',
    fontWeight: '100',
    fill: fillWhiteHex,
  });

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, initialValueName, new NumberType(), 0, false),
      new Socket(SOCKET_TYPE.IN, minValueName, new NumberType(), 0, false),
      new Socket(SOCKET_TYPE.IN, maxValueName, new NumberType(), 100, false),
      new Socket(SOCKET_TYPE.IN, roundName, new BooleanType(), 100, false),
      new Socket(SOCKET_TYPE.IN, labelName, new StringType(), 'Slider', false),
      new Socket(SOCKET_TYPE.OUT, outName, new NumberType()),
    ];
  }

  public getDefaultNodeWidth(): number {
    return 200;
  }

  public getDefaultNodeHeight(): number {
    return 104;
  }

  public drawNodeShape(): void {
    super.drawNodeShape();

    if (this._refWidget == undefined) {
      // Widget
      this._refBg = new PIXI.Graphics();
      this._refFill = new PIXI.Graphics();
      this._refSlider = new PIXI.Graphics();
      this._refWidget = new PixiUISlider({
        bg: this._refBg,
        fill: this._refFill,
        slider: this._refSlider,
        min: this.getInputData(minValueName),
        max: this.getInputData(maxValueName),
        value: this.getInputData(initialValueName),
        valueTextStyle: this.valueTextStyle,
        showValue: false,
      });
      this._refWidget.x = NODE_MARGIN + 4 * margin;
      this._refWidget.onUpdate.connect(this.handleOnChange);
      this.addChild(this._refWidget);

      // Label
      this._refLabel = new PIXI.Text(
        String(this.getInputData(labelName)),
        this.labelTextStyle
      );
      this._refLabel.anchor.x = 0.5;
      this._refLabel.anchor.y = 1;
      this._refLabel.eventMode = 'none';
      this.addChild(this._refLabel);

      // Value
      this._refValue = new PIXI.Text(
        String(this.getInputData(initialValueName)),
        this.valueTextStyle
      );
      this._refValue.anchor.x = 0.5;
      this._refValue.anchor.y = 0;
      this._refValue.y = 2 * margin;
      this._refValue.eventMode = 'none';
      this.addChild(this._refValue);
    }

    this._refWidget.progress = this.valueToPercent(
      this.getInputData(initialValueName)
    );
    this._refBg.clear();
    this._refBg
      .beginFill(fillColorDarkHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 16 * margin,
        16
      );

    this._refFill.clear();
    this._refFill
      .beginFill(fillColorHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 16 * margin,
        16
      );
    this._refWidget.y = (this.nodeHeight - (this.nodeHeight - 16 * margin)) / 2;

    this._refValue.x = NODE_MARGIN + this.nodeWidth / 2;

    this._refLabel.x = NODE_MARGIN + this.nodeWidth / 2;
    this._refLabel.y = this.nodeHeight - 2 * margin;
    this._refLabel.style.wordWrapWidth = this.nodeWidth - 10 * margin;
  }

  valueToPercent = (value) => {
    const minValue = this.getInputData(minValueName);
    const maxValue = this.getInputData(maxValueName);
    return ((value - minValue) / (maxValue - minValue)) * 100;
  };

  setOutputDataAndText = (value) => {
    const shouldRound = this.getInputData(roundName);
    const newValue = shouldRound ? Math.round(value) : value;
    this._refValue.text = roundNumber(newValue, shouldRound ? 0 : 2);
    this.setOutputData(outName, newValue);
  };

  handleOnChange = (value) => {
    const applyFunction = (newValue) => {
      this.setInputData(initialValueName, newValue);

      this.setOutputDataAndText(newValue);
      // update the slider in percent
      this._refWidget.progress = this.valueToPercent(newValue);
      this.executeChildren();
    };
    ActionHandler.interfaceApplyValueFunction(
      this.id,
      this.getInputData(initialValueName),
      value,
      applyFunction
    );
  };

  public onExecute = async (input, output) => {
    const value = input[initialValueName];
    const minValue = input[minValueName];
    const maxValue = input[maxValueName];
    this._refWidget.min = minValue;
    this._refWidget.max = maxValue;

    const text = String(input[labelName]);
    this._refLabel.text = text;

    // update the output
    this.setOutputDataAndText(limitRange(value, minValue, maxValue));
  };
}

export class WidgetDropdown extends WidgetHybridBase {
  public getName(): string {
    return 'Dropdown';
  }

  public getDescription(): string {
    return 'Adds a dropdown to select values';
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
      const applyFunction = (newValue) => {
        setSelectedOption(newValue);
        node.setInputData(selectedOptionName, newValue);
        node.setOutputData(outName, newValue);
        node.executeChildren();
      };
      ActionHandler.interfaceApplyValueFunction(
        node.id,
        selectedOption,
        formattedValue,
        applyFunction
      );
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

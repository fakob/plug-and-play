/* eslint-disable @typescript-eslint/no-empty-function */
import * as PIXI from 'pixi.js';
import {
  CheckBox,
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
  Typography,
} from '@mui/material';
import ColorizeIcon from '@mui/icons-material/Colorize';
import { SketchPicker } from 'react-color';
import Socket from '../../classes/SocketClass';
import { WidgetBase, WidgetHybridBase } from './abstract';
import { TRgba } from '../../utils/interfaces';
import {
  limitRange,
  parseValueAndAttachWarnings,
  roundNumber,
  updateDataIfDefault,
} from '../../utils/utils';
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

const buttonDefaultName = 'Button'; // dummy comment

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
    return new UpdateBehaviourClass(false, false, false, 1000, this);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(
        SOCKET_TYPE.IN,
        labelName,
        new StringType(),
        buttonDefaultName,
        false,
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
      this._ForegroundRef.addChild(this._refWidget.view);

      this._refLabel = new PIXI.Text(
        String(this.getInputData(labelName)).toUpperCase(),
        this.labelTextStyle,
      );
      this._refLabel.anchor.x = 0.5;
      this._refLabel.anchor.y = 0.5;
      this._refLabel.eventMode = 'none';
      this._ForegroundRef.addChild(this._refLabel);
    }

    const fontSize = this.nodeHeight / 6;

    this._refGraphics.clear();
    this._refGraphics
      .beginFill(fillColorHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 8 * margin,
        16,
      );
    this._refWidget.view.width = this.nodeWidth - 8 * margin;
    this._refWidget.view.height = this.nodeHeight - 8 * margin;
    this._refLabel.x = NODE_MARGIN + this.nodeWidth / 2;
    this._refLabel.y = this.nodeHeight / 2;
    this._refLabel.style.wordWrapWidth = this.nodeWidth - 10 * margin;
    this._refLabel.style.fontSize = fontSize;
  }

  public onExecute = async (input, output) => {
    const text = String(input[labelName]).toUpperCase();
    this._refLabel.text = text;
  };

  public async outputPlugged(): Promise<void> {
    const dataToUpdate =
      this.getSocketByName(outName).links[0].getTarget().name;
    updateDataIfDefault(this, labelName, buttonDefaultName, dataToUpdate);
    await super.outputPlugged();
  }
}

const radioDefaultValue = ['A', 'B', 'C'];

export class WidgetRadio extends WidgetBase {
  radio: RadioGroup | undefined = undefined;

  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(true, false, false, 1000, this);
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        optionsName,
        new ArrayType(),
        radioDefaultValue,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        selectedOptionIndex,
        new NumberType(true, 0, 10),
      ),
      new Socket(
        SOCKET_TYPE.IN,
        backgroundColorName,
        new ColorType(),
        new TRgba(255, 255, 255),
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        foregroundColorName,
        new ColorType(),
        new TRgba(0, 0, 0),
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        textColorName,
        new ColorType(),
        new TRgba(255, 255, 255),
        false,
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
    this._ForegroundRef.removeChild(this.radio);

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
          text: String(inputs[i]),
          style: {
            unchecked: this.drawRadio(false, width, padding),
            checked: this.drawRadio(true, width, padding),
            text: {
              fontSize: 20,
              fill: textColor,
            },
          },
        }),
      );
    }

    // Component usage
    const radioGroup = new RadioGroup({
      selectedItem: Math.min(
        inputs.length - 1,
        Math.max(this.getInputData(selectedOptionIndex), 0),
      ),
      items,
      type: 'vertical',
      elementsMargin: 10,
    });

    radioGroup.x = 50;
    radioGroup.y = 50;

    const id = this.id;
    radioGroup.onChange.connect((selectedItemID: number) => {
      const applyFunction = (newValue) => {
        const safeNode = ActionHandler.getSafeNode(id);
        safeNode.setInputData(selectedOptionIndex, newValue);
        safeNode.executeOptimizedChain();
      };
      ActionHandler.interfaceApplyValueFunction(
        this.id,
        this.getInputData(selectedOptionIndex),
        selectedItemID,
        applyFunction,
      );
    });

    this.radio = radioGroup;

    this._ForegroundRef.addChild(this.radio);
  }

  drawRadio(checked, width, padding) {
    const graphics = new PIXI.Graphics().beginFill(
      this.getInputData(backgroundColorName),
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
          this.getInputData(selectedOptionIndex),
        ),
      ),
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

  public async outputPlugged(): Promise<void> {
    const target =
      this.getSocketByName(selectedOptionName).links[0].getTarget();
    const data = parseValueAndAttachWarnings(
      this,
      new ArrayType(),
      target.defaultData,
    );

    if (
      JSON.stringify(radioDefaultValue) ===
      JSON.stringify(this.getInputData(optionsName))
    ) {
      this.setInputData(optionsName, data);
      this.executeOptimizedChain();
    }
    await super.outputPlugged();
  }
}

const pickerDefaultName = 'Pick a color';

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
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        labelName,
        new StringType(),
        pickerDefaultName,
        false,
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

  public async outputPlugged(): Promise<void> {
    const target = this.getSocketByName(outName).links[0].getTarget();
    const data = parseValueAndAttachWarnings(
      this,
      new ColorType(),
      target.defaultData,
    );

    if (
      pickerDefaultName === this.getInputData(labelName) &&
      RANDOMMAINCOLOR === this.getInputData(initialValueName).hex()
    ) {
      this.setInputData(initialValueName, data);
      this.setInputData(labelName, target.name);
      this.executeOptimizedChain();
    }
    await super.outputPlugged();
  }

  setFinalColor: any = () => {};

  protected getParentComponent(props: any): React.ReactElement {
    const node = props.node;
    const ref = useRef<HTMLDivElement | null>(null);
    const [finalColor, setFinalColor] = useState(
      props[initialValueName] || TRgba.white(),
    );
    const [colorPicker, showColorPicker] = useState(false);

    node.setFinalColor = setFinalColor;

    useEffect(() => {
      node.setOutputData(outName, finalColor);
      node.executeChildren();
    }, []);

    const id = node.id;
    const handleOnChange = (color) => {
      const pickedrgb = color.rgb;
      const newColor = new TRgba(
        pickedrgb.r,
        pickedrgb.g,
        pickedrgb.b,
        pickedrgb.a,
      );
      const applyFunction = (value) => {
        const safeNode = ActionHandler.getSafeNode(id) as WidgetColorPicker;
        safeNode.setFinalColor(value);
        safeNode.setInputData(initialValueName, value);
        safeNode.setOutputData(outName, value);
        safeNode.executeChildren();
      };
      applyFunction(newColor); // couldnt add this as an action as it crashes, dont know why
      /*ActionHandler.interfaceApplyValueFunction(
        node.id,
        node.getInputData(initialValueName),
        newColor,
        applyFunction
      );*/
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
              fontSize: `${node.nodeHeight / 6}px`,
              lineHeight: `${node.nodeHeight / 5}px`,
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
            <ColorizeIcon
              sx={{ pl: 0.5, fontSize: `${node.nodeHeight / 5}px` }}
            />
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

const switchDefaultData = false;
const switchDefaultName = 'Switch';

export class WidgetSwitch extends WidgetHybridBase {
  public getName(): string {
    return 'Switch';
  }

  public getDescription(): string {
    return 'Adds a switch to toggle between values';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        selectedName,
        new BooleanType(),
        switchDefaultData,
        false,
      ),
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(
        SOCKET_TYPE.IN,
        labelName,
        new StringType(),
        switchDefaultName,
        false,
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

  public async outputPlugged(): Promise<void> {
    const target = this.getSocketByName(outName).links[0].getTarget();
    if (
      switchDefaultName === this.getInputData(labelName) &&
      switchDefaultData === this.getInputData(selectedName)
    ) {
      this.setInputData(selectedName, target.defaultData);
      this.setInputData(labelName, target.name);
      this.executeOptimizedChain();
    }
    await super.outputPlugged();
  }

  // kept here to be accessed by redo undo
  setSelected: any = () => {};
  prepareAndExecute: any = () => {};

  protected getParentComponent(props: any): React.ReactElement {
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

    node.setSelected = setSelected;
    node.prepareAndExecute = prepareAndExecute;

    const handleOnChange = () => {
      const id = node.id;
      const applyAction = (value) => {
        const safeNode = ActionHandler.getSafeNode(id) as WidgetSwitch;
        safeNode.setSelected(value);
        safeNode.prepareAndExecute(value);
      };
      ActionHandler.interfaceApplyValueFunction(
        node.id,
        selected,
        !selected,
        applyAction,
      );
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
            <Stack direction="column" alignItems="center">
              <Switch
                size="medium"
                checked={selected}
                color="primary"
                onChange={handleOnChange}
                sx={{
                  transform: `scale(${node.nodeHeight / 60})`,
                  my: `${Math.pow(node.nodeHeight / 80, 2)}px`,
                }}
              />
              <Typography
                sx={{
                  mt: `${node.nodeHeight / 24}px`,
                  fontSize: `${node.nodeHeight / 6}px`,
                }}
              >
                {props[labelName]}
              </Typography>
            </Stack>
          </FormControl>
        </Paper>
      </ThemeProvider>
    );
  }
}

const sliderDefaultValue = 0;

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
      new Socket(
        SOCKET_TYPE.IN,
        initialValueName,
        new NumberType(),
        sliderDefaultValue,
        false,
      ),
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
      this._ForegroundRef.addChild(this._refWidget);

      // Label
      this._refLabel = new PIXI.Text(
        String(this.getInputData(labelName)),
        this.labelTextStyle,
      );
      this._refLabel.anchor.x = 0.5;
      this._refLabel.anchor.y = 1;
      this._refLabel.eventMode = 'none';
      this._ForegroundRef.addChild(this._refLabel);

      // Value
      this._refValue = new PIXI.Text(
        String(this.getInputData(initialValueName)),
        this.valueTextStyle,
      );
      this._refValue.anchor.x = 0.5;
      this._refValue.anchor.y = 0;
      this._refValue.y = margin;
      this._refValue.eventMode = 'none';
      this._ForegroundRef.addChild(this._refValue);
    }

    const fontSize = this.nodeHeight / 6;

    this._refBg.clear();
    this._refBg
      .beginFill(fillColorDarkHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 2 * fontSize - 8 * margin,
        16,
      );

    this._refFill.clear();
    this._refFill
      .beginFill(fillColorHex)
      .drawRoundedRect(
        0,
        0,
        this.nodeWidth - 8 * margin,
        this.nodeHeight - 2 * fontSize - 8 * margin,
        16,
      );
    this._refWidget.y =
      (this.nodeHeight - (this.nodeHeight - 2 * fontSize - 8 * margin)) / 2;

    this._refValue.x = NODE_MARGIN + this.nodeWidth / 2;
    this._refValue.style.fontSize = fontSize;

    this._refWidget.progress = this.valueToPercent(
      this.getInputData(initialValueName),
    );

    this._refLabel.x = NODE_MARGIN + this.nodeWidth / 2;
    this._refLabel.y = this.nodeHeight - margin;
    this._refLabel.style.wordWrapWidth = this.nodeWidth - 10 * margin;
    this._refLabel.style.fontSize = fontSize;
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
    const id = this.id;
    const applyFunction = (newValue) => {
      const safeNode: WidgetSlider = ActionHandler.getSafeNode(
        id,
      ) as WidgetSlider;
      safeNode.setInputData(initialValueName, newValue);

      safeNode.setOutputDataAndText(newValue);
      // update the slider in percent
      safeNode._refWidget.progress = safeNode.valueToPercent(newValue);
      safeNode.executeChildren();
    };
    ActionHandler.interfaceApplyValueFunction(
      this.id,
      this.getInputData(initialValueName),
      value,
      applyFunction,
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

  public async outputPlugged(): Promise<void> {
    const target = this.getSocketByName(outName).links[0].getTarget();
    if (
      target.dataType.constructor === new NumberType().constructor &&
      sliderDefaultValue === this.getInputData(initialValueName)
    ) {
      const { round, minValue, maxValue } = target.dataType as NumberType;
      this.setInputData(minValueName, minValue);
      this.setInputData(maxValueName, maxValue);
      this.setInputData(roundName, round);
      this.setInputData(initialValueName, target.defaultData);
      this.setInputData(labelName, target.name);
      this.executeOptimizedChain();
    }
    await super.outputPlugged();
  }
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
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        selectedOptionName,
        new StringType(),
        undefined,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        multiSelectName,
        new BooleanType(),
        false,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        labelName,
        new StringType(),
        'Dropdown',
        false,
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

  public async outputPlugged(): Promise<void> {
    const target = this.getSocketByName(outName).links[0].getTarget();
    const data = parseValueAndAttachWarnings(
      this,
      new ArrayType(),
      target.defaultData,
    );

    if (
      JSON.stringify(defaultOptions) ===
      JSON.stringify(this.getInputData(optionsName))
    ) {
      this.setInputData(optionsName, data);
      this.setInputData(labelName, target.name);
      this.executeOptimizedChain();
    }
    await super.outputPlugged();
  }

  setSelectedOption: any = () => {};

  protected getParentComponent(props: any): React.ReactElement {
    const node = props.node;
    const [options, setOptions] = useState<any[]>(props[optionsName]);
    const [selectedOption, setSelectedOption] = useState<string | string[]>(
      formatSelected(props[selectedOptionName], props[multiSelectName]),
    );
    node.setSelectedOption = setSelectedOption;

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
      const id = node.id;
      const applyFunction = (newValue) => {
        const safeNode = ActionHandler.getSafeNode(id) as WidgetDropdown;
        safeNode.setSelectedOption(newValue);
        safeNode.setInputData(selectedOptionName, newValue);
        safeNode.setOutputData(outName, newValue);
        safeNode.executeChildren();
      };
      ActionHandler.interfaceApplyValueFunction(
        node.id,
        selectedOption,
        formattedValue,
        applyFunction,
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
        props[multiSelectName],
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
  multiSelect: boolean,
): string | string[] => {
  console.log(selected, typeof selected);
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

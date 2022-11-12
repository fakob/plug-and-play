/* eslint-disable @typescript-eslint/no-empty-function */

import React, { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Slider,
  Stack,
  Switch,
  ThemeProvider,
} from '@mui/material';
import Socket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import { CustomArgs } from '../../utils/interfaces';
import { SOCKET_TYPE, customTheme } from '../../utils/constants';
import { roundNumber } from '../../utils/utils';
import { AnyType } from '../datatypes/anyType';
import { BooleanType } from '../datatypes/booleanType';
import { NumberType } from '../datatypes/numberType';
import { StringType } from '../datatypes/stringType';
import HybridNode from '../../classes/HybridNode';

const selectedName = 'Initial selection';
const initialValueName = 'Initial value';
const minValueName = 'Min';
const roundName = 'Round';
const stepSizeName = 'Step size';
const maxValueName = 'Max';
const offValueName = 'Off';
const onValueName = 'On';
const buttonTextName = 'Button text';
const outName = 'Out';

const margin = 4;

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

    this.name = 'Button';

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

    const WidgetParent: React.FunctionComponent<MyProps> = (props) => {
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

    this.name = 'Switch';

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
                  value={this.name}
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
                  label={this.name}
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

    this.name = 'Slider';

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

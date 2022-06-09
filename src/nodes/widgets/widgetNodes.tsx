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
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import { CustomArgs } from '../../utils/interfaces';
import { SOCKET_TYPE, customTheme } from '../../utils/constants';
import { roundNumber } from '../../utils/utils';
import { AnyType } from '../datatypes/anyType';
import { BooleanType } from '../datatypes/booleanType';
import { NumberType } from '../datatypes/numberType';

const selectedName = 'Initial selection';
const initialValueName = 'Initial value';
const minValueName = 'Min';
const roundName = 'Round';
const stepSizeName = 'Step size';
const maxValueName = 'Max';
const offValueName = 'Off';
const onValueName = 'On';
const outName = 'Out';

export class WidgetButton extends PPNode {
  update: () => void;
  onWidgetTrigger: () => void;

  protected getIsHybrid(): boolean {
    return true;
  }

  protected getActivateByDoubleClick(): boolean {
    return false;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(SOCKET_TYPE.OUT, outName, new AnyType()),
    ];
  }

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 200;
    const nodeHeight = 104;
    const margin = 4;

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
    });

    this.name = 'Button';
    this.description = 'Adds a button to trigger values';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(
        document,
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
    };

    this.onWidgetTrigger = () => {
      console.log('onWidgetTrigger');
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.container.style.width = `${
        this.nodeWidth - (2 * margin) / this.graph.viewport.scale.x
      }px`;
      this.container.style.height = `${
        this.nodeHeight - (2 * margin) / this.graph.viewport.scale.x
      }px`;
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    const WidgetParent = (props) => {
      const handleOnPointerDown = () => {
        const inputData = this.getInputData(onValueName);
        this.setOutputData(outName, inputData);
        this.executeChildren();
      };

      const handleOnPointerUp = () => {
        const inputData = this.getInputData(offValueName);
        this.setOutputData(outName, inputData);
        this.executeChildren();
        console.log(props.randomMainColor);
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
              height: `${
                this.nodeHeight - (2 * margin) / this.graph.viewport.scale.x
              }px`,
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
                border: 0,
                width: `${
                  this.nodeWidth - (8 * margin) / this.graph.viewport.scale.x
                }px`,
                height: `${
                  this.nodeHeight - (8 * margin) / this.graph.viewport.scale.x
                }px`,
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
              {this.name}
            </Button>
          </Paper>
        </ThemeProvider>
      );
    };
  }
}

export class WidgetSwitch extends PPNode {
  update: () => void;
  onWidgetTrigger: () => void;

  protected getIsHybrid(): boolean {
    return true;
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

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 200;
    const nodeHeight = 104;
    const margin = 4;

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
    });

    this.name = 'Switch';
    this.description = 'Adds a switch to toggle between values';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(
        document,
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
    };

    this.onWidgetTrigger = () => {
      console.log('onWidgetTrigger');
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.container.style.width = `${
        this.nodeWidth - (2 * margin) / this.graph.viewport.scale.x
      }px`;
      this.container.style.height = `${
        this.nodeHeight - (2 * margin) / this.graph.viewport.scale.x
      }px`;
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    const WidgetParent = (props) => {
      const [selected, setSelected] = useState(this.getInputData(selectedName));

      const handleOnChange = () => {
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
              height: `${
                this.nodeHeight - (2 * margin) / this.graph.viewport.scale.x
              }px`,
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

export class WidgetSlider extends PPNode {
  update: () => void;
  onWidgetTrigger: () => void;

  protected getIsHybrid(): boolean {
    return true;
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

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 200;
    const nodeHeight = 104;
    const margin = 4;

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
    });

    this.name = 'Slider';
    this.description = 'Adds a number slider';

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      this.createContainerComponent(
        document,
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
    };

    this.update = (): void => {
      console.log('update');
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
    };

    this.onWidgetTrigger = () => {
      console.log('onWidgetTrigger');
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.container.style.width = `${
        this.nodeWidth - (2 * margin) / this.graph.viewport.scale.x
      }px`;
      this.container.style.height = `${
        this.nodeHeight - (2 * margin) / this.graph.viewport.scale.x
      }px`;
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    const WidgetParent = (props) => {
      console.log(props);
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
        console.log(value);
        if (!Array.isArray(value)) {
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
              height: `${
                this.nodeHeight - (2 * margin) / this.graph.viewport.scale.x
              }px`,
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
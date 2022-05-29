import React from 'react';
import {
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  Switch,
  ThemeProvider,
} from '@mui/material';
import PPNode from '../../classes/NodeClass';
import Socket from '../../classes/SocketClass';
import PPGraph from '../../classes/GraphClass';
import { CustomArgs } from '../../utils/interfaces';
import { SOCKET_TYPE, customTheme } from '../../utils/constants';
import { AnyType } from '../datatypes/anyType';
import { BooleanType } from '../datatypes/booleanType';

const selectedName = 'Initial selection';
const onValueName = 'On';
const offValueName = 'Off';
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
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
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
      this.container.style.pointerEvents = 'auto';
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
      console.log(props, props.nodeWidth);
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

export class WidgetToggle extends PPNode {
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
      new Socket(SOCKET_TYPE.IN, onValueName, new AnyType(), 1, false),
      new Socket(SOCKET_TYPE.IN, offValueName, new AnyType(), 0, false),
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

    this.name = 'Toggle';
    this.description = 'Adds a toggle to switch between values';

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
      this.container.style.pointerEvents = 'auto';
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
      const [selected, setSelected] = React.useState(
        this.getInputData(selectedName)
      );

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
            <FormControl component="fieldset" sx={{ margin: 'auto' }}>
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

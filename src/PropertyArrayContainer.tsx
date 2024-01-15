import React, { useEffect, useState } from 'react';
import useInterval from 'use-interval';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import styles from './utils/style.module.css';
import { getLoadNodeExampleURL } from './utils/utils';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { SourceContent } from './SourceContent';
import { SocketContainer } from './SocketContainer';
import InterfaceController, { ListenEvent } from './InterfaceController';

type FilterContentProps = {
  handleFilter: (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
  ) => void;
  filter: string;
  selectedNode: PPNode;
  selectedNodes: PPNode[];
};

function FilterContainer(props: FilterContentProps) {
  return (
    <ToggleButtonGroup
      value={props.filter}
      exclusive
      fullWidth
      onChange={props.handleFilter}
      aria-label="socket filter"
      size="small"
      sx={{ bgcolor: 'background.paper', borderRadius: '0px' }}
    >
      <ToggleButton
        id="inspector-filter-common"
        value="common"
        aria-label="common"
      >
        Common
      </ToggleButton>
      {props.selectedNodes.length === 1 &&
        props.selectedNode.nodeTriggerSocketArray.length > 0 && (
          <ToggleButton
            id="inspector-filter-trigger"
            value="trigger"
            aria-label="trigger"
          >
            Trigger
          </ToggleButton>
        )}
      {props.selectedNodes.length === 1 && (
        <ToggleButton
          id="inspector-filter-in"
          value="in"
          aria-label="in"
          disabled={props.selectedNode.inputSocketArray.length <= 0}
        >
          In
        </ToggleButton>
      )}
      {props.selectedNodes.length === 1 && (
        <ToggleButton
          id="inspector-filter-out"
          value="out"
          aria-label="out"
          disabled={props.selectedNode.outputSocketArray.length <= 0}
        >
          Out
        </ToggleButton>
      )}
      {props.selectedNodes.length === 1 && (
        <ToggleButton id="inspector-filter-info" value="info" aria-label="info">
          Info
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
}

type CommonContentProps = {
  hasTriggerSocket: boolean;
  load: boolean;
  update: boolean;
  interval: boolean;
  intervalFrequency: number;
  onCheckboxChange: (event) => void;
  onFrequencyChange: (event) => void;
  onUpdateNow: (event) => void;
};

function CommonContent(props: CommonContentProps) {
  return (
    <Box id="inspector-common-content" sx={{ bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2, py: 1.5, color: 'text.primary' }}>Update behaviour</Box>
      <FormGroup
        sx={{
          p: 1,
          bgcolor: 'background.default',
        }}
      >
        <FormGroup>
          <Button
            variant="contained"
            onClick={props.onUpdateNow}
            data-cy="update-now-button"
          >
            Update now
          </Button>
        </FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              name="load"
              checked={props.load}
              indeterminate={props.load === null}
              onChange={props.onCheckboxChange}
            />
          }
          label="Update on load"
        />
        <FormControlLabel
          control={
            <Checkbox
              name="update"
              checked={props.update}
              indeterminate={props.update === null}
              onChange={props.onCheckboxChange}
            />
          }
          label="Update on change"
        />
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                name="interval"
                checked={props.interval}
                indeterminate={props.interval === null}
                onChange={props.onCheckboxChange}
              />
            }
            label="Update on interval (in ms)"
          />
          <TextField
            id="frequency"
            variant="filled"
            label="Frequency"
            disabled={!props.interval}
            inputProps={{
              type: 'number',
              inputMode: 'numeric',
            }}
            onChange={props.onFrequencyChange}
            value={
              props.intervalFrequency === null
                ? ''
                : props.intervalFrequency.toString()
            }
          />
        </FormGroup>
        {props.hasTriggerSocket && (
          <FormControlLabel
            disabled
            control={
              <Checkbox
                name="trigger"
                checked={true}
                onChange={props.onCheckboxChange}
              />
            }
            label="Update on trigger"
          />
        )}
      </FormGroup>
    </Box>
  );
}

function socketArrayToComponent(
  socketToInspect: Socket,
  sockets: Socket[],
  props: PropertyArrayContainerProps,
  text: string,
  filter: string,
  value: string,
) {
  {
    return (
      (filter === value || filter == null) && (
        <Box sx={{ bgcolor: 'background.paper' }}>
          {filter == null && (
            <Box sx={{ px: 2, py: 1.5, color: 'text.primary' }}>{text}</Box>
          )}
          <Stack spacing={1}>
            {sockets
              .filter((socket) => socket.visibilityCondition())
              .map((property, index) => {
                return (
                  <SocketContainer
                    triggerScrollIntoView={socketToInspect === property}
                    key={index}
                    property={property}
                    index={index}
                    dataType={property.dataType}
                    isInput={property.isInput()}
                    hasLink={property.hasLink()}
                    data={property.data}
                    randomMainColor={props.randomMainColor}
                    selectedNode={
                      props.selectedNodes.length > 0
                        ? props.selectedNodes[0]
                        : null
                    }
                  />
                );
              })}
          </Stack>
        </Box>
      )
    );
  }
}

type InfoContentProps = {
  selectedNode: PPNode;
};

function InfoContent(props: InfoContentProps) {
  return (
    <Stack spacing={1}>
      <Box id="inspector-info-content" sx={{ bgcolor: 'background.paper' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1,
          }}
        >
          <Box sx={{ color: 'text.primary' }}>Description</Box>
          {props.selectedNode.hasExample() && (
            <IconButton
              sx={{
                borderRadius: 0,
                right: '0px',
                fontSize: '16px',
                padding: 0,
                height: '24px',
                lineHeight: '150%',
              }}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                window.open(
                  getLoadNodeExampleURL(props.selectedNode.type),
                  '_blank',
                );
              }}
              title="Open node example"
              className={styles.menuItemButton}
            >
              <Box
                sx={{
                  color: 'text.secondary',
                  fontSize: '10px',
                  px: 0.5,
                }}
              >
                Open example
              </Box>
              <OpenInNewIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          )}
        </Box>
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          {props.selectedNode.getDescription()}
          <Box
            sx={{
              lineHeight: '150%',
            }}
            dangerouslySetInnerHTML={{
              __html: props.selectedNode.getAdditionalDescription(),
            }}
          />
        </Box>
        <Box
          sx={{
            px: 2,
            pb: 2,
            bgcolor: 'background.default',
            textAlign: 'right',
          }}
        >
          {props.selectedNode.getTags()?.map((part, index) => (
            <Box
              key={index}
              sx={{
                fontSize: '12px',
                background: 'rgba(255,255,255,0.2)',
                cornerRadius: '4px',
                px: 0.5,
                display: 'inline',
              }}
            >
              {part}
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}

type PropertyArrayContainerProps = {
  selectedNodes: PPNode[];
  socketToInspect: Socket;
  setSocketToInspect: React.Dispatch<React.SetStateAction<Socket>>;
  randomMainColor: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
};

function getVisibleIDs(socketArray: Socket[]): string[] {
  return socketArray
    .filter((socket) => socket.visibilityCondition())
    .map((socket) => socket.name);
}

function getSocketsCurrentlyRendered(node: PPNode): string[] {
  const inputs = getVisibleIDs(node.inputSocketArray);
  const outputs = getVisibleIDs(node.outputSocketArray);
  const triggers = getVisibleIDs(node.nodeTriggerSocketArray);
  return inputs.concat(outputs).concat(triggers);
}

export const PropertyArrayContainer: React.FunctionComponent<
  PropertyArrayContainerProps
> = (props) => {
  const [dragging, setIsDragging] = useState(
    PPGraph.currentGraph.selection.isDraggingSelection,
  );

  const singleNode = props.selectedNodes.length ? props.selectedNodes[0] : null;
  const [selectedNode, setSelectedNode] = useState(singleNode);

  function switchFilterBasedOnSelectedSocket(socket: Socket) {
    if (socket) {
      props.setFilter(socket.socketType);
    }
  }

  useEffect(() => {
    const id = InterfaceController.addListener(
      ListenEvent.SelectionDragging,
      setIsDragging,
    );
    return () => {
      InterfaceController.removeListener(id);
    };
  }, []);

  useEffect(() => {
    const newSelectedNode =
      props.selectedNodes.length > 0 ? props.selectedNodes?.[0] : null;
    setSelectedNode(newSelectedNode);
    setUpdatebehaviour(getUpdateBehaviourStateForArray());
    switchFilterBasedOnSelectedSocket(props.socketToInspect);
  }, [props.selectedNodes]);

  useEffect(() => {
    switchFilterBasedOnSelectedSocket(props.socketToInspect);
  }, [props.socketToInspect]);

  const handleFilter = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
  ) => {
    props.setSocketToInspect(undefined);
    props.setFilter(newFilter);
  };

  // returns null for a specific property,
  // if its value is not the same throughout the array
  // else it returns the value
  const getUpdateBehaviourStateForArray = () => {
    const isPropertyUniform = (property) => {
      return props.selectedNodes.every(
        (node) =>
          node.updateBehaviour[property] ===
          props.selectedNodes[0].updateBehaviour[property],
      );
    };

    const areAllLoadsTheSame = isPropertyUniform('load');
    const areAllUpdatesTheSame = isPropertyUniform('update');
    const areAllIntervalsTheSame = isPropertyUniform('interval');
    const areAllFrequenciesTheSame = isPropertyUniform('intervalFrequency');

    const firstNodeUpdateBehaviour = props.selectedNodes[0].updateBehaviour;
    const updateBehaviourObject = {
      load: areAllLoadsTheSame ? firstNodeUpdateBehaviour.load : null,
      update: areAllUpdatesTheSame ? firstNodeUpdateBehaviour.update : null,
      interval: areAllIntervalsTheSame
        ? firstNodeUpdateBehaviour.interval
        : null,
      intervalFrequency: areAllFrequenciesTheSame
        ? firstNodeUpdateBehaviour.intervalFrequency
        : null,
    };

    return updateBehaviourObject;
  };

  const [updateBehaviour, setUpdatebehaviour] = useState(
    getUpdateBehaviourStateForArray(),
  );

  const onCheckboxChange = (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    const name = (event.target as HTMLInputElement).name;
    props.selectedNodes.forEach((selectedNode) => {
      selectedNode.updateBehaviour[event.target.name] = checked;
    });
    setUpdatebehaviour((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  const onFrequencyChange = (event) => {
    const value = (event.target as HTMLInputElement).value;
    props.selectedNodes.forEach((selectedNode) => {
      selectedNode.updateBehaviour.intervalFrequency = parseInt(value);
    });
    setUpdatebehaviour((prevState) => ({
      ...prevState,
      intervalFrequency: parseInt(value),
    }));
  };

  const onUpdateNow = () => {
    props.selectedNodes.forEach((selectedNode) => {
      selectedNode.executeOptimizedChain();
    });
  };

  const [socketsCurrentlyRendered, setSocketsCurrentlyRendered] = useState(
    getSocketsCurrentlyRendered(singleNode),
  );

  useInterval(() => {
    const newVal = getSocketsCurrentlyRendered(singleNode);
    if (newVal.toString() != socketsCurrentlyRendered.toString()) {
      setSocketsCurrentlyRendered(newVal);
    }
  }, 100);

  return (
    !dragging && (
      <Box sx={{ width: '100%', m: 1 }}>
        <FilterContainer
          handleFilter={handleFilter}
          filter={props.filter}
          selectedNode={selectedNode}
          selectedNodes={props.selectedNodes}
        />
        <Stack
          spacing={1}
          sx={{
            mt: 1,
            overflow: 'auto',
            height: 'calc(100vh - 120px)',
          }}
        >
          {(props.selectedNodes.length !== 1 ||
            props.filter === 'common' ||
            props.filter == null) && (
            <CommonContent
              hasTriggerSocket={selectedNode.nodeTriggerSocketArray.length > 0}
              load={updateBehaviour.load}
              update={updateBehaviour.update}
              interval={updateBehaviour.interval}
              intervalFrequency={updateBehaviour.intervalFrequency}
              onCheckboxChange={onCheckboxChange}
              onFrequencyChange={onFrequencyChange}
              onUpdateNow={onUpdateNow}
            />
          )}
          {props.selectedNodes.length === 1 && (
            <>
              {socketArrayToComponent(
                props.socketToInspect,
                selectedNode.nodeTriggerSocketArray,
                props,
                'Triggers',
                props.filter,
                'trigger',
              )}
              {socketArrayToComponent(
                props.socketToInspect,
                selectedNode.inputSocketArray,
                props,
                'Inputs',
                props.filter,
                'in',
              )}
              {socketArrayToComponent(
                props.socketToInspect,
                selectedNode.outputSocketArray,
                props,
                'Outputs',
                props.filter,
                'out',
              )}
              {((props.selectedNodes.length === 1 && props.filter === 'info') ||
                props.filter == null) && (
                <Stack spacing={1}>
                  <InfoContent selectedNode={selectedNode} />
                  <SourceContent
                    header="Config"
                    editable={true}
                    source={selectedNode}
                    randomMainColor={props.randomMainColor}
                  />
                  <SourceContent
                    header="Class"
                    editable={false}
                    source={selectedNode.getSourceCode()}
                    randomMainColor={props.randomMainColor}
                  />
                </Stack>
              )}
              <Box sx={{ m: 1 }} />
            </>
          )}
        </Stack>
      </Box>
    )
  );
};

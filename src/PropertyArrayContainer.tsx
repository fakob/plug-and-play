import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  getCircularReplacer,
  getNodeExampleURL,
  writeTextToClipboard,
} from './utils/utils';
import { SerializedNode, SerializedSelection } from './utils/interfaces';
import { PP_VERSION } from './utils/constants';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { SocketContainer } from './SocketContainer';
import { CodeEditor } from './components/Editor';
import InterfaceController, { ListenEvent } from './InterfaceController';
import useInterval from 'use-interval';

function getConfigData(selectedNode) {
  return JSON.stringify(selectedNode?.serialize(), getCircularReplacer(), 2);
}

type FilterContentProps = {
  handleFilter: (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
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
      {props.selectedNodes.length === 1 && (
        <ToggleButton value="info" aria-label="info">
          Info
        </ToggleButton>
      )}
      <ToggleButton value="common" aria-label="common">
        Common
      </ToggleButton>
      {props.selectedNodes.length === 1 &&
        props.selectedNode.nodeTriggerSocketArray.length > 0 && (
          <ToggleButton value="trigger" aria-label="trigger">
            Trigger
          </ToggleButton>
        )}
      {props.selectedNodes.length === 1 && (
        <ToggleButton
          value="in"
          aria-label="in"
          disabled={props.selectedNode.inputSocketArray.length <= 0}
        >
          In
        </ToggleButton>
      )}
      {props.selectedNodes.length === 1 && (
        <ToggleButton
          value="out"
          aria-label="out"
          disabled={props.selectedNode.outputSocketArray.length <= 0}
        >
          Out
        </ToggleButton>
      )}
      {props.selectedNodes.length === 1 && (
        <ToggleButton value="source" aria-label="source">
          Source
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
}

type InfoContentProps = {
  selectedNode: PPNode;
};

function InfoContent(props: InfoContentProps) {
  return (
    <Stack spacing={1}>
      <Box sx={{ bgcolor: 'background.paper' }}>
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
              window.open(getNodeExampleURL(props.selectedNode.type), '_blank');
            }}
            title="Open node example"
            className="menuItemButton"
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

type CommonContentProps = {
  hasTriggerSocket: boolean;
  interval: boolean;
  intervalFrequency: number;
  update: boolean;
  onCheckboxChange: (event) => void;
  onFrequencyChange: (event) => void;
  onUpdateNow: (event) => void;
};

function CommonContent(props: CommonContentProps) {
  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2, py: 1.5, color: 'text.primary' }}>Update behaviour</Box>
      <FormGroup
        sx={{
          p: 1,
          bgcolor: 'background.default',
        }}
      >
        <FormGroup>
          <Button variant="contained" onClick={props.onUpdateNow}>
            Update now
          </Button>
        </FormGroup>
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
  value: string
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

type SourceContentProps = {
  header: string;
  editable: boolean;
  sourceCode: string;
  randomMainColor: string;
  onChange?: (value) => void;
  selectedNode?: PPNode;
};

function SourceContent(props: SourceContentProps) {
  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <Box
        sx={{
          flexGrow: 1,
          display: 'inline-flex',
          alignItems: 'center',
          py: 1,
        }}
      >
        <Box sx={{ pl: 2, color: 'text.primary' }}>{props.header}</Box>
        {!props.editable && (
          <LockIcon sx={{ pl: '2px', fontSize: '16px', opacity: 0.5 }} />
        )}
        <IconButton
          size="small"
          onClick={() => writeTextToClipboard(props.sourceCode)}
        >
          <ContentCopyIcon sx={{ pl: 1, fontSize: '16px' }} />
        </IconButton>
      </Box>
      <CodeEditor
        value={props.sourceCode}
        randomMainColor={props.randomMainColor}
        editable={props.editable}
        onChange={props.onChange}
      />
      {props.onChange && (
        <Box
          sx={{
            m: 1,
          }}
        >
          <ButtonGroup variant="outlined" size="small" fullWidth>
            <Button
              onClick={() => {
                const sourceCode = props.sourceCode;
                const newSerializedNode = JSON.parse(
                  sourceCode
                ) as SerializedNode;
                PPGraph.currentGraph.action_ReplaceNode(
                  props.selectedNode.serialize(),
                  newSerializedNode
                );
              }}
            >
              Replace
            </Button>
            <Button
              onClick={() => {
                const sourceCode = props.sourceCode;
                const newSerializedSelection = JSON.parse(
                  `{"version": ${PP_VERSION},"nodes": [${sourceCode}],"links": []}`
                ) as SerializedSelection;
                PPGraph.currentGraph.pasteNodes(newSerializedSelection);
              }}
            >
              Create new
            </Button>
          </ButtonGroup>
        </Box>
      )}
    </Box>
  );
}

type PropertyArrayContainerProps = {
  selectedNodes: PPNode[];
  socketToInspect: Socket;
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
    false
    // PPGraph.currentGraph.selection.isDraggingSelection
  );

  const singleNode = props.selectedNodes.length ? props.selectedNodes[0] : null;
  const [selectedNode, setSelectedNode] = useState(singleNode);

  const [configData, setConfigData] = useState(getConfigData(singleNode));

  function switchFilterBasedOnSelectedSocket(socket: Socket) {
    if (socket) {
      props.setFilter(socket.socketType);
    }
  }

  useEffect(() => {
    const id = InterfaceController.addListener(
      ListenEvent.SelectionDragging,
      setIsDragging
    );
    return () => {
      InterfaceController.removeListener(id);
    };
  });

  useEffect(() => {
    const newSelectedNode =
      props.selectedNodes.length > 0 ? props.selectedNodes?.[0] : null;
    setSelectedNode(newSelectedNode);
    setConfigData(getConfigData(newSelectedNode));
    setUpdatebehaviour(getUpdateBehaviourStateForArray());
    switchFilterBasedOnSelectedSocket(props.socketToInspect);
  }, [props.selectedNodes]);

  useEffect(() => {
    switchFilterBasedOnSelectedSocket(props.socketToInspect);
  }, [props.socketToInspect]);

  const handleFilter = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    props.setFilter(newFilter);
  };

  // returns null for a specific property,
  // if its value is not the same throughout the array
  // else it returns the value
  const getUpdateBehaviourStateForArray = () => {
    const areAllIntervalsTheSame = props.selectedNodes.every(
      (node) =>
        node.updateBehaviour.interval ===
        props.selectedNodes[0].updateBehaviour.interval
    );
    const areAllFrequenciesTheSame = props.selectedNodes.every(
      (node) =>
        node.updateBehaviour.intervalFrequency ===
        props.selectedNodes[0].updateBehaviour.intervalFrequency
    );
    const areAllUpdatesTheSame = props.selectedNodes.every(
      (node) =>
        node.updateBehaviour.update ===
        props.selectedNodes[0].updateBehaviour.update
    );
    const updateBehaviourObject = {
      interval: areAllIntervalsTheSame
        ? props.selectedNodes[0].updateBehaviour.interval
        : null,
      intervalFrequency: areAllFrequenciesTheSame
        ? props.selectedNodes[0].updateBehaviour.intervalFrequency
        : null,
      update: areAllUpdatesTheSame
        ? props.selectedNodes[0].updateBehaviour.update
        : null,
    };
    return updateBehaviourObject;
  };

  const [updateBehaviour, setUpdatebehaviour] = useState(
    getUpdateBehaviourStateForArray()
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

  const onUpdateNow = (event) => {
    props.selectedNodes.forEach((selectedNode) => {
      selectedNode.executeOptimizedChain();
    });
  };

  const [socketsCurrentlyRendered, setSocketsCurrentlyRendered] = useState(
    getSocketsCurrentlyRendered(singleNode)
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
            height: 'calc(100vh - 100px)',
          }}
        >
          {props.selectedNodes.length === 1 &&
            (props.filter === 'info' || props.filter == null) && (
              <InfoContent selectedNode={selectedNode} />
            )}
          {(props.selectedNodes.length !== 1 ||
            props.filter === 'common' ||
            props.filter == null) && (
            <CommonContent
              hasTriggerSocket={selectedNode.nodeTriggerSocketArray.length > 0}
              interval={updateBehaviour.interval}
              intervalFrequency={updateBehaviour.intervalFrequency}
              update={updateBehaviour.update}
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
                'trigger'
              )}
              {socketArrayToComponent(
                props.socketToInspect,
                selectedNode.inputSocketArray,
                props,
                'Inputs',
                props.filter,
                'in'
              )}
              {socketArrayToComponent(
                props.socketToInspect,
                selectedNode.outputSocketArray,
                props,
                'Outputs',
                props.filter,
                'out'
              )}
              {(props.filter === 'source' || props.filter == null) && (
                <Stack spacing={1}>
                  <SourceContent
                    header="Config"
                    editable={true}
                    sourceCode={configData}
                    randomMainColor={props.randomMainColor}
                    onChange={(value) => {
                      setConfigData(value);
                    }}
                    selectedNode={selectedNode}
                  />
                  <SourceContent
                    header="Class"
                    editable={false}
                    sourceCode={selectedNode.getSourceCode()}
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

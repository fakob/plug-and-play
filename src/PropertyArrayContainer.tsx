import React, { useEffect, useState } from 'react';
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
import LockIcon from '@mui/icons-material/Lock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { hri } from 'human-readable-ids';
import { getCircularReplacer, writeTextToClipboard } from './utils/utils';
import { SerializedNode } from './utils/interfaces';
import { PP_VERSION } from './utils/constants';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { SocketContainer } from './SocketContainer';
import { CodeEditor } from './components/Editor';
import InterfaceController, { ListenEvent } from './InterfaceController';

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
  sockets: Socket[],
  props: PropertyArrayContainerProps,
  text: string,
  filter: string,
  value: string
) {
  {
    return (
      (filter === value || filter == null) &&
      sockets?.length > 0 && (
        <Box sx={{ bgcolor: 'background.paper' }}>
          {filter == null && (
            <Box sx={{ px: 2, py: 1.5, color: 'text.primary' }}>{text}</Box>
          )}
          <Stack spacing={1}>
            {sockets.map((property, index) => {
              return (
                <SocketContainer
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
  nodeId?: string;
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
          onClick={() =>
            writeTextToClipboard(
              `{"version": ${PP_VERSION},"nodes": [${props.sourceCode}],"links": []}`
            )
          }
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
        <Button
          onClick={() => {
            const sourceCode = props.sourceCode;
            const serialized = JSON.parse(sourceCode) as SerializedNode;
            PPGraph.currentGraph.replaceNode(
              serialized,
              props.nodeId,
              hri.random(),
              undefined,
              true
            );
          }}
        >
          Save and replace
        </Button>
      )}
    </Box>
  );
}

type PropertyArrayContainerProps = {
  selectedNodes: PPNode[];
  randomMainColor: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
};

export const PropertyArrayContainer: React.FunctionComponent<
  PropertyArrayContainerProps
> = (props) => {
  const [dragging, setIsDragging] = useState(
    false
    // PPGraph.currentGraph.selection.isDraggingSelection
  );

  const singleNode =
    props.selectedNodes.length > 0 ? props.selectedNodes?.[0] : null;
  const [selectedNode, setSelectedNode] = useState(singleNode);

  const [configData, setConfigData] = useState(getConfigData(singleNode));

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
    console.log('node selection changed');
    const newSelectedNode =
      props.selectedNodes.length > 0 ? props.selectedNodes?.[0] : null;
    setSelectedNode(newSelectedNode);
    setConfigData(getConfigData(newSelectedNode));
    setUpdatebehaviour(getUpdateBehaviourStateForArray());
  }, [props.selectedNodes]);

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
                selectedNode.nodeTriggerSocketArray,
                props,
                'Triggers',
                props.filter,
                'trigger'
              )}
              {socketArrayToComponent(
                selectedNode.inputSocketArray,
                props,
                'Inputs',
                props.filter,
                'in'
              )}
              {socketArrayToComponent(
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
                    nodeId={selectedNode.id}
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

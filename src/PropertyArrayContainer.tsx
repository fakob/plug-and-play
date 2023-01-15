import React, { useEffect, useState } from 'react';
import Color from 'color';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  getCircularReplacer,
  writeDataToClipboard,
  writeTextToClipboard,
} from './utils/utils';
import { PP_VERSION } from './utils/constants';
import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { AbstractType } from './nodes/datatypes/abstractType';
import { allDataTypes } from './nodes/datatypes/dataTypesMap';
import { CodeEditor } from './components/Editor';
import InterfaceController, { ListenEvent } from './InterfaceController';
import PPGraph from './classes/GraphClass';

function FilterContainer(props) {
  return (
    <ToggleButtonGroup
      value={props.filter}
      exclusive
      fullWidth
      onChange={props.handleFilter}
      aria-label="socket filter"
      size="small"
      sx={{ bgcolor: 'background.default' }}
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

function CommonContent(props) {
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
              indeterminate={props.update === ''}
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
                indeterminate={props.interval === ''}
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
            value={props.intervalFrequency.toString()}
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

function SourceContent(props) {
  console.log(props.sourceCode.slice(0, 50));
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
        maxStringLength={1000}
      />
      <Button
        onClick={() => {
          console.log('save and reload');
        }}
      >
        Save and reload
      </Button>
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
    PPGraph.currentGraph.selection.isDraggingSelection
  );
  const [selectedNode, setSelectedNode] = useState(
    props.selectedNodes.length > 0 ? props.selectedNodes?.[0] : null
  );

  const [configData, setConfigData] = useState(
    JSON.stringify(selectedNode?.serialize(), getCircularReplacer(), 2)
  );

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
    setConfigData(
      JSON.stringify(newSelectedNode?.serialize(), getCircularReplacer(), 2)
    );
  }, [props.selectedNodes]);

  useEffect(() => {
    // console.log('configData changed', configData);
  }, [configData]);

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
        : '',
      intervalFrequency: areAllFrequenciesTheSame
        ? props.selectedNodes[0].updateBehaviour.intervalFrequency
        : '',
      update: areAllUpdatesTheSame
        ? props.selectedNodes[0].updateBehaviour.update
        : '',
    };
    return updateBehaviourObject;
  };

  const [updateBehaviour, setUpdatebehaviour] = useState(
    getUpdateBehaviourStateForArray()
  );

  useEffect(() => {
    setUpdatebehaviour(getUpdateBehaviourStateForArray());
  }, [props.selectedNodes.length]);

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
        <Stack spacing={1} mt={1}>
          {(props.selectedNodes.length !== 1 ||
            props.filter === 'common' ||
            props.filter == null) && (
            <CommonContent
              selectedNode={selectedNode}
              hasTriggerSocket={selectedNode.nodeTriggerSocketArray.length > 0}
              randomMainColor={props.randomMainColor}
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
                    selectedNode={selectedNode}
                    sourceCode={configData}
                    randomMainColor={props.randomMainColor}
                    onChange={(value) => {
                      setConfigData(value);
                      console.log(value);
                    }}
                  />
                  <SourceContent
                    header="Class"
                    editable={false}
                    selectedNode={selectedNode}
                    sourceCode={selectedNode.getSourceCode()}
                    randomMainColor={props.randomMainColor}
                  />
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Box>
    )
  );
};

type SocketContainerProps = {
  property: Socket;
  index: number;
  dataType: AbstractType;
  isInput: boolean;
  hasLink: boolean;
  data: any;
  randomMainColor: string;
  showHeader?: boolean;
  selectedNode: PPNode;
};

export const SocketContainer: React.FunctionComponent<SocketContainerProps> = (
  props
) => {
  const { showHeader = true } = props;
  const [dataTypeValue, setDataTypeValue] = useState(props.dataType);
  const baseProps = {
    key: props.dataType.getName(),
    property: props.property,
    index: props.index,
    isInput: props.isInput,
    hasLink: props.hasLink,
    data: props.data,
    randomMainColor: props.randomMainColor,
  };
  // const widget = dataTypeValue.getInputWidget(baseProps);
  const widget = props.isInput
    ? dataTypeValue.getInputWidget(baseProps)
    : dataTypeValue.getOutputWidget(baseProps);

  const onChangeDropdown = (event) => {
    const { myValue } = event.currentTarget.dataset;
    const entry = new allDataTypes[myValue]();
    console.log(myValue, entry);
    props.property.dataType = entry;
    setDataTypeValue(entry);
    props.property.getNode().metaInfoChanged();
  };

  const CustomSocketInjection = ({ InjectionContent, props }) => {
    console.log(props);

    return <InjectionContent {...props} />;
  };

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {showHeader && (
        <SocketHeader
          key={`SocketHeader-${props.dataType.getName()}`}
          property={props.property}
          index={props.index}
          isInput={props.isInput}
          hasLink={props.hasLink}
          onChangeDropdown={onChangeDropdown}
          randomMainColor={props.randomMainColor}
        />
      )}
      <Box
        sx={{
          px: 1,
          pb: 1,
          ...(!showHeader && { margin: '0px' }), // if no header, then override the margins
        }}
        className={styles.propertyContainerContent}
      >
        {props.property.custom?.inspectorInjection && (
          <CustomSocketInjection
            InjectionContent={
              props.property.custom?.inspectorInjection?.reactComponent
            }
            props={{
              ...props.property.custom?.inspectorInjection?.props,
              randomMainColor: props.randomMainColor,
              selectedNode: props.selectedNode,
            }}
          />
        )}
        {widget}
      </Box>
    </Box>
  );
};

type SocketHeaderProps = {
  property: Socket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  onChangeDropdown: (event) => void;
  randomMainColor: string;
};

const SocketHeader: React.FunctionComponent<SocketHeaderProps> = (props) => {
  const [visible, setVisible] = useState(props.property.visible);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        width: '100%',
      }}
    >
      <ToggleButton
        value="check"
        size="small"
        selected={!visible}
        onChange={() => {
          props.property.setVisible(!visible);
          setVisible((value) => !value);
        }}
        sx={{
          fontSize: '16px',
          border: 0,
          width: '40px',
        }}
      >
        {visible ? (
          <VisibilityIcon fontSize="inherit" />
        ) : (
          <VisibilityOffIcon fontSize="inherit" />
        )}
      </ToggleButton>
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ flexGrow: 1, display: 'inline-flex', alignItems: 'center' }}>
          <Box sx={{ pl: 1, color: 'text.primary' }}>{props.property.name}</Box>
          {(!props.isInput || props.hasLink) && (
            <LockIcon sx={{ pl: '2px', fontSize: '16px', opacity: 0.5 }} />
          )}
          <IconButton
            size="small"
            onClick={() => writeDataToClipboard(props.property?.data)}
          >
            <ContentCopyIcon sx={{ pl: 1, fontSize: '16px' }} />
          </IconButton>
        </Box>
        <IconButton
          title={`Property type: ${props.property.dataType.constructor.name}`}
          aria-label="more"
          id="select-type"
          aria-controls="long-menu"
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleClick}
        >
          <Box
            sx={{
              color: 'text.secondary',
              fontSize: '10px',
            }}
          >
            {props.property.dataType.getName()}
          </Box>
          <MoreVertIcon />
        </IconButton>
        <Menu
          sx={{
            fontSize: '12px',
          }}
          MenuListProps={{
            'aria-labelledby': 'long-button',
          }}
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          {Object.keys(allDataTypes)
            .filter((name) => {
              const dataTypeItem = new allDataTypes[name]();
              if (props.isInput) {
                return dataTypeItem.allowedAsInput();
              } else {
                return dataTypeItem.allowedAsOutput();
              }
            })
            .sort()
            .map((name) => {
              const entry = new allDataTypes[name]().getName();
              return (
                <MenuItem
                  key={name}
                  value={name}
                  data-my-value={name}
                  selected={props.property.dataType.constructor.name === name}
                  onClick={props.onChangeDropdown}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: `${Color(
                        props.randomMainColor
                      ).negate()}`,
                    },
                  }}
                >
                  {entry}
                </MenuItem>
              );
            })}
        </Menu>
      </Box>
    </Box>
  );
};

import React, { useEffect, useState } from 'react';
import Color from 'color';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
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
import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { AbstractType } from './nodes/datatypes/abstractType';
import { allDataTypes } from './nodes/datatypes/dataTypesMap';
import { CodeEditor } from './components/Editor';
import InterfaceController, { ListenEvent } from './InterfaceController';
import PPGraph from './classes/GraphClass';

type PropertyArrayContainerProps = {
  selectedNode: PPNode;
  randomMainColor: string;
};

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
        <Stack spacing={1}>
          {sockets.map((property, index) => {
            return (
              <PropertyContainer
                key={index}
                property={property}
                index={index}
                dataType={property.dataType}
                isInput={property.isInput()}
                hasLink={property.hasLink()}
                data={property.data}
                randomMainColor={props.randomMainColor}
                selectedNode={props.selectedNode}
              />
            );
          })}
        </Stack>
      )
    );
  }
}

function SourceContent(props) {
  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Box
        sx={{
          flexGrow: 1,
          display: 'inline-flex',
          alignItems: 'center',
          py: 1,
        }}
      >
        <Box sx={{ pl: 2, color: 'text.primary' }}>{props.header}</Box>
        {<LockIcon sx={{ pl: '2px', fontSize: '16px', opacity: 0.5 }} />}
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
        editable={false}
        maxStringLength={1000}
      />
    </Box>
  );
}

export const PropertyArrayContainer: React.FunctionComponent<
  PropertyArrayContainerProps
> = (props) => {
  const [dragging, setIsDragging] = useState(
    PPGraph.currentGraph.selection.isDraggingSelection
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

  const [filter, setFilter] = React.useState<string | null>('in');

  const handleFilter = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    setFilter(newFilter);
  };

  return (
    !dragging && (
      <Box sx={{ width: '100%', m: 1 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          fullWidth
          onChange={handleFilter}
          aria-label="socket filter"
          size="small"
          sx={{ bgcolor: 'background.default' }}
        >
          <ToggleButton
            value="trigger"
            aria-label="trigger"
            disabled={props.selectedNode.nodeTriggerSocketArray.length <= 0}
          >
            Trigger
          </ToggleButton>
          <ToggleButton
            value="in"
            aria-label="in"
            disabled={props.selectedNode.inputSocketArray.length <= 0}
          >
            In
          </ToggleButton>
          <ToggleButton
            value="out"
            aria-label="out"
            disabled={props.selectedNode.outputSocketArray.length <= 0}
          >
            Out
          </ToggleButton>
          <ToggleButton value="source" aria-label="source">
            Source
          </ToggleButton>
        </ToggleButtonGroup>
        <Stack spacing={4} mt={1}>
          {socketArrayToComponent(
            props.selectedNode.nodeTriggerSocketArray,
            props,
            'Node Trigger',
            filter,
            'trigger'
          )}
          {socketArrayToComponent(
            props.selectedNode.inputSocketArray,
            props,
            'In',
            filter,
            'in'
          )}
          {socketArrayToComponent(
            props.selectedNode.outputSocketArray,
            props,
            'Out',
            filter,
            'out'
          )}
          {(filter === 'source' || filter == null) && (
            <Stack spacing={1}>
              <SourceContent
                header="Config"
                selectedNode={props.selectedNode}
                sourceCode={JSON.stringify(
                  props.selectedNode?.serialize(),
                  getCircularReplacer(),
                  2
                )}
                randomMainColor={props.randomMainColor}
              />
              <SourceContent
                header="Class"
                selectedNode={props.selectedNode}
                sourceCode={props.selectedNode.getSourceCode()}
                randomMainColor={props.randomMainColor}
              />
            </Stack>
          )}
        </Stack>
      </Box>
    )
  );
};

type PropertyContainerProps = {
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

export const PropertyContainer: React.FunctionComponent<
  PropertyContainerProps
> = (props) => {
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
        <PropertyHeader
          key={`PropertyHeader-${props.dataType.getName()}`}
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

type PropertyHeaderProps = {
  property: Socket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  onChangeDropdown: (event) => void;
  randomMainColor: string;
};

const PropertyHeader: React.FunctionComponent<PropertyHeaderProps> = (
  props
) => {
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

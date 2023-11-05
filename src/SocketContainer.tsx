import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import { Box, IconButton, Menu, MenuItem, ToggleButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import InterfaceController from './InterfaceController';
import { writeDataToClipboard } from './utils/utils';
import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { AbstractType } from './nodes/datatypes/abstractType';
import { allDataTypes } from './nodes/datatypes/dataTypesMap';

type SocketContainerProps = {
  triggerScrollIntoView: boolean;
  property: Socket;
  index: number;
  dataType: AbstractType;
  isInput: boolean;
  hasLink: boolean;
  data: any;
  randomMainColor: string;
  showHeader?: boolean;
  selectedNode: PPNode;
  onDashboard?: boolean;
};

export const SocketContainer: React.FunctionComponent<SocketContainerProps> = (
  props,
) => {
  const myRef = useRef(null);

  const { showHeader = true, onDashboard = false } = props;
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
    return <InjectionContent {...props} />;
  };

  useEffect(() => {
    if (props.triggerScrollIntoView) {
      myRef.current.scrollIntoView({
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [props.triggerScrollIntoView]);

  useEffect(() => {
    setDataTypeValue(props.dataType);
  }, [props.dataType]);

  return (
    <Box
      id={`inspector-socket-${props.dataType.getName()}`}
      ref={myRef}
      sx={{ bgcolor: 'background.default' }}
    >
      {showHeader && (
        <SocketHeader
          key={`SocketHeader-${props.dataType.getName()}`}
          property={props.property}
          index={props.index}
          isSelected={props.triggerScrollIntoView}
          isInput={props.isInput}
          hasLink={props.hasLink}
          onChangeDropdown={onChangeDropdown}
          randomMainColor={props.randomMainColor}
          onDashboard={props.onDashboard}
        />
      )}
      <Box
        sx={{
          px: 1,
          py: 1,
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
  isSelected: boolean;
  isInput: boolean;
  hasLink: boolean;
  onChangeDropdown: (event) => void;
  randomMainColor: string;
  onDashboard: boolean;
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
        bgcolor: props.isSelected && 'secondary.dark',
      }}
    >
      {props.onDashboard ? (
        <IconButton
          size="small"
          sx={{
            borderRadius: 0,
          }}
        >
          <DragHandleIcon fontSize="inherit" />
        </IconButton>
      ) : (
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
      )}
      <Box
        className="dragHandle"
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'move',
        }}
      >
        <Box sx={{ flexGrow: 1, display: 'inline-flex', alignItems: 'center' }}>
          <Box sx={{ pl: 1, color: 'text.primary' }}>{`${
            props.property.getNode().name
          } > ${props.property.name}`}</Box>
          {(!props.isInput || props.hasLink) && (
            <LockIcon sx={{ pl: '2px', fontSize: '16px', opacity: 0.5 }} />
          )}
          <IconButton
            size="small"
            onClick={() => writeDataToClipboard(props.property?.data)}
            sx={{
              borderRadius: 0,
            }}
          >
            <ContentCopyIcon sx={{ fontSize: '12px' }} />
          </IconButton>
        </Box>
        {props.onDashboard ? (
          <IconButton
            title="Remove from dashboard"
            aria-label="more"
            id="select-type"
            aria-controls="long-menu"
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
            onClick={() => {
              InterfaceController.onRemoveFromDashboard(props.property);
            }}
            sx={{
              borderRadius: 0,
            }}
          >
            <ClearIcon />
          </IconButton>
        ) : (
          <IconButton
            title={`Property type: ${props.property.dataType.constructor.name}`}
            aria-label="more"
            id="select-type"
            aria-controls="long-menu"
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleClick}
            sx={{
              borderRadius: 0,
            }}
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
        )}
        {!props.onDashboard && (
          <Menu
            sx={{
              fontSize: '12px',
              zIndex: 1500,
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
                          props.randomMainColor,
                        ).negate()}`,
                      },
                    }}
                  >
                    {entry}
                  </MenuItem>
                );
              })}
          </Menu>
        )}
      </Box>
    </Box>
  );
};

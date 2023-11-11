import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import { Box, IconButton, Menu, MenuItem, ToggleButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
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
  selectedNode: PPNode;
  onDashboard?: boolean;
};

export const SocketContainer: React.FunctionComponent<SocketContainerProps> = (
  props,
) => {
  const myRef = useRef(null);

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

  const locked = !props.isInput || props.hasLink;

  return (
    <Box
      id={`inspector-socket-${props.dataType.getName()}`}
      ref={myRef}
      sx={{ bgcolor: 'background.default', opacity: locked ? 0.75 : 1 }}
    >
      <SocketHeader
        key={`SocketHeader-${props.dataType.getName()}`}
        property={props.property}
        index={props.index}
        isSelected={props.triggerScrollIntoView}
        isInput={props.isInput}
        hasLink={props.hasLink}
        onChangeDropdown={onChangeDropdown}
        randomMainColor={props.randomMainColor}
      />
      <Box
        sx={{
          px: 1,
          py: 1,
        }}
        className={styles.propertyContainerContent}
      >
        <SocketBody
          property={props.property}
          randomMainColor={props.randomMainColor}
          selectedNode={props.selectedNode}
          widget={widget}
        />
      </Box>
    </Box>
  );
};

export const CustomSocketInjection = ({ InjectionContent, props }) => {
  return <InjectionContent {...props} />;
};

type SocketHeaderProps = {
  property: Socket;
  index: number;
  isSelected: boolean;
  isInput: boolean;
  hasLink: boolean;
  onChangeDropdown: (event) => void;
  randomMainColor: string;
};

const SocketHeader: React.FunctionComponent<SocketHeaderProps> = (props) => {
  const [visible, setVisible] = useState(props.property.visible);
  const [locked] = useState(!props.isInput || props.hasLink);
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
      {locked ? (
        <Box sx={{ p: 1, opacity: 0.75, width: '40px', textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: '16px' }} />
        </Box>
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
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: visible ? 1 : 0.75,
        }}
      >
        <Box sx={{ flexGrow: 1, display: 'inline-flex', alignItems: 'center' }}>
          <IconButton
            title="Add to dashboard"
            size="small"
            onClick={() => {
              InterfaceController.onAddToDashboard(props.property);
            }}
            sx={{
              borderRadius: 0,
            }}
          >
            <PlaylistAddIcon sx={{ fontSize: '24px' }} />
          </IconButton>
          <Box sx={{ pl: 0.5, color: 'text.primary' }}>
            {props.property.name}
          </Box>
          <IconButton
            size="small"
            title="Copy data to clipboard"
            onClick={() => {
              InterfaceController.showSnackBar('Data copied to clipboard');
              writeDataToClipboard(props.property?.data);
            }}
            sx={{
              borderRadius: 0,
            }}
          >
            <ContentCopyIcon sx={{ fontSize: '12px' }} />
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
      </Box>
    </Box>
  );
};
type SocketBodyProps = {
  property: Socket;
  selectedNode: PPNode;
  widget: any;
  randomMainColor: string;
};

export const SocketBody: React.FunctionComponent<SocketBodyProps> = (props) => {
  return (
    <>
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
      {props.widget}
    </>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import useInterval from 'use-interval';
import Color from 'color';
import { Box, IconButton, Menu, MenuItem, ToggleButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningIcon from '@mui/icons-material/Warning';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import InterfaceController from './InterfaceController';
import { COLOR_WARNING, STATUS_SEVERITY } from './utils/constants';
import { writeDataToClipboard } from './utils/utils';
import styles from './utils/style.module.css';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { AbstractType, DataTypeProps } from './nodes/datatypes/abstractType';
import {
  allDataTypes,
  dropDownSelectableTypes,
} from './nodes/datatypes/dataTypesMap';

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
};

export const SocketContainer: React.FunctionComponent<SocketContainerProps> = (
  props,
) => {
  const myRef = useRef(null);
  const [hasError, setHasError] = useState(
    props.property.status.getSeverity() >= STATUS_SEVERITY.WARNING,
  );

  const [dataTypeValue, setDataTypeValue] = useState(props.dataType);

  const baseProps: DataTypeProps = {
    key: props.dataType.getName(),
    property: props.property,
    index: props.index,
    isInput: props.isInput,
    hasLink: props.hasLink,
    randomMainColor: props.randomMainColor,
    dataType: props.property.dataType,
  };

  const widget = props.isInput
    ? dataTypeValue.getInputWidget(baseProps)
    : dataTypeValue.getOutputWidget(baseProps);

  const onChangeDropdown = (event) => {
    const { myValue } = event.currentTarget.dataset;
    const entry = new allDataTypes[myValue]();
    props.property.dataType = entry;
    setDataTypeValue(entry);
    props.property.getNode().metaInfoChanged();
    setHasError(props.property.status.getSeverity() >= STATUS_SEVERITY.WARNING);
  };

  useInterval(() => {
    const newHasError =
      props.property.status.getSeverity() >= STATUS_SEVERITY.WARNING;
    if (hasError !== newHasError) {
      setHasError(
        props.property.status.getSeverity() >= STATUS_SEVERITY.WARNING,
      );
    }
  }, 100);

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

  const disabled = !props.isInput || props.hasLink;

  return (
    <Box
      id={`inspector-socket-${props.dataType.getName()}`}
      ref={myRef}
      sx={{
        bgcolor: hasError ? COLOR_WARNING : 'background.default',
        opacity: disabled && !hasError ? 0.75 : 1,
      }}
    >
      <SocketHeader
        key={`SocketHeader-${props.dataType.getName()}`}
        property={props.property}
        hasError={hasError}
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
          pb: 1,
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

const CustomSocketInjection = ({ InjectionContent, props }) => {
  return <InjectionContent {...props} />;
};

type SocketHeaderProps = {
  property: Socket;
  index: number;
  isSelected: boolean;
  hasError: boolean;
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
  const typeAvailableInDropdown =
    dropDownSelectableTypes[props.property.dataType.constructor.name] !==
    undefined;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        width: '100%',
        bgcolor: props.isSelected && !props.hasError && 'secondary.dark',
      }}
      title={`${props.hasError ? props.property.status.message : ''}`}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: visible ? 1 : 0.5,
        }}
      >
        <Box sx={{ flexGrow: 1, display: 'inline-flex', alignItems: 'center' }}>
          {props.hasLink ? (
            <Box sx={{ px: 1, opacity: 0.75, textAlign: 'center' }}>
              <LockIcon sx={{ fontSize: '12px' }} />
            </Box>
          ) : (
            <ToggleButton
              data-cy="socket-visible-button"
              value="check"
              size="small"
              selected={!visible}
              onChange={() => {
                props.property.setVisible(!visible);
                setVisible((value) => !value);
              }}
              sx={{
                fontSize: '12px',
                border: 0,
              }}
            >
              {visible ? (
                <VisibilityIcon fontSize="inherit" />
              ) : (
                <VisibilityOffIcon fontSize="inherit" />
              )}
            </ToggleButton>
          )}
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
            <DashboardCustomizeIcon sx={{ fontSize: '16px' }} />
          </IconButton>
          <IconButton
            size="small"
            title="Copy to clipboard"
            onClick={() => {
              InterfaceController.showSnackBar('Data copied to clipboard');
              writeDataToClipboard(props.property?.data);
            }}
            sx={{
              pl: 0.5,
              borderRadius: 0,
            }}
          >
            <ContentCopyIcon sx={{ fontSize: '12px' }} />
          </IconButton>
          <Box sx={{ p: 0.5, color: 'text.primary', fontSize: '14px' }}>
            {props.property.name}
          </Box>
          {props.hasError && (
            <WarningIcon
              sx={{
                fontSize: '16px',
                pl: 0.5,
              }}
            />
          )}
        </Box>
        <IconButton
          data-cy={props.property.name + '-type-selector-button'}
          title={props.property.dataType.constructor.name}
          aria-label="more"
          id="select-type"
          aria-controls="long-menu"
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleClick}
          sx={{
            borderRadius: 0,
            pr: 1.5,
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
          {typeAvailableInDropdown && (
            <MoreVertIcon sx={{ fontSize: '12px' }} />
          )}
        </IconButton>
        {typeAvailableInDropdown && (
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
            {Object.keys(dropDownSelectableTypes)
              .filter((name) => {
                const dataTypeItem = new dropDownSelectableTypes[name]();
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
                    onClick={(event) => {
                      props.onChangeDropdown(event);
                      handleClose();
                    }}
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

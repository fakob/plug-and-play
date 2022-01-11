import React, { useRef, useEffect, useState } from 'react';
import CodeMirror, {
  EditorView,
  KeyBinding,
  keymap,
} from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import Color from 'color';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  ToggleButton,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { AbstractType } from './nodes/datatypes/abstractType';
import { allDataTypes } from './nodes/datatypes/dataTypesMap';

type PropertyArrayContainerProps = {
  currentGraph: PPGraph;
  selectedNode: PPNode;
  isCustomNode: boolean;
  onSave?: (code: string) => void;
  randomMainColor: string;
  inputSocketArray: Socket[];
  outputSocketArray: Socket[];
  isMac: boolean;
};

export const PropertyArrayContainer: React.FunctionComponent<
  PropertyArrayContainerProps
> = (props) => {
  // const editorRef = useRef<any>();
  const [codeString, setCodeString] = useState<string | undefined>(
    props.currentGraph.customNodeTypes[props.selectedNode.type]
  );

  // const editorDidMount = (editor, monaco) => {
  //   editorRef.current = editor;

  //   editor.addAction({
  //     id: 'my-unique-id',
  //     label: 'Create/Update node',
  //     keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
  //     contextMenuGroupId: 'Test',
  //     contextMenuOrder: 1,
  //     run: function (ed) {
  //       console.log(ed);
  //       saveCode();
  //     },
  //   });

  //   console.log('editorDidMount', editor);
  //   editor.focus();
  // };

  useEffect(() => {
    // update codeString when the type changes
    const selectedNodeType = props.selectedNode.type;
    const value = props.currentGraph.customNodeTypes[selectedNodeType];
    setCodeString(value);
  }, [props.selectedNode.type]);

  const saveCode = () => {
    console.log('Create/Update node command from Editor');
    props.onSave(codeString);
  };

  /*
   * Create a KeyMap extension
   */
  function getKeymap() {
    // Save command
    const save = () => {
      saveCode();
      this.toString();
      return false;
    };

    const conf: readonly KeyBinding[] = [
      { key: `${props.isMac ? 'cmd' : 'ctrl'}-s`, run: save },
    ];

    return keymap.of(conf);
  }

  return (
    <Stack spacing={2}>
      {props.inputSocketArray?.length > 0 && (
        <Stack
          spacing={1}
          sx={{
            p: '8px',
            bgcolor: 'background.paper',
          }}
        >
          <Box textAlign="left" sx={{ color: 'text.primary' }}>
            IN
          </Box>
          {props.inputSocketArray?.map((property, index) => {
            return (
              <PropertyContainer
                key={index}
                property={property}
                index={index}
                dataType={property.dataType}
                isInput={true}
                hasLink={property.hasLink()}
                data={property.data}
                randomMainColor={props.randomMainColor}
              />
            );
          })}
        </Stack>
      )}
      {props.isCustomNode && (
        <CodeMirror
          value={codeString}
          width="100%"
          height="100%"
          theme={oneDark}
          extensions={[
            javascript({ jsx: true }),
            EditorView.lineWrapping,
            getKeymap(),
          ]}
          onChange={(value) => {
            console.log('value:', value);
            setCodeString(value);
          }}
        />
      )}
      {props.outputSocketArray?.length > 0 && (
        <Stack
          spacing={1}
          sx={{
            p: '8px',
            bgcolor: 'background.paper',
          }}
        >
          <Box textAlign="right" sx={{ color: 'text.primary' }}>
            OUT
          </Box>
          {props.outputSocketArray?.map((property, index) => {
            return (
              <PropertyContainer
                key={index}
                property={property}
                index={index}
                dataType={property.dataType}
                isInput={false}
                hasLink={property.hasLink()}
                data={property.data}
                randomMainColor={props.randomMainColor}
              />
            );
          })}
        </Stack>
      )}
    </Stack>
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
};

const PropertyContainer: React.FunctionComponent<PropertyContainerProps> = (
  props
) => {
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
  };

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <PropertyHeader
        key={`PropertyHeader-${props.dataType.getName()}`}
        property={props.property}
        index={props.index}
        isInput={props.isInput}
        hasLink={props.hasLink}
        onChangeDropdown={onChangeDropdown}
        randomMainColor={props.randomMainColor}
      />
      <Box
        sx={{
          px: 1,
          pb: 1,
          ...(props.isInput ? { marginLeft: '30px' } : { marginRight: '30px' }),
        }}
      >
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
  const [name, setName] = useState(props.property.name);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    props.property.setVisible(visible);
  }, [visible]);

  useEffect(() => {
    props.property.setName(name);
  }, [name]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        width: '100%',
        ...(!props.isInput && { flexDirection: 'row-reverse' }),
      }}
    >
      <ToggleButton
        value="check"
        size="small"
        selected={!visible}
        onChange={() => {
          setVisible((value) => !value);
        }}
        sx={{
          fontSize: '16px',
          border: 0,
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
          <Box sx={{ px: 1, color: 'text.primary' }}>{props.property.name}</Box>
          {props.hasLink && (
            <LockIcon fontSize="inherit" sx={{ color: 'text.primary' }} />
          )}
        </Box>
        <IconButton
          title={`Property type: ${props.property.dataType.constructor.name}`}
          aria-label="more"
          id="select-type"
          aria-controls="long-menu"
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleClick}
          disabled={props.hasLink}
        >
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
          {Object.keys(allDataTypes).map((name) => {
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
                    backgroundColor: `${Color(props.randomMainColor).negate()}`,
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

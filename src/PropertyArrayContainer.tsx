import React, { useEffect, useState } from 'react';
import Color from 'color';
import {
  Accordion,
  AccordionProps,
  AccordionDetails,
  AccordionSummary,
  AccordionSummaryProps,
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
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { styled } from '@mui/styles';
import { writeDataToClipboard, writeTextToClipboard } from './utils/utils';
import styles from './utils/style.module.css';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import Socket from './classes/SocketClass';
import { CodeEditor } from './components/Editor';
import { AbstractType } from './nodes/datatypes/abstractType';
import { allDataTypes } from './nodes/datatypes/dataTypesMap';

type PropertyArrayContainerProps = {
  currentGraph: PPGraph;
  selectedNode: PPNode;
  isCustomNode: boolean;
  onSave?: (code: string) => void;
  randomMainColor: string;
};

const StyledAccordion = styled((props: AccordionProps) => (
  <Accordion disableGutters elevation={0} square {...props} />
))(() => ({
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

const StyledAccordionSummary = styled((props: AccordionSummaryProps) => (
  <AccordionSummary expandIcon={<ExpandMoreIcon />} {...props} />
))(({ theme }) => ({
  paddingLeft: '8px',
  bgcolor: 'background.paper',
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: '8px',
  bgcolor: 'background.paper',
}));

export const PropertyArrayContainer: React.FunctionComponent<
  PropertyArrayContainerProps
> = (props) => {
  // const editorRef = useRef<any>();
  const [codeString, setCodeString] = useState<string | undefined>(
    props.currentGraph.customNodeTypes[props.selectedNode.type]
  );

  // leaving this commented here for potential future testing
  //console.log('recreated propertycontainer');

  useEffect(() => {
    // update codeString when the type changes
    const selectedNodeType = props.selectedNode.type;
    const value = props.currentGraph.customNodeTypes[selectedNodeType];
    setCodeString(value);
  }, [props.selectedNode.type]);

  console.log('rendering property array yada');

  return (
    <Stack spacing={1}>
      {props.selectedNode.inputSocketArray?.length > 0 && (
        <StyledAccordion defaultExpanded>
          <StyledAccordionSummary>
            <Box textAlign="left" sx={{ color: 'text.primary' }}>
              IN
            </Box>
          </StyledAccordionSummary>
          <StyledAccordionDetails>
            {props.selectedNode.inputSocketArray?.map((property, index) => {
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
                  selectedNode={props.selectedNode}
                />
              );
            })}
          </StyledAccordionDetails>
        </StyledAccordion>
      )}
      <StyledAccordion defaultExpanded={props.isCustomNode}>
        <StyledAccordionSummary>
          <Box textAlign="center" sx={{ color: 'text.primary' }}>
            CODE
          </Box>
        </StyledAccordionSummary>
        <StyledAccordionDetails>
          <Box
            sx={{ flexGrow: 1, display: 'inline-flex', alignItems: 'center' }}
          >
            <Box sx={{ pl: 1, color: 'text.primary' }}>
              {props.selectedNode.name}:{props.selectedNode.type}
            </Box>
            {!props.isCustomNode && (
              <LockIcon sx={{ pl: '2px', fontSize: '16px', opacity: 0.5 }} />
            )}
            <IconButton
              size="small"
              onClick={() =>
                writeTextToClipboard(
                  codeString ?? props.selectedNode.getSourceCode()
                )
              }
            >
              <ContentCopyIcon sx={{ pl: 1, fontSize: '16px' }} />
            </IconButton>
          </Box>
          <CodeEditor
            value={codeString ?? props.selectedNode.getSourceCode()}
            randomMainColor={props.randomMainColor}
            onSave={props.onSave}
            onChange={(value) => {
              setCodeString(value);
            }}
            editable={props.isCustomNode}
          />
        </StyledAccordionDetails>
      </StyledAccordion>
      {props.selectedNode.outputSocketArray?.length > 0 && (
        <StyledAccordion defaultExpanded>
          <StyledAccordionSummary>
            <Box textAlign="right" sx={{ color: 'text.primary' }}>
              OUT
            </Box>
          </StyledAccordionSummary>
          <StyledAccordionDetails>
            {props.selectedNode.outputSocketArray.map((property, index) => {
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
                  selectedNode={props.selectedNode}
                />
              );
            })}
          </StyledAccordionDetails>
        </StyledAccordion>
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
          ...(props.isInput ? { marginLeft: '30px' } : { marginRight: '30px' }),
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
          <Box sx={{ pl: 1, color: 'text.primary' }}>{props.property.name}</Box>
          {props.hasLink && (
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
          disabled={props.isInput && props.hasLink}
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

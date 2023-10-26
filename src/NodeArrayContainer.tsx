import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';
import Color from 'color';
import InterfaceController, { ListenEvent } from './InterfaceController';
import { getConfigData, writeTextToClipboard } from './utils/utils';
import { ensureVisible, zoomToFitNodes } from './pixi/utils-pixi';
import {
  ERROR_COLOR,
  ONCLICK_DOUBLECLICK,
  ONCLICK_TRIPPLECLICK,
} from './utils/constants';
import { SerializedGraph, TRgba } from './utils/interfaces';
import { CodeEditor } from './components/Editor';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import PPStorage from './PPStorage';

type FilterContentProps = {
  handleFilter: (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
  ) => void;
  filter: string;
};

function FilterContainer(props: FilterContentProps) {
  return (
    <ToggleButtonGroup
      value={props.filter}
      exclusive
      fullWidth
      onChange={props.handleFilter}
      aria-label="graph filter"
      size="small"
      sx={{ bgcolor: 'background.paper', borderRadius: '0px' }}
    >
      <ToggleButton
        id="inspector-filter-nodes"
        value="nodes"
        aria-label="nodes"
      >
        Nodes
      </ToggleButton>
      <ToggleButton
        id="inspector-filter-graph-info"
        value="graph-info"
        aria-label="graph-info"
      >
        Info
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

const NodesContent = (props) => {
  return (
    <>
      <List
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'auto',
          paddingLeft: '2px !important',
          minHeight: '50vh',
        }}
      >
        {props.nodes.map((property) => {
          return (
            <NodeItem
              key={property.id}
              property={property}
              randomMainColor={props.randomMainColor}
              index={property.id}
              sx={{
                listStyleType: 'none',
              }}
            />
          );
        })}
      </List>
    </>
  );
};

const NodeItem = (props) => {
  return (
    <ListItem
      key={props.property.id}
      sx={{
        p: 0,
        '&:hover + .MuiListItemSecondaryAction-root': {
          visibility: 'visible',
        },
        bgcolor: `${Color(props.randomMainColor).darken(0.6)}`,
        margin: '2px 0',
        borderLeft: `16px solid ${props.property.getColor().hex()}`,
      }}
      title={
        props.property.type === 'Macro'
          ? `${props.property.id}
${props.property
  .getInsideNodes()
  .map((item) => item.name)
  .join()}`
          : props.property.id
      }
      onPointerEnter={(event: React.MouseEvent<HTMLLIElement>) => {
        event.stopPropagation();
        const nodeToJumpTo = PPGraph.currentGraph.nodes[props.property.id];
        if (nodeToJumpTo) {
          PPGraph.currentGraph.selection.drawSingleFocus(nodeToJumpTo);
        }
      }}
      onClick={(event: React.MouseEvent<HTMLLIElement>) => {
        event.stopPropagation();
        const nodeToJumpTo = PPGraph.currentGraph.nodes[props.property.id];
        if (nodeToJumpTo) {
          ensureVisible([nodeToJumpTo]);
          setTimeout(() => {
            PPGraph.currentGraph.selection.drawSingleFocus(nodeToJumpTo);
          }, 800);
          if (event.detail === ONCLICK_DOUBLECLICK) {
            zoomToFitNodes([nodeToJumpTo], -0.5);
          } else if (event.detail === ONCLICK_TRIPPLECLICK) {
            setTimeout(() => {
              PPGraph.currentGraph.selection.selectNodes(
                [nodeToJumpTo],
                false,
                true,
              );
            }, 300);
          }
        }
      }}
    >
      <ListItemButton
        sx={{
          p: 1,
        }}
      >
        <Stack
          sx={{
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
              }}
            >
              {!props.property.successfullyExecuted && (
                <Box
                  title={JSON.stringify(
                    props.property.lastError,
                    Object.getOwnPropertyNames(props.property.lastError),
                  )}
                  sx={{
                    fontSize: '16px',
                    background: ERROR_COLOR.hex(),
                    marginRight: '8px',
                    px: 0.5,
                    py: '2px',
                    display: 'inline',
                    fontWeight: 400,
                  }}
                >
                  Error
                </Box>
              )}
              <Box
                sx={{
                  display: 'inline',
                }}
              >
                {props.property.name}
              </Box>
            </Box>
            <Box>
              {props.property.getTags().map((part, index) => (
                <Box
                  key={index}
                  sx={{
                    fontSize: '12px',
                    background: 'rgba(255,255,255,0.2)',
                    cornerRadius: '4px',
                    marginLeft: '2px',
                    px: 0.5,
                    display: 'inline',
                    '.Mui-focused &': {
                      display: 'none',
                    },
                    opacity: 0.5,
                    fontWeight: 400,
                  }}
                >
                  {part}
                </Box>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              fontSize: '12px',
              opacity: '0.75',
              textOverflow: 'ellipsis',
            }}
          >
            <Box
              sx={{
                display: 'inline',
              }}
            >
              {props.property.name === props.property.getName()
                ? ''
                : props.property.getName()}
            </Box>
          </Box>
        </Stack>
      </ListItemButton>
      <ListItemSecondaryAction
        sx={{
          visibility: 'hidden',
          '&&:hover': {
            visibility: 'visible',
          },
          '.MuiListItem-root:has(+ &:hover)': {
            background: 'rgba(255, 255, 255, 0.08)',
          },
          bgcolor: `${Color(props.randomMainColor).darken(0.6)}`,
          right: '8px',
        }}
      >
        <IconButton
          size="medium"
          title="Open node example"
          className="menuItemButton"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            const nodeToJumpTo = PPGraph.currentGraph.nodes[props.property.id];
            if (nodeToJumpTo) {
              nodeToJumpTo.renderOutlineThrottled(50);
              ensureVisible([nodeToJumpTo]);
              PPGraph.currentGraph.selection.selectNodes(
                [nodeToJumpTo],
                false,
                true,
              );
            }
          }}
          sx={{
            borderRadius: 0,
          }}
        >
          <Box
            sx={{
              color: 'text.secondary',
              fontSize: '14px',
              px: 0.5,
            }}
          >
            Select node
          </Box>
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

type InfoContentProps = {
  graph: PPGraph;
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
        </Box>
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          {/* {props.graph.serialize()}
          <Box
            sx={{
              lineHeight: '150%',
            }}
            dangerouslySetInnerHTML={{
              __html: props.selectedNode.getAdditionalDescription(),
            }}
          /> */}
        </Box>
      </Box>
    </Stack>
  );
}

type SourceContentProps = {
  header: string;
  graphName: string;
  editable: boolean;
  sourceCode: string;
  randomMainColor: string;
  onChange?: (value) => void;
  replaceClick?: (value) => void;
  selectedNode?: PPNode;
};

function SourceContent(props: SourceContentProps) {
  return (
    <Box
      id={`inspector-source-content-${props.header}`}
      sx={{ bgcolor: 'background.paper' }}
    >
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
            <Button onClick={() => props.replaceClick(props.sourceCode)}>
              Replace playground with this config
            </Button>
          </ButtonGroup>
        </Box>
      )}
    </Box>
  );
}

type NodeArrayContainerProps = {
  graphName: string;
  graphId: string;
  selectedNodes: PPNode[];
  randomMainColor: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  filterText: string;
  setFilterText: React.Dispatch<React.SetStateAction<string>>;
};

export const NodeArrayContainer: React.FunctionComponent<
  NodeArrayContainerProps
> = (props) => {
  const [nodesInGraph, setNodesInGraph] = useState<PPNode[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<PPNode[]>([]);
  const [configData, setConfigData] = useState('');
  const showNodes = props.filter === 'nodes' || props.filter == null;
  const showGraphInfo = props.filter === 'graph-info' || props.filter == null;

  const handleFilterChange = (event) => {
    props.setFilterText(event.target.value);
  };

  const handleFilter = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
  ) => {
    props.setFilter(newFilter);
  };

  const updateNodes = (currentGraph: PPGraph) => {
    if (currentGraph) {
      const nodes = Object.values(currentGraph.nodes);
      if (nodes) {
        nodes.sort(customSort);
        setNodesInGraph(nodes);
        setFilteredNodes(nodes);
      }
    }
  };

  const filterNodes = (nodes: PPNode[]) => {
    const filteredItems = nodes.filter((node) =>
      customFilter(node, props.filterText),
    );
    filteredItems.sort(customSort);
    setFilteredNodes(filteredItems);
  };

  // Custom filter function searching specified fields
  const customFilter = (item, filterText) => {
    const filter = filterText.toLowerCase();
    const fields = ['name', 'type', 'id'];
    return fields.some((field) => item[field].toLowerCase().includes(filter));
  };

  const customSort = (a, b) => {
    const order =
      (+!b.successfullyExecuted - +!a.successfullyExecuted) * 100 +
        (+(b.type === 'Macro') - +(a.type === 'Macro')) * 10 ||
      a.name.localeCompare(b.name);
    return order;
  };

  const updateNodesAndInfo = useCallback(() => {
    const currentGraph = PPGraph.currentGraph;
    if (currentGraph) {
      setConfigData(getConfigData(currentGraph));
      updateNodes(currentGraph);
      filterNodes(nodesInGraph);
    }
  }, [PPGraph.currentGraph]);

  useEffect(() => {
    // data has id and name
    const ids = [];
    ids.push(
      InterfaceController.addListener(ListenEvent.GraphChanged, () => {
        updateNodesAndInfo();
      }),
    );

    updateNodesAndInfo();

    return () => {
      ids.forEach((id) => InterfaceController.removeListener(id));
    };
  }, []);

  useEffect(() => {
    updateNodesAndInfo();
  }, [
    PPGraph.currentGraph?.nodes,
    PPGraph.currentGraph?.nodes !== undefined &&
      Object.keys(PPGraph.currentGraph?.nodes).length,
  ]);

  useEffect(() => {
    setConfigData(getConfigData(PPGraph.currentGraph));
  }, [PPGraph.currentGraph?.id]);

  useEffect(() => {
    filterNodes(nodesInGraph);
  }, [props.filterText, nodesInGraph]);

  return (
    <Box sx={{ width: '100%', m: 1 }}>
      <FilterContainer handleFilter={handleFilter} filter={props.filter} />
      <Stack
        spacing={1}
        sx={{
          mt: 1,
          overflow: 'auto',
          height: 'calc(100vh - 120px)',
        }}
      >
        {showNodes && (
          <>
            <TextField
              hiddenLabel
              placeholder={`Filter or search nodes`}
              variant="filled"
              fullWidth
              value={props.filterText}
              onChange={handleFilterChange}
              InputProps={{
                disableUnderline: true,
                endAdornment: props.filterText ? (
                  <IconButton
                    size="small"
                    onClick={() => props.setFilterText('')}
                  >
                    <ClearIcon />
                  </IconButton>
                ) : undefined,
              }}
              sx={{
                fontSize: '16px',
                opacity: 0.8,
                bgcolor: 'background.paper',
                '&&&& input': {
                  paddingBottom: '8px',
                  paddingTop: '9px',
                  color: TRgba.fromString(props.randomMainColor)
                    .getContrastTextColor()
                    .hex(),
                },
              }}
            />
            <NodesContent
              nodes={filteredNodes}
              randomMainColor={props.randomMainColor}
            />
          </>
        )}
        {showGraphInfo && (
          <Stack spacing={1}>
            <InfoContent graph={PPGraph.currentGraph} />
            <SourceContent
              header="Config"
              graphName={props.graphName}
              editable={true}
              sourceCode={configData}
              randomMainColor={props.randomMainColor}
              onChange={(value) => {
                setConfigData(value);
              }}
              replaceClick={(value) => {
                const sourceCode = value;
                const newSerializedGraph = JSON.parse(
                  sourceCode,
                ) as SerializedGraph;
                PPStorage.getInstance().loadGraphFromData(
                  newSerializedGraph,
                  props.graphId,
                  props.graphName,
                );
              }}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

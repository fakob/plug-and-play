import React, { useEffect, useState } from 'react';
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
import { hri } from 'human-readable-ids';
import { getConfigData, writeTextToClipboard } from './utils/utils';
import { ensureVisible, zoomToFitNodes } from './pixi/utils-pixi';
import { ERROR_COLOR } from './utils/constants';
import { SerializedGraph, TRgba } from './utils/interfaces';
import { CodeEditor } from './components/Editor';
// import { SerializedNode, SerializedSelection } from './utils/interfaces';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import PPStorage from './PPStorage';
// import InterfaceController, { ListenEvent } from './InterfaceController';

type FilterContentProps = {
  handleFilter: (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
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
          if (event.detail === 2) {
            zoomToFitNodes([nodeToJumpTo], -0.5);
          } else if (event.detail === 3) {
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
  const singleNode = props.selectedNodes.length ? props.selectedNodes[0] : null;
  const [selectedNode, setSelectedNode] = useState(singleNode);
  const [nodesInGraph, setNodesInGraph] = useState<PPNode[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<PPNode[]>([]);
  const [configData, setConfigData] = useState('');

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

  useEffect(() => {
    if (PPGraph.currentGraph) {
      updateNodes(PPGraph.currentGraph);
      filterNodes(nodesInGraph);
    }
  }, []);

  useEffect(() => {
    setConfigData(getConfigData(PPGraph.currentGraph));
  }, [PPGraph.currentGraph?.id]);

  useEffect(() => {
    const newSelectedNode =
      props.selectedNodes.length > 0 ? props.selectedNodes?.[0] : null;
    setSelectedNode(newSelectedNode);
  }, [props.selectedNodes]);

  // Custom filter function to filter items based on their length
  const customFilter = (item, filterText) => {
    const filter = filterText.toLowerCase();
    return (
      item.name.toLowerCase().includes(filter) ||
      item.type.toLowerCase().includes(filter) ||
      item.id.toLowerCase().includes(filter)
    );
  };

  // Custom sort function to sort items alphabetically
  const customSort = (a, b) => {
    // order nodes with errors on top
    if (!a.successfullyExecuted && b.successfullyExecuted) return -1;
    if (a.successfullyExecuted && !b.successfullyExecuted) return 1;
    // next up are macros
    if (a.type === 'Macro' && b.type !== 'Macro') return -1;
    if (a.type !== 'Macro' && b.type === 'Macro') return 1;
    // now the rest
    return a.name.localeCompare(b.name);
  };

  useEffect(() => {
    if (PPGraph.currentGraph) {
      updateNodes(PPGraph.currentGraph);
      filterNodes(nodesInGraph);
    }
  }, [
    PPGraph.currentGraph?.nodes,
    PPGraph.currentGraph?.nodes !== undefined &&
      Object.keys(PPGraph.currentGraph?.nodes).length,
    // selectedNode,
  ]);

  useEffect(() => {
    filterNodes(nodesInGraph);
  }, [props.filterText, nodesInGraph]);

  return (
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
          height: 'calc(100vh - 120px)',
        }}
      >
        {(props.filter === 'nodes' || props.filter == null) && (
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
        {(props.filter === 'graph-info' || props.filter == null) && (
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
                  props.graphName,
                );
                // setConfigData(sourceCode);
              }}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

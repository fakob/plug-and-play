import React, { useCallback, useEffect, useState } from 'react';
import useInterval from 'use-interval';
import {
  Box,
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
import Color from 'color';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import { SourceContent } from './SourceContent';
import { PNPStatus } from './classes/ErrorClass';
import InterfaceController, { ListenEvent } from './InterfaceController';
import styles from './utils/style.module.css';
import { ensureVisible, zoomToFitNodes } from './pixi/utils-pixi';
import {
  ONCLICK_DOUBLECLICK,
  ONCLICK_TRIPPLECLICK,
  STATUS_SEVERITY,
} from './utils/constants';
import { TRgba } from './utils/interfaces';

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
  const [nodeStatus, setNodeStatus] = useState(
    props.property.status.node as PNPStatus,
  );
  const [socketStatus, setSocketStatus] = useState(
    props.property.status.socket as PNPStatus,
  );

  useInterval(() => {
    const newNodeStatus = props.property.status.node as PNPStatus;
    const newSocketStatus = props.property.status.node as PNPStatus;
    if (socketStatus !== newSocketStatus || nodeStatus !== newNodeStatus) {
      setNodeStatus(props.property.status.node as PNPStatus);
      setSocketStatus(props.property.status.socket as PNPStatus);
    }
  }, 100);

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
              <Box
                sx={{
                  display: 'inline',
                }}
              >
                {props.property.name}
              </Box>
              {nodeStatus.getSeverity() >= STATUS_SEVERITY.WARNING && (
                <StatusTag name="Node" status={nodeStatus} />
              )}
              {socketStatus.getSeverity() >= STATUS_SEVERITY.WARNING && (
                <StatusTag name="Socket" status={socketStatus} />
              )}
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
          className={styles.menuItemButton}
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

const StatusTag = (props) => {
  return (
    <Box
      title={`${props.status.getName()}
${props.status.message}`}
      sx={{
        fontSize: '12px',
        background: props.status.getColor().hex(),
        marginLeft: '8px',
        px: 0.5,
        py: '2px',
        display: 'inline',
        fontWeight: 400,
      }}
    >
      {props.name}
    </Box>
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

type NodeArrayContainerProps = {
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

  const customSort = (a: PPNode, b: PPNode) => {
    const order =
      (b.status.node.getSeverity() - a.status.node.getSeverity()) * 1000 +
        (b.status.socket.getSeverity() - a.status.socket.getSeverity()) * 100 +
        (+(b.type === 'Macro') - +(a.type === 'Macro')) * 10 ||
      a.name.localeCompare(b.name);
    return order;
  };

  const updateNodesAndInfo = useCallback(() => {
    const currentGraph = PPGraph.currentGraph;
    if (currentGraph) {
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
              editable={true}
              source={PPGraph.currentGraph}
              randomMainColor={props.randomMainColor}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

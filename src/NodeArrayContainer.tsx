import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  Stack,
} from '@mui/material';
import Color from 'color';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getLoadNodeExampleURL } from './utils/utils';
import { ensureVisible, zoomToFitNodes } from './pixi/utils-pixi';
// import { SerializedNode, SerializedSelection } from './utils/interfaces';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
// import { CodeEditor } from './components/Editor';
import InterfaceController, { ListenEvent } from './InterfaceController';

const NodesContent = (props) => {
  return (
    <>
      <h3>Nodes in playground</h3>
      <List
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'auto',
          paddingLeft: '0 !important',
        }}
        subheader={<li />}
      >
        {Object.entries(props.nodes).map((property, index) => {
          return (
            <NodeItem
              key={index}
              property={property}
              randomMainColor={props.randomMainColor}
              index={index}
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
  console.log(props);
  return (
    <ListItem
      key={`item-${props.property[1].title}`}
      sx={{
        p: 0,
        '&:hover + .MuiListItemSecondaryAction-root': {
          visibility: 'visible',
        },
        bgcolor: `${Color(props.randomMainColor).darken(0.6)}`,
        margin: '1px 0',
      }}
      title="Add node"
      onPointerEnter={(event: React.MouseEvent<HTMLLIElement>) => {
        event.stopPropagation();
        const nodeToJumpTo = PPGraph.currentGraph.nodes[props.property[0]];
        if (nodeToJumpTo) {
          // ensureVisible([nodeToJumpTo]);
          // zoomToFitNodes([nodeToJumpTo]);
          nodeToJumpTo.renderOutlineThrottled(100);
          // setTimeout(() => {
          //   nodeToJumpTo.renderOutlineThrottled(100);
          // }, 500);
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
              title={props.property[1].description}
              sx={{
                flexGrow: 1,
              }}
            >
              <Box
                sx={{
                  display: 'inline',
                }}
              >
                {props.property[1].name}
              </Box>
            </Box>
            <Box>
              {props.property[1].tags?.map((part, index) => (
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
              {props.property[1].description}
            </Box>
          </Box>
        </Stack>
      </ListItemButton>
      {props.property[1].hasExample && (
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
            size="small"
            title="Open node example"
            className="menuItemButton"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              window.open(
                getLoadNodeExampleURL(props.property[1].title),
                '_blank',
              );
            }}
            sx={{
              borderRadius: 0,
            }}
          >
            <Box
              sx={{
                color: 'text.secondary',
                fontSize: '10px',
                px: 0.5,
              }}
            >
              Open example
            </Box>
            <OpenInNewIcon sx={{ fontSize: '16px' }} />
          </IconButton>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

type NodeArrayContainerProps = {
  selectedNodes: PPNode[];
  randomMainColor: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
};

export const NodeArrayContainer: React.FunctionComponent<
  NodeArrayContainerProps
> = (props) => {
  const [dragging, setIsDragging] = useState(false);
  const singleNode = props.selectedNodes.length ? props.selectedNodes[0] : null;
  const [selectedNode, setSelectedNode] = useState(singleNode);
  const [nodesInGraph, setNodesInGraph] = useState({});

  useEffect(() => {
    const id = InterfaceController.addListener(
      ListenEvent.SelectionDragging,
      setIsDragging,
    );
    return () => {
      InterfaceController.removeListener(id);
    };
  }, []);

  useEffect(() => {
    const newSelectedNode =
      props.selectedNodes.length > 0 ? props.selectedNodes?.[0] : null;
    setSelectedNode(newSelectedNode);
  }, [props.selectedNodes]);

  useEffect(() => {
    const nodes = PPGraph.currentGraph?.nodes;
    if (nodes) {
      setNodesInGraph(nodes);
    }
  }, [
    PPGraph.currentGraph?.nodes,
    PPGraph.currentGraph?.nodes !== undefined &&
      Object.keys(PPGraph.currentGraph?.nodes).length,
  ]);

  return (
    !dragging && (
      <Box sx={{ width: '100%', m: 1 }}>
        <Stack
          spacing={1}
          sx={{
            mt: 1,
            overflow: 'auto',
            height: 'calc(100vh - 120px)',
          }}
        >
          <NodesContent
            nodes={nodesInGraph}
            randomMainColor={props.randomMainColor}
          />
        </Stack>
      </Box>
    )
  );
};

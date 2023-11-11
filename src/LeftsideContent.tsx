import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  Paper,
  TextField,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  styled,
} from '@mui/material';
import Color from 'color';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShareIcon from '@mui/icons-material/Share';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import styles from './utils/style.module.css';
import PPGraph from './classes/GraphClass';
import { IGraphSearch, TRgba } from './utils/interfaces';
import PPStorage from './PPStorage';
import InterfaceController from './InterfaceController';
import { COLOR_DARK, COLOR_WHITE_TEXT } from './utils/constants';
import {
  getLoadGraphExampleURL,
  getLoadNodeExampleURL,
  removeExtension,
  sortByDate,
  writeTextToClipboard,
} from './utils/utils';
import { getAllNodeTypes } from './nodes/allNodes';
import MDXCreate from './help/help.mdx';
import MDXAbout from './help/about.mdx';

TimeAgo.addDefaultLocale(en);
// Create formatter (English).
const timeAgo = new TimeAgo('en-US');

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
      aria-label="socket filter"
      size="small"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '0px',
      }}
    >
      <ToggleButton
        id="inspector-filter-explore"
        value="explore"
        aria-label="explore"
      >
        My&nbsp;playgrounds
      </ToggleButton>
      <ToggleButton id="inspector-filter-help" value="help" aria-label="help">
        Help
      </ToggleButton>
      <ToggleButton
        id="inspector-filter-nodes"
        value="nodes"
        aria-label="nodes"
      >
        Nodes
      </ToggleButton>
      <ToggleButton
        id="inspector-filter-about"
        value="about"
        aria-label="about"
      >
        About
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

const Item = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  padding: theme.spacing(1),
  elevation: 0,
  borderRadius: 0,
  overflow: 'auto',
  userSelect: 'text',
  ul: {
    paddingLeft: '16px',
  },
  ol: {
    paddingLeft: '16px',
  },
  a: {
    color: theme.palette.secondary.light,
  },
}));

const LeftsideContent = (props) => {
  const [graphSearchItems, setGraphSearchItems] = useState<
    IGraphSearch[] | null
  >([{ id: '', name: '' }]);
  const [graphSearchActiveItem, setGraphSearchActiveItem] =
    useState<IGraphSearch | null>(null);
  const [nodesCached, setNodesCached] = useState([]);

  const handleFilter = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
  ) => {
    props.setFilter(newFilter);
  };

  const updateGraphSearchItems = () => {
    load();

    async function load() {
      const remoteGraphs: any[] =
        await PPStorage.getInstance().getRemoteGraphsList();
      const remoteGraphSearchItems = remoteGraphs
        .filter((file) => file.endsWith('.ppgraph'))
        .map((graph) => {
          const name = removeExtension(graph);
          return {
            id: graph,
            name: name,
            label: 'remote',
            isRemote: true,
          } as IGraphSearch;
        });

      // add remote header entry
      if (remoteGraphSearchItems.length > 0) {
        remoteGraphSearchItems.unshift({
          id: `remote-header`,
          name: 'Remote playgrounds', // opening a remote playground creates a local copy
          isDisabled: true,
        });
      }

      const graphs: any[] = await PPStorage.getInstance().getGraphs();
      const newGraphSearchItems = graphs.sort(sortByDate).map((graph) => {
        console.log(graph.date);
        return {
          id: graph.id,
          name: graph.name,
          label: `saved ${timeAgo.format(graph.date)}`,
        } as IGraphSearch;
      });

      // add local header entry
      if (graphs.length > 0) {
        newGraphSearchItems.unshift({
          id: `local-header`,
          name: 'Local playgrounds',
          isDisabled: true,
        });
      }

      const allGraphSearchItems = [
        ...newGraphSearchItems,
        ...remoteGraphSearchItems,
      ];
      setGraphSearchItems(allGraphSearchItems);

      const selectedItem = newGraphSearchItems.find(
        (item) => item.id === PPGraph.currentGraph.id,
      );
      console.log(newGraphSearchItems, PPGraph.currentGraph?.id, selectedItem);
      setGraphSearchActiveItem(selectedItem);
    }
  };

  const loadGraph = (id, isRemote) => {
    if (isRemote) {
      PPStorage.getInstance().cloneRemoteGraph(id);
    } else {
      PPStorage.getInstance().loadGraphFromDB(id);
      const selectedItem = graphSearchItems.find((item) => item.id === id);
      setGraphSearchActiveItem(selectedItem);
    }
  };

  useEffect(() => {
    InterfaceController.onGraphListChanged = updateGraphSearchItems;

    updateGraphSearchItems();

    setTimeout(() => {
      const allNodeTypes = Object.entries(getAllNodeTypes());
      if (allNodeTypes) {
        setNodesCached(
          allNodeTypes
            .map(([title, obj]) => {
              return {
                title,
                name: obj.name,
                key: title,
                description: obj.description,
                hasInputs: obj.hasInputs,
                tags: obj.tags,
                hasExample: obj.hasExample,
                group: obj.tags[0],
              };
            })
            .sort((a, b) =>
              a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
            )
            .sort(
              (a, b) =>
                a.group?.localeCompare(b.group, 'en', {
                  sensitivity: 'base',
                }),
            ),
        );
      }
      console.log(nodesCached);
    }, 1000);
  }, []);

  return (
    <Box
      sx={{
        color: Color(props.randomMainColor).isDark()
          ? COLOR_WHITE_TEXT
          : COLOR_DARK,
        code: {
          bgcolor: `${Color(props.randomMainColor).darken(0.6)}`,
          padding: '2px 5px 2px',
          whiteSpace: 'nowrap',
          fontSize: '0.95em',
        },
        a: {
          textDecoration: 'none',
        },
      }}
    >
      <FilterContainer handleFilter={handleFilter} filter={props.filter} />
      <Stack
        spacing={1}
        sx={{
          mt: 1,
          overflow: 'auto',
          height: 'calc(100vh - 100px)',
        }}
      >
        {(props.filter === 'explore' || props.filter == null) && (
          <Item>
            <GraphsContent
              graphs={graphSearchItems}
              graphSearchActiveItem={graphSearchActiveItem}
              loadGraph={loadGraph}
              randomMainColor={props.randomMainColor}
            />
          </Item>
        )}
        {(props.filter === 'help' || props.filter == null) && (
          <Item>
            <MDXCreate />
          </Item>
        )}
        {(props.filter === 'nodes' || props.filter == null) && (
          <Item>
            <NodesContent
              nodesCached={nodesCached}
              randomMainColor={props.randomMainColor}
            />
          </Item>
        )}
        {(props.filter === 'about' || props.filter == null) && (
          <Item>
            <MDXAbout />
          </Item>
        )}
      </Stack>
    </Box>
  );
};

const GraphsContent = (props) => {
  return (
    <>
      <Box
        sx={{
          textAlign: 'right',
          mb: 1,
        }}
      >
        <Button
          variant="text"
          size="small"
          title="Share this playground"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            InterfaceController.setShowSharePlayground(true);
          }}
          sx={{
            mr: 1,
          }}
          endIcon={<ShareIcon />}
        >
          Share current
        </Button>
        <Button
          variant="contained"
          size="small"
          title="Create local playground"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            PPGraph.currentGraph.clear();
            PPStorage.getInstance().saveNewGraph();
          }}
          sx={{
            color: TRgba.fromString(props.randomMainColor)
              .getContrastTextColor()
              .hex(),
            boxShadow: 'none',
          }}
          endIcon={<AddIcon />}
        >
          Create new
        </Button>
      </Box>
      <List
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'auto',
          maxHeight: 'calc(100vh - 160px)',
          paddingLeft: '0 !important',
        }}
        subheader={<li />}
      >
        {props.graphs.map((property, index) => {
          return (
            <GraphItem
              key={index}
              graphSearchActiveItem={props.graphSearchActiveItem}
              loadGraph={props.loadGraph}
              property={property}
              randomMainColor={props.randomMainColor}
              index={index}
              sx={{
                listStyleType: 'none',
                m: 1,
              }}
            />
          );
        })}
      </List>
    </>
  );
};

const GraphItem = (props) => {
  const graph = props.property as IGraphSearch;
  const url = graph.isRemote && getLoadGraphExampleURL(graph.name);
  const contrastTextColor = TRgba.fromString(props.randomMainColor)
    .getContrastTextColor()
    .hex();

  return graph.isDisabled ? (
    <ListSubheader
      sx={{
        lineHeight: '40px',
        paddingLeft: '8px',
        bgcolor: `${Color(props.randomMainColor).darken(0.7)}`,
      }}
    >
      {graph.name}
    </ListSubheader>
  ) : (
    <ListItem
      key={`item-${graph.id}`}
      sx={{
        p: 0,
        '&:hover + .MuiListItemSecondaryAction-root': {
          visibility: 'visible',
        },
        bgcolor: `${Color(props.randomMainColor).darken(0.6)}`,
        margin: '1px 0',
      }}
      title={
        graph.isRemote
          ? 'Load remote playground\nNOTE: Save it after loading, if you want to make changes to it'
          : 'Load local playground'
      }
    >
      <ListItemButton
        selected={graph.id === props.graphSearchActiveItem?.id}
        onClick={() => props.loadGraph(graph.id, graph.isRemote)}
        sx={{
          px: 1,
          py: 0,
          '&.Mui-selected': {
            bgcolor: `${Color(props.randomMainColor)}`,
            color: contrastTextColor,
          },
        }}
      >
        <ListItemText
          primary={graph.name}
          primaryTypographyProps={{
            sx: { fontStyle: graph.isRemote ? 'italic' : 'inherit' },
          }}
          secondary={graph.label}
          secondaryTypographyProps={{
            sx: {
              fontSize: '10px',
              '.Mui-selected &': {
                color: contrastTextColor,
              },
            },
          }}
        />
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
        {graph.isRemote ? (
          <>
            <IconButton
              size="small"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                InterfaceController.setIsGraphSearchOpen(false);
                writeTextToClipboard(url);
              }}
              title="Copy URL"
              className={styles.menuItemButton}
            >
              <LinkIcon />
            </IconButton>
            <IconButton
              size="small"
              title="Open in new tab"
              className={styles.menuItemButton}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                InterfaceController.setIsGraphSearchOpen(false);
                window.open(`${url}`, '_blank')?.focus();
              }}
            >
              <OpenInNewIcon />
            </IconButton>
          </>
        ) : (
          <>
            <IconButton
              size="small"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                InterfaceController.setIsGraphSearchOpen(false);
                PPStorage.getInstance().downloadGraph(graph.id);
              }}
              title="Download playground"
              className={styles.menuItemButton}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                InterfaceController.setGraphToBeModified(graph);
                InterfaceController.setShowGraphEdit(true);
              }}
              title="Rename playground"
              className={styles.menuItemButton}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              title="Delete playground"
              className={styles.menuItemButton}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                InterfaceController.setGraphToBeModified(graph);
                InterfaceController.setShowGraphDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </>
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const NodesContent = (props) => {
  return (
    <>
      <h3>Available nodes</h3>
      <List
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
          paddingLeft: '0 !important',
        }}
        subheader={<li />}
      >
        {props.nodesCached.map((property, index) => {
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
  return (
    <ListItem
      key={`item-${props.property.title}`}
      sx={{
        p: 0,
        '&:hover + .MuiListItemSecondaryAction-root': {
          visibility: 'visible',
        },
        bgcolor: `${Color(props.randomMainColor).darken(0.6)}`,
        margin: '1px 0',
      }}
      title="Add node"
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
              title={props.property.description}
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
            </Box>
            <Box>
              {props.property.tags?.map((part, index) => (
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
              {props.property.description}
            </Box>
          </Box>
        </Stack>
      </ListItemButton>
      {props.property.hasExample && (
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
            className={styles.menuItemButton}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              window.open(
                getLoadNodeExampleURL(props.property.title),
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

export default LeftsideContent;

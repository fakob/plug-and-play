import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  styled,
} from '@mui/material';
import Color from 'color';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PPStorage from './PPStorage';
import { COLOR_DARK, COLOR_WHITE_TEXT } from './utils/constants';
import {
  getLoadGraphExampleURL,
  getLoadNodeExampleURL,
  removeExtension,
} from './utils/utils';
import MDXCreate from './help/create.mdx';
import MDXAbout from './help/about.mdx';

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
        id="inspector-filter-create"
        value="create"
        aria-label="create"
      >
        Create
      </ToggleButton>
      <ToggleButton
        id="inspector-filter-explore"
        value="explore"
        aria-label="explore"
      >
        Explore
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

const HelpContent = (props) => {
  const [remoteGraphs, setRemoteGraphs] = useState<string[]>([]);
  const handleFilter = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
  ) => {
    props.setFilter(newFilter);
  };

  useEffect(() => {
    PPStorage.getInstance()
      .getRemoteGraphsList()
      .then((arrayOfFileNames) => {
        console.log(arrayOfFileNames);
        setRemoteGraphs(
          arrayOfFileNames.filter((file) => file.endsWith('.ppgraph')),
        );
      });
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
          height: 'calc(100vh - 120px)',
        }}
      >
        {(props.filter === 'create' || props.filter == null) && (
          <Item>
            <MDXCreate />
          </Item>
        )}
        {(props.filter === 'explore' || props.filter == null) && (
          <Item>
            <GraphsContent
              graphs={remoteGraphs}
              randomMainColor={props.randomMainColor}
            />
            <NodesContent
              nodesCached={props.nodesCached}
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
      <h3>Example playgrounds</h3>
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
        {props.graphs.map((property, index) => {
          return (
            <GraphItem
              key={index}
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
  const title = props.property;
  const url = getLoadGraphExampleURL(removeExtension(title));

  return (
    <ListItem
      key={`item-${title}`}
      sx={{
        p: 0,
        '&:hover + .MuiListItemSecondaryAction-root': {
          visibility: 'visible',
        },
        bgcolor: `${Color(props.randomMainColor).darken(0.6)}`,
        margin: '1px 0',
      }}
      title="Open node example"
    >
      <ListItemButton
        onClick={() => {
          PPStorage.getInstance().cloneRemoteGraph(title);
        }}
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
            {title}
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
          size="small"
          title="Open in new tab"
          className="menuItemButton"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            window.open(`${url}`, '_blank')?.focus();
          }}
          sx={{
            borderRadius: 0,
          }}
        >
          <OpenInNewIcon
            sx={{
              fontSize: '16px',
            }}
          />
        </IconButton>
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
          overflow: 'auto',
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
            className="menuItemButton"
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

export default HelpContent;

import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
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
import { getLoadNodeExampleURL } from './utils/utils';

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
      sx={{ bgcolor: 'background.paper', borderRadius: '0px' }}
    >
      <ToggleButton
        id="inspector-filter-explore"
        value="explore"
        aria-label="explore"
      >
        Explore
      </ToggleButton>
      <ToggleButton
        id="inspector-filter-create"
        value="create"
        aria-label="create"
      >
        Create
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
    //updateGraphSearchItems();
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
        height: 'inherit',
        overflow: 'auto',
        color: Color(props.randomMainColor).isDark()
          ? COLOR_WHITE_TEXT
          : COLOR_DARK,
      }}
    >
      <FilterContainer handleFilter={handleFilter} filter={props.filter} />
      <Stack spacing={1} sx={{ mt: 1 }}>
        {(props.filter === 'explore' || props.filter == null) && (
          <Item>
            <Box
              sx={{
                mt: 0,
              }}
            >
              Your visual toolkit for creative prototyping, to explore,
              transform or visualise data.
            </Box>
            <GraphsContent graphs={remoteGraphs} />
            <NodesContent nodesCached={props.nodesCached} />
          </Item>
        )}
        {(props.filter === 'create' || props.filter == null) && (
          <Item>
            <Box
              sx={{
                mt: 0,
              }}
            >
              Your visual toolkit for creative prototyping, to explore,
              transform or visualise data.
            </Box>
            <p>Add and connect nodes</p>
            <h4>Quickstart</h4>
            <ol>
              <li>Add nodes</li>
              <ul>
                <li>
                  Open <em>Search nodes</em> by double clicking into the
                  playground or press <em>Cmd/Ctrl+F</em>
                </li>
              </ul>
            </ol>
            <ul>
              <li>
                <em>
                  There are many ready made nodes available, but you can also{' '}
                  <a href="https://docs.google.com/document/d/11dS2uk3qdvrVBHGdu0af5c3NmpCylHUrxrkcu4oNexU/edit#heading=h.l22knu24xajp">
                    create your own
                  </a>
                </em>
              </li>
            </ul>
            <ol>
              <li>Connect them</li>
              <li>They are executed right away</li>
            </ol>
            <h5>Open an example playground</h5>
            <ol>
              <li>
                Click into <em>Search playgrounds</em> or press{' '}
                <em>Cmd/Ctrl+O</em>
              </li>
              <li>Select an existing playground</li>
            </ol>
            <h5>Start a new playground</h5>
            <ol>
              <li>
                Click into <em>Search playgrounds</em> or press{' '}
                <em>Cmd/Ctrl+O</em>
              </li>
              <li>Give it a name</li>
              <li>
                Click <em>Create empty playground</em>
              </li>
            </ol>
            <p>
              OR Click{' '}
              <a href="https://plugandplayground.dev/?new=true">
                https://plugandplayground.dev/?new=true
              </a>
            </p>
            <h4>What data can be used?</h4>
            <p>
              Excel (Tabular data)TextImagesAnd whatever you get from an API
            </p>
            <h4>How do I add and connect nodes?</h4>
            <h5>What are nodes?</h5>
            <p>A node can</p>
            <ul>
              <li>Get or represent data</li>
              <li>Transform data</li>
              <li>Display data</li>
            </ul>
            <p>
              See{' '}
              <a href="https://docs.google.com/document/d/11dS2uk3qdvrVBHGdu0af5c3NmpCylHUrxrkcu4oNexU/edit#heading=h.94je4wsnhfom">
                list of nodes
              </a>
            </p>
            <p>
              A node can have input and output sockets depending on its
              functionality.
            </p>
            <h5>What are sockets?</h5>
            <p>Input sockets are exposed variables. Output sockets are</p>
            <p>
              <br />
              <br />
              <br />
              <br />
              <br />
            </p>
            <p>See list of socket types</p>
            <h5>Search for nodes</h5>
            <p>To open the node search:</p>
            <ul>
              <li>double click the canvas</li>
              <li>
                press <em>Cmd/Ctrl-F</em>
              </li>
              <li>start dragging a connection and release the mouse</li>
            </ul>
            <h5>Create a connection</h5>
            <ol>
              <li>Click and drag and input/output socket</li>
              <li>Connect it to an output/input socket of another node</li>
            </ol>
            <p>
              You can also just drag the connection onto the node and release
              the mouse. This will connect to the socket which fits best.
            </p>
            <h5>Remove nodes</h5>
            <ul>
              <li>Select a node and press Delete</li>
              <li>Right click a node and click "Delete"</li>
            </ul>
            <h5>Remove a connection</h5>
            <ul>
              <li>Click and unplug the input side of a connection</li>
              <li>Right click a socket and click "Remove connection"</li>
            </ul>
            <h5>Change their update behaviour</h5>
            <p>
              By default, nodes update when one of their inputs updates. Change
              this behaviour using the node inspector on the right.
            </p>
            <h4>What nodes are available?</h4>
            <h4>How do I create my own nodes?</h4>
            <h5>Create your own node</h5>
            <ol>
              <li>Open the node search</li>
              <li>Find and add a Custom node</li>
              <li>
                Select the added node and write your own JavaScript function in
                the code field
              </li>
            </ol>
            <p>
              Tip: You can also just type a new name in the node search and
              create a custom node using the new name.
            </p>
            <h5>Write your own function</h5>
            <p>
              A function is a block of JavaScript code that gets executed. You
              can add as many inputs as you like, process them and output the
              result.&nbsp;
            </p>
            <p>Learn more about JavaScript functions</p>
            <p>Tip: To write your function in a separate code editor</p>
            <ol>
              <li>Unhide the Code input</li>
              <li>Right click the input and choose "Connect CodeEditor"</li>
            </ol>
            <h4>How do I import data?</h4>
            <ul>
              <li>Drag in excel, text, image, video or database files</li>
              <li>OR get data from any API</li>
            </ul>
            <h4>How do I transform data?</h4>
            <ul>
              <li>
                Select the data you need and transform it using ready made nodes
              </li>
              <li>OR create your own nodes</li>
            </ul>
            <h4>How do I visualise data?</h4>
            <ul>
              <li>Use the drawing methods and composite them together</li>
              <li>If you want to reuse logic, create a macro</li>
            </ul>
            <h4>How do I share my playgrounds?</h4>
            <p>
              We are a local first platform. To share your playgrounds online
            </p>
            <ol>
              <li>Log in to Github</li>
              <li>Store your playground as a Gist</li>
              <li>Create a shareable link</li>
            </ol>
            <p>
              Of course you can also just save the file locally and share it the
              old school way :-)
            </p>
            <h4>My playground does not work. How can I fix it?</h4>
            <ul>
              <li>Use the Console print node</li>
              <li>Use the Logger node</li>
              <li>Use the browsers devtools</li>
            </ul>
            <h4>Do you want to contribute?</h4>
            <p>
              This project is open source. Check out the project on Github and
              make a pull request.
            </p>
            <h4>Start a new playground?</h4>
          </Item>
        )}
        {(props.filter === 'about' || props.filter == null) && (
          <Item>
            <h3>About</h3>
            <p>
              Plug and Playground is open source, local first and does not
              collect any data. Everything happens inside your browser.
            </p>
            <h4>Problems to solve</h4>
            <ul>
              <li>
                As a user with no/little programming knowledge I am creatively
                limited by prototyping or design tools.
              </li>
              <li>
                As a programmer the threshold for fast and creative prototyping
                with code is too high.
              </li>
              <li>
                As a user who wants to visualize and/or interact with data, CSV
                or .xlsx in a visual, quick and easy way.
              </li>
            </ul>
            <h4>Goals to reach</h4>
            <ul>
              <li>
                Provide an extensive library of nodes to receive, transform and
                output data
              </li>
              <li>Make it easy to jump between visual and real coding</li>
              <li>
                Make it easy to use for mouse, trackpad and keyboard people
              </li>
              <li>Make it easy to add nodes or libraries of others</li>
              <li>Allow for easy sharing, forking and collaborating</li>
              <li>
                Make the tool self explanatory and build in examples and
                comments
              </li>
              <li>Make it cross platform and open source</li>
            </ul>
            <h4>Resources:</h4>
            <ul>
              <li>
                https://github.com/magnificus/pnp-companion-2 - a companion
                application which provides a way to get around CORS issues and
                handles things like authentication to API's when applicable.
              </li>
              <li>
                https://github.com/magnificus/pnp-headless - running PNP graphs
                in headless mode.
              </li>
            </ul>
            <h4>Do you want to contribute?</h4>
            <p>
              This project is open source. Check out the project on Github and
              make a pull request.
            </p>
          </Item>
        )}
      </Stack>
    </Box>
  );
};

const GraphsContent = (props) => {
  return (
    <>
      <h3>List of example graphs</h3>
      <List
        sx={{
          width: '100%',
          // maxWidth: 360,
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'auto',
          // maxHeight: 300,
          '& ul': { padding: 0 },
        }}
        subheader={<li />}
      >
        {props.graphs.map((property, index) => {
          return (
            <GraphItem
              key={index}
              property={property}
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

const GraphItem = (props) => {
  // console.log(props);
  return (
    <ListItem
      key={`item-${props.property.title}`}
      sx={{ p: 0 }}
      title="Open node example"
    >
      <ListItemButton
        onClick={() => {
          PPStorage.getInstance().cloneRemoteGraph(props.property);
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
            {props.property}
          </Box>
        </Stack>
      </ListItemButton>
      {/* <ListItemText primary={`Item ${item}`} /> */}
    </ListItem>
  );
};

const NodesContent = (props) => {
  return (
    <>
      <h3>List of nodes</h3>
      <List
        sx={{
          width: '100%',
          // maxWidth: 360,
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'auto',
          // maxHeight: 300,
          '& ul': { padding: 0 },
        }}
        subheader={<li />}
      >
        {props.nodesCached.map((property, index) => {
          return (
            <NodeItem
              key={index}
              property={property}
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
  // console.log(props);
  return (
    <ListItem key={`item-${props.property.title}`} sx={{ p: 0 }}>
      <ListItemButton>
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
            {/* {props.property.title} */}
            <Box
              title={props.property.description}
              sx={{
                flexGrow: 1,
              }}
            >
              <Box component="div" sx={{ display: 'inline', opacity: '0.5' }}>
                {props.property.isNew && 'Create custom node: '}
              </Box>
              <Box
                sx={{
                  display: 'inline',
                  // opacity: part.highlight ? 1 : 0.75,
                  // fontWeight: part.highlight ? 600 : 400,
                }}
              >
                {props.property.name}
              </Box>
            </Box>
            {props.property.hasExample && (
              <IconButton
                sx={{
                  borderRadius: 0,
                  right: '0px',
                  fontSize: '16px',
                  padding: 0,
                  height: '24px',
                  display: 'none',
                  '.Mui-focused &': {
                    display: 'inherit',
                  },
                }}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  window.open(
                    getLoadNodeExampleURL(props.property.title),
                    '_blank',
                  );
                }}
                title="Open node example"
                className="menuItemButton"
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
            )}
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
                    opacity: part.highlight ? 1 : 0.5,
                    fontWeight: part.highlight ? 600 : 400,
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
                // opacity: part.highlight ? 1 : 0.75,
                // fontWeight: part.highlight ? 600 : 400,
              }}
            >
              {props.property.description}
            </Box>
          </Box>
          {/* <Box
            sx={{
              lineHeight: '150%',
            }}
            dangerouslySetInnerHTML={{
              __html: props.property.getAdditionalDescription(),
            }}
          /> */}
        </Stack>
      </ListItemButton>
      {/* <ListItemText primary={`Item ${item}`} /> */}
    </ListItem>
  );
};

export default HelpContent;

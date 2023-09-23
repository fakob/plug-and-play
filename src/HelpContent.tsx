import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Color from 'color';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { COLOR_DARK, COLOR_WHITE_TEXT, customTheme } from './utils/constants';
import styles from './utils/style.module.css';
import { getLoadNodeExampleURL, useIsSmallScreen } from './utils/utils';
import { getAllNodeTypes } from './nodes/allNodes';

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
        id="inspector-filter-common"
        value="common"
        aria-label="common"
      >
        Get started
      </ToggleButton>
      <ToggleButton id="inspector-filter-out" value="out" aria-label="out">
        Nodes
      </ToggleButton>
      <ToggleButton id="inspector-filter-info" value="info" aria-label="info">
        About
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

const HelpContent = (props) => {
  const handleFilter = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
  ) => {
    props.setFilter(newFilter);
  };

  return (
    <Box
      sx={{
        height: 'inherit',
        overflow: 'auto',
        p: 2,
        color: Color(props.randomMainColor).isDark()
          ? COLOR_WHITE_TEXT
          : COLOR_DARK,
      }}
    >
      <FilterContainer handleFilter={handleFilter} filter={props.filter} />
      <p>
        Your visual toolkit for creative prototyping, to explore, transform or
        visualise data.
      </p>
      <p>Add and connect nodes</p>
      <h2>Quickstart</h2>
      <ol>
        <li>Add nodes</li>
        <ul>
          <li>
            Open <em>Search nodes</em> by double clicking into the playground or
            press <em>Cmd/Ctrl+F</em>
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
      <h3>Open an example playground</h3>
      <ol>
        <li>
          Click into <em>Search playgrounds</em> or press <em>Cmd/Ctrl+O</em>
        </li>
        <li>Select an existing playground</li>
      </ol>
      <h3>Start a new playground</h3>
      <ol>
        <li>
          Click into <em>Search playgrounds</em> or press <em>Cmd/Ctrl+O</em>
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
      <h2>What data can be used?</h2>
      <p>Excel (Tabular data)TextImagesAnd whatever you get from an API</p>
      <h2>How do I add and connect nodes?</h2>
      <h3>What are nodes?</h3>
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
        A node can have input and output sockets depending on its functionality.
      </p>
      <h3>What are sockets?</h3>
      <p>Input sockets are exposed variables. Output sockets are</p>
      <p>
        <br />
        <br />
        <br />
        <br />
        <br />
      </p>
      <p>See list of socket types</p>
      <h3>Search for nodes</h3>
      <p>To open the node search:</p>
      <ul>
        <li>double click the canvas</li>
        <li>
          press <em>Cmd/Ctrl-F</em>
        </li>
        <li>start dragging a connection and release the mouse</li>
      </ul>
      <h3>Create a connection</h3>
      <ol>
        <li>Click and drag and input/output socket</li>
        <li>Connect it to an output/input socket of another node</li>
      </ol>
      <p>
        You can also just drag the connection onto the node and release the
        mouse. This will connect to the socket which fits best.
      </p>
      <h3>Remove nodes</h3>
      <ul>
        <li>Select a node and press Delete</li>
        <li>Right click a node and click "Delete"</li>
      </ul>
      <h3>Remove a connection</h3>
      <ul>
        <li>Click and unplug the input side of a connection</li>
        <li>Right click a socket and click "Remove connection"</li>
      </ul>
      <h3>Change their update behaviour</h3>
      <p>
        By default, nodes update when one of their inputs updates. Change this
        behaviour using the node inspector on the right.
      </p>
      <h2>What nodes are available?</h2>
      <h2>How do I create my own nodes?</h2>
      <h3>Create your own node</h3>
      <ol>
        <li>Open the node search</li>
        <li>Find and add a Custom node</li>
        <li>
          Select the added node and write your own JavaScript function in the
          code field
        </li>
      </ol>
      <p>
        Tip: You can also just type a new name in the node search and create a
        custom node using the new name.
      </p>
      <h3>Write your own function</h3>
      <p>
        A function is a block of JavaScript code that gets executed. You can add
        as many inputs as you like, process them and output the result.&nbsp;
      </p>
      <p>Learn more about JavaScript functions</p>
      <p>Tip: To write your function in a separate code editor</p>
      <ol>
        <li>Unhide the Code input</li>
        <li>Right click the input and choose "Connect CodeEditor"</li>
      </ol>
      <h2>How do I import data?</h2>
      <ul>
        <li>Drag in excel, text, image, video or database files</li>
        <li>OR get data from any API</li>
      </ul>
      <h2>How do I transform data?</h2>
      <ul>
        <li>
          Select the data you need and transform it using ready made nodes
        </li>
        <li>OR create your own nodes</li>
      </ul>
      <h2>How do I visualise data?</h2>
      <ul>
        <li>Use the drawing methods and composite them together</li>
        <li>If you want to reuse logic, create a macro</li>
      </ul>
      <h2>How do I share my playgrounds?</h2>
      <p>We are a local first platform. To share your playgrounds online</p>
      <ol>
        <li>Log in to Github</li>
        <li>Store your playground as a Gist</li>
        <li>Create a shareable link</li>
      </ol>
      <p>
        Of course you can also just save the file locally and share it the old
        school way :-)
      </p>
      <h2>My playground does not work. How can I fix it?</h2>
      <ul>
        <li>Use the Console print node</li>
        <li>Use the Logger node</li>
        <li>Use the browsers devtools</li>
      </ul>
      <h2>Do you want to contribute?</h2>
      <p>
        This project is open source. Check out the project on Github and make a
        pull request.
      </p>
      <h2>Start a new playground?</h2>
      <h1>List of nodes</h1>
      <ul>
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
      </ul>
    </Box>
  );
};

const NodeItem = (props) => {
  // console.log(props);
  return (
    <li>
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
      </Stack>
    </li>
  );
};

export default HelpContent;

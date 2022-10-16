import * as React from 'react';
import Color from 'color';
import { Box, Chip, Popper, Stack, TextField } from '@mui/material';
import { matchSorter } from 'match-sorter';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import PPGraph from '../classes/GraphClass';
import { getAllNodeTypes } from '../nodes/allNodes';
import { INodeSearch } from '../utils/interfaces';
import { COLOR_DARK, COLOR_WHITE_TEXT } from '../utils/constants';
import styles from '../utils/style.module.css';

export const GraphSearchInput = (props) => {
  const backgroundColor = Color(props.randommaincolor).alpha(0.8);
  return (
    <TextField
      {...props}
      hiddenLabel
      // className={styles.brightPlaceholder}
      inputRef={props.inputRef}
      variant="filled"
      placeholder="Search playgrounds"
      InputProps={{
        ...props.InputProps,
        disableUnderline: true,
        endAdornment: null,
      }}
      sx={{
        margin: 0,
        borderRadius: '16px',
        fontSize: '16px',
        height: '40px',
        lineHeight: '40px',
        backgroundColor: `${backgroundColor}`,
        '&&& .MuiInputBase-root': {
          backgroundColor: 'transparent',
        },
        '&&&& input': {
          paddingBottom: '8px',
          paddingTop: '0px',
          // color: COLOR_WHITE_TEXT,
          color: Color(props.randommaincolor).isDark()
            ? COLOR_WHITE_TEXT
            : COLOR_DARK,
        },
      }}
    />
  );
};

export const GraphSearchPopper = (props) => {
  return <Popper {...props} placement="bottom" />;
};

export const NodeSearchInput = (props) => {
  const backgroundColor = Color(props.randommaincolor).alpha(0.9);
  return (
    <TextField
      {...props}
      hiddenLabel
      inputRef={props.inputRef}
      variant="filled"
      placeholder="Search nodes"
      InputProps={{ ...props.InputProps, disableUnderline: true }}
      sx={{
        margin: 0,
        borderRadius: '16px',
        fontSize: '16px',
        height: '40px',
        lineHeight: '40px',
        backgroundColor: `${backgroundColor}`,
        zIndex: 10,
        '&&& .MuiInputBase-root': {
          backgroundColor: 'transparent',
        },
        '&&&& input': {
          paddingBottom: '8px',
          paddingTop: '0px',
          color: Color(props.randommaincolor).isDark()
            ? COLOR_WHITE_TEXT
            : COLOR_DARK,
        },
      }}
    />
  );
};

export const getNodes = (): INodeSearch[] => {
  const addLink = PPGraph.currentGraph.selectedSourceSocket;
  const tempItems = Object.entries(getAllNodeTypes())
    .map(([title, obj]) => {
      return {
        title,
        name: obj.name,
        key: title,
        description: obj.description,
        hasInputs: obj.hasInputs.toString(),
      };
    })
    .sort(
      (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) // case insensitive sorting
    )
    .filter((node) =>
      addLink ? node.hasInputs === 'true' : 'true'
    ) as INodeSearch[];
  return tempItems;
};

export const filterOptionsNode = (
  options: INodeSearch[],
  { inputValue },
  setNodeSearchCount
) => {
  let sorted = options;
  // use the above sort order if no search term has been entered yet
  if (inputValue !== '') {
    sorted = matchSorter(options, inputValue, {
      keys: ['name', 'title', 'description'],
      threshold: matchSorter.rankings.ACRONYM,
    });
  }
  setNodeSearchCount(sorted.length);
  return sorted;
};

export const renderNodeItem = (props, option, { inputValue, selected }) => {
  const matchesOfName = match(option.name, inputValue, { insideWords: true });
  const partsOfName = parse(option.name, matchesOfName);
  const matchesOfDescription = match(option.description, inputValue, {
    insideWords: true,
  });
  const partsOfDescription = parse(option.description, matchesOfDescription);

  return (
    <li {...props} key={option.title}>
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
            title={option.description}
            sx={{
              flexGrow: 1,
            }}
          >
            <Box component="div" sx={{ display: 'inline', opacity: '0.5' }}>
              {option.isNew && 'Create custom node: '}
            </Box>
            <Box>
              {partsOfName.map((part, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'inline',
                    opacity: part.highlight ? 1 : 0.75,
                    fontWeight: part.highlight ? 500 : 400,
                  }}
                >
                  {part.text}
                </Box>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              fontSize: '12px',
              opacity: '0.5',
              background: 'rgba(255,255,255,0.2)',
              cornerRadius: '4px',
              px: 0.5,
            }}
          >
            {option.title}
          </Box>
        </Box>
        <Box
          sx={{
            fontSize: '12px',
            opacity: '0.75',
            textOverflow: 'ellipsis',
          }}
        >
          <Box>
            {partsOfDescription.map((part, index) => (
              <Box
                key={index}
                sx={{
                  display: 'inline',
                  opacity: part.highlight ? 1 : 0.75,
                  fontWeight: part.highlight ? 500 : 400,
                }}
              >
                {part.text}
              </Box>
            ))}
          </Box>
        </Box>
      </Stack>
    </li>
  );
};

import * as React from 'react';
import Color from 'color';
import { hri } from 'human-readable-ids';
import { v4 as uuid } from 'uuid';
import {
  Box,
  ButtonGroup,
  IconButton,
  Stack,
  TextField,
  createFilterOptions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { matchSorter } from 'match-sorter';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import PPGraph from '../classes/GraphClass';
import PPStorage from '../PPStorage';
import { getAllNodeTypes } from '../nodes/allNodes';
import { IGraphSearch, INodeSearch } from '../utils/interfaces';
import { COLOR_DARK, COLOR_WHITE_TEXT } from '../utils/constants';
import { getNodeExampleURL, writeTextToClipboard } from '../utils/utils';

export const GraphSearchInput = (props) => {
  const backgroundColor = Color(props.randommaincolor).alpha(0.8);
  return (
    <TextField
      {...props}
      hiddenLabel
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
          paddingTop: '8px',
          color: Color(props.randommaincolor).isDark()
            ? COLOR_WHITE_TEXT
            : COLOR_DARK,
        },
      }}
    />
  );
};

const filterOptionGraph = createFilterOptions<IGraphSearch>();

export const filterOptionsGraph = (options, params) => {
  const filtered = filterOptionGraph(options, params);
  if (params.inputValue !== '') {
    filtered.push({
      id: hri.random(),
      name: params.inputValue,
      isNew: true,
    });
  }
  return filtered;
};

export const renderGraphItem = (
  props,
  option,
  state,
  setIsGraphSearchOpen,
  setActionObject,
  setShowEdit,
  setShowDeleteGraph
) => {
  const isRemote = option.isRemote;
  const text = option.name;
  const title = isRemote // hover title tag
    ? `${option.name}
NOTE: save the playground after loading, if you want to make changes to it`
    : option.name;
  const optionLabel = option.label;
  const url =
    'https://plugandplayground.dev/?loadURL=https://raw.githubusercontent.com/fakob/plug-and-play-examples/dev/' +
    encodeURIComponent(option.name) +
    '.ppgraph';
  const itemToReturn = option.isDisabled ? (
    <Box {...props} key={option.id} component="li">
      {text}
    </Box>
  ) : (
    <Box
      {...props}
      component="li"
      key={option.id}
      title={title}
      sx={{
        position: 'relative',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
        }}
      >
        <Box component="div" sx={{ display: 'inline', opacity: '0.5' }}>
          {option.isNew && 'Create empty playground: '}
        </Box>
        {text}
      </Box>
      <Box
        sx={{
          fontSize: '12px',
          opacity: '0.75',
          visibility: 'visible',
          '.Mui-focused &': {
            visibility: 'hidden',
          },
        }}
      >
        {optionLabel}
      </Box>
      {isRemote && (
        <ButtonGroup
          size="small"
          sx={{
            position: 'absolute',
            right: '8px',
            visibility: 'hidden',
            '.Mui-focused &': {
              visibility: 'visible',
            },
          }}
        >
          <IconButton
            size="small"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              setIsGraphSearchOpen(false);
              writeTextToClipboard(url);
            }}
            title="Copy URL"
            className="menuItemButton"
          >
            <LinkIcon />
          </IconButton>
          <IconButton
            size="small"
            title="Open in new tab"
            className="menuItemButton"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              setIsGraphSearchOpen(false);
              window.open(`${url}`, '_blank')?.focus();
            }}
          >
            <OpenInNewIcon />
          </IconButton>
        </ButtonGroup>
      )}
      {!isRemote && (
        <ButtonGroup
          size="small"
          sx={{
            position: 'absolute',
            right: '8px',
            visibility: 'hidden',
            '.Mui-focused &': {
              visibility: 'visible',
            },
          }}
        >
          <IconButton
            size="small"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              setIsGraphSearchOpen(false);
              PPStorage.getInstance().downloadGraph(option.id);
            }}
            title="Download playground"
            className="menuItemButton"
          >
            <DownloadIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              setIsGraphSearchOpen(false);
              setActionObject(option);
              setShowEdit(true);
            }}
            title="Rename playground"
            className="menuItemButton"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            title="Delete playground"
            className="menuItemButton"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              setIsGraphSearchOpen(false);
              setActionObject(option);
              setShowDeleteGraph(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </ButtonGroup>
      )}
    </Box>
  );

  return itemToReturn;
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
          paddingTop: '8px',
          color: Color(props.randommaincolor).isDark()
            ? COLOR_WHITE_TEXT
            : COLOR_DARK,
        },
      }}
    />
  );
};

let nodesCached = undefined;
export const getNodes = (latest: INodeSearch[]): INodeSearch[] => {
  const addLink = PPGraph.currentGraph.selectedSourceSocket;
  if (!nodesCached) {
    nodesCached = Object.entries(getAllNodeTypes())
      .map(([title, obj]) => {
        return {
          title,
          name: obj.name,
          key: title,
          description: obj.description,
          hasInputs: obj.hasInputs,
          keywords: obj.keywords,
          group: obj.keywords[0],
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
      )
      .sort((a, b) =>
        a.group?.localeCompare(b.group, 'en', { sensitivity: 'base' })
      );
  }

  const combinedArray = latest.concat(
    nodesCached.filter((node) => !addLink || node.hasInputs) as INodeSearch[]
  );
  const map = new Map(combinedArray.map((node) => [node.title, node]));
  const uniques = [...map.values()];
  return uniques;
};

export const filterOptionsNode = (options: INodeSearch[], { inputValue }) => {
  let sorted = options;
  // use the above sort order if no search term has been entered yet
  const prefilteredOptions = options.filter((node) => {
    // const preFilter =
    //   PPGraph.currentGraph.selectedSourceSocket?.dataType.getName();
    // console.log(node.key, preFilter);
    // return node.key.includes(preFilter);
    return true;
  });

  if (inputValue !== '') {
    sorted = matchSorter(prefilteredOptions, inputValue, {
      keys: ['name', 'title', 'description'],
    });
    sorted.push({
      title: inputValue,
      key: inputValue,
      name: inputValue,
      description: '',
      hasInputs: true,
      isNew: true,
      group: '',
    });
  }
  return sorted;
};

export const renderNodeItem = (props, option, { inputValue, selected }) => {
  const matchesOfName = match(option.name, inputValue, {
    insideWords: true,
    findAllOccurrences: true,
  });
  const partsOfName = parse(option.name, matchesOfName);
  const matchesOfDescription = match(option.description, inputValue, {
    insideWords: true,
  });
  const partsOfDescription = parse(option.description, matchesOfDescription);

  return (
    <li {...props} key={uuid()}>
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
                    fontWeight: part.highlight ? 600 : 400,
                  }}
                >
                  {part.text}
                </Box>
              ))}
            </Box>
          </Box>
          <IconButton
            sx={{
              borderRadius: 0,
              right: '8px',
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
              window.open(getNodeExampleURL(option.title), '_blank');
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
          <Box>
            {option.keywords?.map((part, index) => (
              <Box
                key={index}
                sx={{
                  fontSize: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  cornerRadius: '4px',
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
          <Box>
            {partsOfDescription.map((part, index) => (
              <Box
                key={index}
                sx={{
                  display: 'inline',
                  opacity: part.highlight ? 1 : 0.75,
                  fontWeight: part.highlight ? 600 : 400,
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

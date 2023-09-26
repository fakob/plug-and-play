import React, { useEffect, useState } from 'react';
import Color from 'color';
import { hri } from 'human-readable-ids';
import { v4 as uuid } from 'uuid';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
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
import styles from '../utils/style.module.css';
import PPGraph from '../classes/GraphClass';
import PPStorage from '../PPStorage';
import { getAllNodeTypes } from '../nodes/allNodes';
import { IGraphSearch, INodeSearch, TRgba } from '../utils/interfaces';
import { COLOR_DARK, COLOR_WHITE_TEXT } from '../utils/constants';
import {
  getLoadGraphExampleURL,
  getLoadNodeExampleURL,
  writeTextToClipboard,
} from '../utils/utils';
import InterfaceController from '../InterfaceController';

export const GraphSearchInput = (props) => {
  const [currentGraphName, setCurrentGraphName] = useState('');
  const backgroundColor = Color(props.randommaincolor).alpha(0.8);

  useEffect(() => {
    PPStorage.getInstance()
      .getGraphNameFromDB()
      .then((name) => {
        setCurrentGraphName(name);
      });
  }, [PPGraph.currentGraph?.id]);

  return (
    <Paper
      component="form"
      elevation={0}
      sx={{
        p: '0px 2px  0px 2px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '40px',
        borderRadius: '16px',
        backgroundColor: `${backgroundColor}`,
      }}
    >
      <Box
      // className={styles.userMenu}
      >
        <Button
          sx={{
            px: 1,
            borderRadius: '14px 2px 2px 14px',
            color: TRgba.fromString(props.randommaincolor)
              .getContrastTextColor()
              .hex(),
            '&:hover': {
              backgroundColor: TRgba.fromString(props.randommaincolor)
                .darken(0.05)
                .hex(),
            },
          }}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            // InterfaceController.setIsGraphSearchOpen(false);
          }}
        >
          Share
        </Button>
        {/* {isLoggedIn && (
          <Button
            onClick={() => {
              const currentUrl = window.location.href;
              window.location.href = `/logout?redirectUrl=${currentUrl}`;
            }}
          >
            Logout
          </Button>
        )} */}
      </Box>
      <Typography
        title={`${currentGraphName} (${PPGraph?.currentGraph?.id})`}
        sx={{
          pl: 1,
          fontSize: '16px',
          width: '100%',
          color: TRgba.fromString(props.randommaincolor)
            .getContrastTextColor()
            .hex(),
          opacity: 0.8,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {currentGraphName}
      </Typography>
      <IconButton
        sx={{ mr: 1 }}
        size="small"
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          // InterfaceController.setIsGraphSearchOpen(false);
        }}
        title="Create new playground"
        className="menuItemButton"
      >
        <EditIcon
          sx={{
            fontSize: '20px',
            // borderRadius: '2px 14px 14px 2px',
            color: TRgba.fromString(props.randommaincolor)
              .getContrastTextColor()
              .hex(),
            '&:hover': {
              backgroundColor: TRgba.fromString(props.randommaincolor)
                .darken(0.05)
                .hex(),
            },
          }}
        />
      </IconButton>
      <TextField
        {...props}
        hiddenLabel
        inputRef={props.inputRef}
        variant="filled"
        placeholder={`Search playgrounds`}
        InputProps={{
          ...props.InputProps,
          disableUnderline: true,
          endAdornment: null,
        }}
        sx={{
          margin: 0,
          borderRadius: '2px',
          fontSize: '16px',
          backgroundColor: `${backgroundColor}`,
          '&&& .MuiInputBase-root': {
            backgroundColor: 'transparent',
          },
          '&&&& input': {
            paddingBottom: '8px',
            paddingTop: '9px',
            color: TRgba.fromString(props.randommaincolor)
              .getContrastTextColor()
              .hex(),
          },
        }}
      />
      <Button
        // color="secondary"
        sx={{
          px: 1,
          borderRadius: '2px 14px 14px 2px',
          color: TRgba.fromString(props.randommaincolor)
            .getContrastTextColor()
            .hex(),
          '&:hover': {
            backgroundColor: TRgba.fromString(props.randommaincolor)
              .darken(0.05)
              .hex(),
          },
        }}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          // InterfaceController.setIsGraphSearchOpen(false);
        }}
      >
        New
      </Button>
    </Paper>
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

export const renderGraphItem = (props, option, state) => {
  const isRemote = option.isRemote;
  const text = option.name;
  const title = isRemote // hover title tag
    ? `${option.name}
NOTE: save the playground after loading, if you want to make changes to it`
    : option.name;
  const optionLabel = option.label;
  const url = getLoadGraphExampleURL(option.name);
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
              InterfaceController.setIsGraphSearchOpen(false);
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
              InterfaceController.setIsGraphSearchOpen(false);
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
              InterfaceController.setIsGraphSearchOpen(false);
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
              InterfaceController.setIsGraphSearchOpen(false);
              InterfaceController.setGraphToBeModified(option);
              InterfaceController.setShowGraphEdit(true);
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
              InterfaceController.setIsGraphSearchOpen(false);
              InterfaceController.setGraphToBeModified(option);
              InterfaceController.setShowGraphDelete(true);
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

const findAndResetGroup = (
  suggestedNames: string[],
  arrayToFindIn: INodeSearch[],
  groupName: string,
): INodeSearch[] => {
  const suggestedNodes: INodeSearch[] = [];
  suggestedNames.forEach((nodeName) => {
    const foundNode = arrayToFindIn.find((node) => node.key === nodeName);
    if (foundNode) {
      foundNode.group = groupName;
      suggestedNodes.push(foundNode);
    }
  });
  return suggestedNodes;
};
let nodesCached = undefined;

export const getNodes = (latest: INodeSearch[]): INodeSearch[] => {
  const sourceSocket = PPGraph.currentGraph.selectedSourceSocket;
  if (!nodesCached) {
    nodesCached = Object.entries(getAllNodeTypes())
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
          a.group?.localeCompare(b.group, 'en', { sensitivity: 'base' }),
      );
  }

  const arrayWithGroupReset: INodeSearch[] = nodesCached.map((node) => ({
    ...node,
    group: node.tags[0],
  }));

  const inOrOutputList =
    (sourceSocket?.isInput()
      ? sourceSocket?.dataType.recommendedInputNodeWidgets()
      : sourceSocket?.dataType.recommendedOutputNodeWidgets()) || [];

  const suggestedByType = findAndResetGroup(
    inOrOutputList,
    arrayWithGroupReset,
    'Suggested by socket type',
  );

  const preferredNodesList =
    sourceSocket
      ?.getNode()
      .getPreferredNodesPerSocket()
      .get(sourceSocket?.name) || [];

  const suggestedByNode = findAndResetGroup(
    preferredNodesList,
    arrayWithGroupReset,
    'Suggested by node',
  );

  const combinedArray = latest.concat(
    suggestedByNode,
    suggestedByType,
    arrayWithGroupReset.filter(
      (node) => !sourceSocket || node.hasInputs,
    ) as INodeSearch[],
  );

  const included = {};
  const uniqueArray = combinedArray.filter((node) => {
    if (included[node.key]) {
      return false;
    } else {
      included[node.key] = true;
      return true;
    }
  });

  return uniqueArray;
};

export const filterOptionsNode = (options: INodeSearch[], { inputValue }) => {
  let sorted = options;
  // use the above sort order if no search term has been entered yet
  if (inputValue !== '') {
    sorted = matchSorter(options, inputValue, {
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

export const renderGroupItem = (props) => {
  const isSearching = props.children?.[0].props.issearching; // don't render group header while searching
  if (isSearching) {
    return (
      <li key={props.key}>
        <ul style={{ padding: 0 }}>{props.children}</ul>
      </li>
    );
  }
  return (
    <li key={props.key}>
      <Box
        sx={{
          position: 'sticky',
          top: '-0px',
          padding: '2px 8px',
          color: 'secondary.contrastText',
          bgcolor: 'background.medium',
          zIndex: 2,
          fontSize: '10px',
        }}
      >
        {props.group}
      </Box>
      <ul style={{ padding: 0 }}>{props.children}</ul>
    </li>
  );
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
    <li
      {...props}
      key={uuid()}
      issearching={inputValue.length > 0 ? 1 : undefined}
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
          {option.hasExample && (
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
                window.open(getLoadNodeExampleURL(option.title), '_blank');
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
            {option.tags?.map((part, index) => (
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

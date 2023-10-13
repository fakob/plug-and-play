import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import {
  Autocomplete,
  Button,
  ButtonGroup,
  Paper,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import PPGraph from './classes/GraphClass';
import PPStorage, { checkForUnsavedChanges } from './PPStorage';
import {
  GraphSearchInput,
  filterOptionsGraph,
  renderGraphItem,
} from './components/Search';
import InterfaceController, { ListenEvent } from './InterfaceController';
import styles from './utils/style.module.css';
import { IGraphSearch, TRgba } from './utils/interfaces';
import { PLUGANDPLAY_ICON } from './utils/constants';
import { removeExtension, useIsSmallScreen, useStateRef } from './utils/utils';

TimeAgo.addDefaultLocale(en);
// Create formatter (English).
const timeAgo = new TimeAgo('en-US');

type PnPHeaderProps = {
  randomMainColor: string;
  isLoggedIn: boolean;
  setContextMenuPosition: React.Dispatch<React.SetStateAction<number[]>>;
  setIsGraphContextMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSharePlayground: React.Dispatch<React.SetStateAction<boolean>>;
};

function PnPHeader(props: PnPHeaderProps) {
  const theme = useTheme();
  const smallScreen = useIsSmallScreen();
  const backgroundColor = Color(props.randomMainColor).alpha(0.8);
  const textColor = TRgba.fromString(props.randomMainColor)
    .getContrastTextColor()
    .hex();
  const graphSearchInput = useRef<HTMLInputElement | null>(null);
  const [isGraphSearchOpen, setIsGraphSearchOpen] = useState(false);
  const [remoteGraphs, setRemoteGraphs, remoteGraphsRef] = useStateRef([]);
  const [graphSearchItems, setGraphSearchItems] = useState<
    IGraphSearch[] | null
  >([{ id: '', name: '' }]);
  const [graphSearchActiveItem, setGraphSearchActiveItem] =
    useState<IGraphSearch | null>(null);
  const textInput = useRef(null);
  const [currentGraphName, setCurrentGraphName] = useState('');

  const updateGraphName = () => {
    textInput.current.blur();
    PPStorage.getInstance().renameGraph(
      PPGraph?.currentGraph?.id,
      currentGraphName,
    );
  };

  const handleGraphItemSelect = (event, selected: IGraphSearch) => {
    setIsGraphSearchOpen(false);
    if (!selected) {
      return;
    }

    if (selected.isRemote) {
      const nameOfFileToClone = remoteGraphsRef.current[selected.id];
      PPStorage.getInstance().cloneRemoteGraph(nameOfFileToClone);
    } else {
      if (selected.isNew) {
        PPGraph.currentGraph.clear();
        PPStorage.getInstance().saveNewGraph(selected.name);
        // remove selection flag
        selected.isNew = undefined;
      } else {
        if (checkForUnsavedChanges()) {
          PPStorage.getInstance().loadGraphFromDB(selected.id);
        }
      }
      setGraphSearchActiveItem(selected);
    }
  };

  const updateGraphSearchItems = () => {
    load();

    async function load() {
      const remoteGraphSearchItems = remoteGraphsRef.current.map(
        (graph, index) => {
          return {
            id: index,
            name: removeExtension(graph), // remove .ppgraph extension
            label: 'remote',
            isRemote: true,
          } as IGraphSearch;
        },
      );
      // add remote header entry
      if (remoteGraphSearchItems.length > 0) {
        remoteGraphSearchItems.unshift({
          id: `remote-header`,
          name: 'Remote playgrounds', // opening a remote playground creates a local copy
          isDisabled: true,
        });
      }

      const graphs: any[] = await PPStorage.getInstance().getGraphs();
      const newGraphSearchItems = graphs.map((graph) => {
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

      setGraphSearchActiveItem(
        newGraphSearchItems[PPGraph?.currentGraph?.id] ?? null,
      );
    }
  };

  useEffect(() => {
    if (graphSearchInput.current != null) {
      if (isGraphSearchOpen) {
        graphSearchInput.current.focus();
      }
    }
  }, [isGraphSearchOpen]);

  useEffect(() => {
    // data has id and name
    const ids = [];
    ids.push(
      InterfaceController.addListener(ListenEvent.GraphChanged, (data: any) => {
        setGraphSearchActiveItem(data);
        updateGraphSearchItems();
      }),
    );

    const toggleInputValue = (prev) => !prev;
    InterfaceController.toggleGraphSearchOpen = () =>
      setIsGraphSearchOpen(toggleInputValue);
    InterfaceController.setIsGraphSearchOpen = setIsGraphSearchOpen;

    PPStorage.getInstance()
      .getRemoteGraphsList()
      .then((arrayOfFileNames) => {
        console.log(arrayOfFileNames);
        setRemoteGraphs(
          arrayOfFileNames.filter((file) => file.endsWith('.ppgraph')),
        );
      });

    updateGraphSearchItems();

    return () => {
      // Passing the same reference
      graphSearchInput.current.removeEventListener(
        'focus',
        updateGraphSearchItems,
      );
    };
  }, []);

  // addEventListener to graphSearchInput
  useEffect(() => {
    if (!graphSearchInput?.current) {
      return;
    }
    console.log('add eventlistener to graphSearchInput');
    graphSearchInput.current.addEventListener('focus', updateGraphSearchItems);
    // }
  }, [graphSearchInput?.current]);

  useEffect(() => {
    const graphId = PPGraph.currentGraph?.id;
    if (graphId) {
      PPStorage.getInstance()
        .getGraphNameFromDB(graphId)
        .then((name) => {
          console.log(name);
          setCurrentGraphName(name);
        });
    }
  }, [PPGraph.currentGraph?.id]);

  return (
    <>
      <img
        id="plugandplayground-logo"
        className={styles.plugAndPlaygroundIcon}
        style={{
          backgroundColor: props.randomMainColor,
        }}
        src={PLUGANDPLAY_ICON}
        onClick={(event) => {
          event.stopPropagation();
          props.setContextMenuPosition([16, 96]);
          props.setIsGraphContextMenuOpen((isOpen) => !isOpen);
        }}
      />
      <Paper
        className={styles.pnpHeader}
        component="form"
        elevation={0}
        sx={{
          p: '0px 2px  0px 2px',
          display: 'flex',
          alignItems: 'center',
          height: '40px',
          borderRadius: '16px',
          backgroundColor: `${backgroundColor}`,
          width: 'calc(65vw - 120px)',
          maxWidth: '890px',
          [theme.breakpoints.down('sm')]: {
            width: 'calc(90vw - 130px)',
          },
        }}
      >
        {!smallScreen && (
          <ButtonGroup>
            <Button
              variant="text"
              size="small"
              title="Share this playground"
              sx={{
                px: 1,
                pt: '8px',
                pb: '6px',
                borderRadius: '14px 2px 2px 14px',
                color: textColor,
                '&:hover': {
                  backgroundColor: TRgba.fromString(props.randomMainColor)
                    .darken(0.05)
                    .hex(),
                },
              }}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                props.setShowSharePlayground(true);
              }}
            >
              Share
            </Button>
            {props.isLoggedIn && (
              <Button
                variant="text"
                size="small"
                title="Log out from Github"
                onClick={() => {
                  const currentUrl = window.location.href;
                  window.location.href = `/logout?redirectUrl=${currentUrl}`;
                }}
                sx={{
                  px: 1,
                  pt: '8px',
                  pb: '6px',
                  borderRadius: '2px',
                  color: textColor,
                  '&:hover': {
                    backgroundColor: TRgba.fromString(props.randomMainColor)
                      .darken(0.05)
                      .hex(),
                  },
                }}
              >
                Logout
              </Button>
            )}
          </ButtonGroup>
        )}
        <TextField
          title={`${currentGraphName} (${PPGraph?.currentGraph?.id})
Click to edit name`}
          hiddenLabel
          inputRef={textInput}
          onChange={(event) => {
            const value = event.target.value;
            setCurrentGraphName(value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
              event.preventDefault();
              textInput.current.blur();
            }
          }}
          onBlur={() => {
            updateGraphName();
          }}
          value={currentGraphName}
          sx={{
            fontSize: '16px',
            width: '80%',
            maxWidth: '240px',
            opacity: 0.8,
            '&& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 0,
              },
              '& input': {
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                width: '100%',
                color: textColor,
                padding: '4px 8px',
              },
              '& input:hover': {
                backgroundColor: TRgba.fromString(props.randomMainColor)
                  .darken(0.05)
                  .hex(),
              },
              '& input:focus': {
                boxShadow: `0 0 0 1px ${props.randomMainColor}`,
                backgroundColor: TRgba.fromString(props.randomMainColor)
                  .darken(0.05)
                  .hex(),
              },
            },
          }}
        />
        {!smallScreen && (
          <Button
            variant="text"
            size="small"
            title="Save this playground"
            sx={{
              px: 1,
              pt: '8px',
              pb: '6px',
              borderRadius: '2px',
              color: textColor,
              '&:hover': {
                backgroundColor: TRgba.fromString(props.randomMainColor)
                  .darken(0.05)
                  .hex(),
              },
            }}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              PPStorage.getInstance().saveGraphAction();
            }}
          >
            Save
          </Button>
        )}
        <Autocomplete
          id="graph-search"
          ListboxProps={{ style: { maxHeight: '50vh' } }}
          sx={{
            width: '100%',
          }}
          freeSolo
          openOnFocus
          selectOnFocus
          autoHighlight
          clearOnBlur
          // open
          disablePortal
          defaultValue={graphSearchActiveItem}
          isOptionEqualToValue={(option, value) => option.name === value.name}
          value={graphSearchActiveItem}
          getOptionDisabled={(option) => option.isDisabled}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.name
          }
          options={graphSearchItems}
          onChange={handleGraphItemSelect}
          filterOptions={filterOptionsGraph}
          renderOption={(props, option, state) =>
            renderGraphItem(props, option, state)
          }
          renderInput={(renderInputProps) => (
            <GraphSearchInput
              {...renderInputProps}
              inputRef={graphSearchInput}
              randomMainColor={props.randomMainColor}
              setShowSharePlayground={props.setShowSharePlayground}
              isLoggedIn={props.isLoggedIn}
            />
          )}
          componentsProps={{
            popper: {
              style: { width: 'fit-content', minWidth: '400px' },
            },
          }}
        />
        {!smallScreen && (
          <Button
            variant="text"
            size="small"
            title="Create empty playground"
            sx={{
              px: 1,
              pt: '8px',
              pb: '6px',
              borderRadius: '2px 14px 14px 2px',
              color: TRgba.fromString(props.randomMainColor)
                .getContrastTextColor()
                .hex(),
              '&:hover': {
                backgroundColor: TRgba.fromString(props.randomMainColor)
                  .darken(0.05)
                  .hex(),
              },
            }}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              PPGraph.currentGraph.clear();
              PPStorage.getInstance().saveNewGraph();
            }}
          >
            New
          </Button>
        )}
      </Paper>
    </>
  );
}

export default PnPHeader;

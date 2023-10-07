import React, { useEffect, useRef, useState } from 'react';
import Color from 'color';
import {
  Autocomplete,
  Button,
  ButtonGroup,
  IconButton,
  Paper,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PPGraph from './classes/GraphClass';
import PPStorage from './PPStorage';
import {
  GraphSearchInput,
  filterOptionsGraph,
  renderGraphItem,
} from './components/Search';
import styles from './utils/style.module.css';
import { IGraphSearch, TRgba } from './utils/interfaces';
import { PLUGANDPLAY_ICON } from './utils/constants';
import { useIsSmallScreen } from './utils/utils';

type PnPHeaderProps = {
  randomMainColor: string;
  isLoggedIn: boolean;
  setContextMenuPosition: React.Dispatch<React.SetStateAction<number[]>>;
  setIsGraphContextMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSharePlayground: React.Dispatch<React.SetStateAction<boolean>>;
  graphSearchInput: React.MutableRefObject<HTMLInputElement>;
  graphSearchActiveItem: IGraphSearch;
  graphSearchItems: IGraphSearch[];
  handleGraphItemSelect: (event: any, selected: IGraphSearch) => void;
};

function PnPHeader(props: PnPHeaderProps) {
  const theme = useTheme();
  const smallScreen = useIsSmallScreen();
  const backgroundColor = Color(props.randomMainColor).alpha(0.8);
  const textColor = TRgba.fromString(props.randomMainColor)
    .getContrastTextColor()
    .hex();
  const textInput = useRef(null);
  const [currentGraphName, setCurrentGraphName] = useState('');
  const [originalGraphName, setOriginalGraphName] = useState('');

  useEffect(() => {
    const graphId = PPGraph.currentGraph?.id;
    if (graphId) {
      PPStorage.getInstance()
        .getGraphNameFromDB(graphId)
        .then((name) => {
          console.log(name);
          setCurrentGraphName(name);
          setOriginalGraphName(name);
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
          title={`${currentGraphName} (${PPGraph?.currentGraph?.id})`}
          hiddenLabel
          inputRef={textInput}
          onChange={(event) => {
            const value = event.target.value;
            setCurrentGraphName(value);
            setOriginalGraphName(value);
          }}
          // onClick={(event: React.MouseEvent<HTMLDivElement>) => {
          //   event.stopPropagation();
          // }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              textInput.current.blur();
              PPStorage.getInstance().renameGraph(
                PPGraph?.currentGraph?.id,
                currentGraphName,
              );
            } else if (event.key === 'Escape') {
              event.preventDefault();
              textInput.current.blur();
              setCurrentGraphName(originalGraphName);
            }
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
                backgroundColor: 'unset',
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
        <IconButton
          title="Edit node name"
          color="secondary"
          size="small"
          onClick={() => {
            setTimeout(() => {
              textInput.current.focus();
            }, 100);
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
          <EditIcon fontSize="inherit" />
        </IconButton>
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
          defaultValue={props.graphSearchActiveItem}
          isOptionEqualToValue={(option, value) => option.name === value.name}
          value={props.graphSearchActiveItem}
          getOptionDisabled={(option) => option.isDisabled}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.name
          }
          options={props.graphSearchItems}
          onChange={props.handleGraphItemSelect}
          filterOptions={filterOptionsGraph}
          renderOption={(props, option, state) =>
            renderGraphItem(props, option, state)
          }
          renderInput={(renderInputProps) => (
            <GraphSearchInput
              {...renderInputProps}
              inputRef={props.graphSearchInput}
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

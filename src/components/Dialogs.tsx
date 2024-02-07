import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Link,
  Paper,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import InterfaceController from '../InterfaceController';
import { createGist, formatDate, writeTextToClipboard } from '../utils/utils';
import PPGraph from '../classes/GraphClass';
import PPStorage from '../PPStorage';

export const ShareDialog = (props) => {
  const submitSharePlaygroundDialog = (): void => {
    props.setShowSharePlayground(false);

    const description = (
      document.getElementById(
        'share-playground-description-input',
      ) as HTMLInputElement
    ).value;

    const fileName =
      (
        document.getElementById(
          'share-playground-fileName-input',
        ) as HTMLInputElement
      ).value + '.ppgraph';

    const fileContent = JSON.stringify(
      PPGraph.currentGraph.serialize(),
      null,
      2,
    );

    createGist(description, fileName, fileContent, isPublic)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          if (data.sessionExpired) {
            props.setIsLoggedIn(false);
          }
          throw new Error(data.error);
        }
        InterfaceController.showSnackBar(
          <span>
            The{' '}
            <Link target="_blank" href={data.htmlUrl}>
              gist
            </Link>{' '}
            was successfully created.
          </span>,
          {
            autoHideDuration: 20000,
            action: (key) => (
              <>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    writeTextToClipboard(data.shareableLink);
                    InterfaceController.hideSnackBar(key);
                  }}
                >
                  Copy link
                </Button>
                <Button
                  size="small"
                  onClick={() => InterfaceController.hideSnackBar(key)}
                >
                  Dismiss
                </Button>
              </>
            ),
          },
        );
      })
      .catch((error) => {
        console.warn(error);
        InterfaceController.showSnackBar(error.message, {
          variant: 'warning',
        });
      });
  };

  const [isPublic, setIsPublic] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPublic((event.target as HTMLInputElement).value === 'true');
  };

  return (
    <Dialog
      open={props.showSharePlayground}
      onClose={() => props.setShowSharePlayground(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
      data-cy="shareDialog"
    >
      <DialogTitle id="alert-dialog-title">{'Share Playground'}</DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSharePlaygroundDialog();
        }}
      >
        <DialogContent>
          {props.isLoggedIn ? (
            <Box>
              <DialogContentText id="alert-dialog-description">
                We store the playground as a gist and create a shareable link
                for you.
              </DialogContentText>
              <TextField
                id="share-playground-description-input"
                autoFocus
                margin="dense"
                label="Description"
                fullWidth
                variant="filled"
                placeholder="Description of playground"
              />
              <TextField
                id="share-playground-fileName-input"
                margin="dense"
                label="Name of playground file"
                fullWidth
                variant="filled"
                defaultValue={`Playground - ${formatDate()}`}
                placeholder="Name of playground file"
              />
              <RadioGroup
                row
                aria-labelledby="demo-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={isPublic}
                onChange={handleChange}
                title={`Secret gists are hidden by search engines but visible to anyone you give the URL to.
Public gists are visible to everyone.`}
              >
                <FormControlLabel
                  value={false}
                  control={<Radio />}
                  label="Secret"
                />
                <FormControlLabel
                  value={true}
                  control={<Radio />}
                  label="Public"
                />
              </RadioGroup>
            </Box>
          ) : (
            <Box>
              <Grid2
                container
                justifyContent="center"
                spacing={2}
                columns={{ xs: 6, sm: 6, md: 12 }}
              >
                <Grid2 xs={6}>
                  <Paper sx={{ mx: 1, px: 3, py: 6, textAlign: 'center' }}>
                    Get a shareable link
                    <Box sx={{ m: 3 }}>
                      <Button variant="contained" href={'/auth-with-github'}>
                        Login with Github
                      </Button>
                    </Box>
                    We store the playground as a gist.
                  </Paper>
                </Grid2>
                <Grid2 xs={6}>
                  <Paper sx={{ mx: 1, px: 3, py: 6, textAlign: 'center' }}>
                    Or download it
                    <Box sx={{ m: 3 }}>
                      <Button
                        variant="text"
                        onClick={() => {
                          PPStorage.getInstance().downloadGraph(
                            PPGraph.currentGraph.id,
                          );
                        }}
                      >
                        Download playground
                      </Button>
                    </Box>
                    and share it the old school way :-)
                  </Paper>
                </Grid2>
              </Grid2>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              props.setShowSharePlayground(false);
            }}
          >
            Cancel
          </Button>
          {props.isLoggedIn && <Button type="submit">Share playground</Button>}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export const DeleteConfirmationDialog = (props) => {
  return (
    <Dialog
      open={props.showDeleteGraph}
      onClose={() => props.setShowDeleteGraph(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="sm"
      data-cy="deleteDialog"
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: 'background.default',
        },
      }}
    >
      <DialogTitle id="alert-dialog-title">{'Delete playground?'}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Are you sure you want to delete
          <br />
          <b>{`${props.graphToBeModified?.name}`}</b>?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.setShowDeleteGraph(false)} autoFocus>
          Cancel
        </Button>
        <Button
          onClick={() => {
            props.setShowDeleteGraph(false);
            const currentGraphID = PPGraph.currentGraph.id;
            const graphToBeModifiedID = props.graphToBeModified.id;
            PPStorage.getInstance().deleteGraph(graphToBeModifiedID);
            if (graphToBeModifiedID == currentGraphID) {
              PPStorage.getInstance().loadGraphFromDB();
            }
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const EditDialog = (props) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (props.showEdit) {
      // Slight delay to ensure the TextField is available
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [props.showEdit]);

  const submitEditDialog = (): void => {
    const name = (
      document.getElementById('playground-name-input') as HTMLInputElement
    ).value;
    props.setShowEdit(false);
    PPStorage.getInstance().renameGraph(props.graphId, name);
  };

  return (
    <Dialog
      open={props.showEdit}
      onClose={() => props.setShowEdit(false)}
      fullWidth
      disableRestoreFocus
      maxWidth="sm"
      data-cy="editDialog"
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: 'background.default',
        },
      }}
    >
      <DialogTitle>Edit playground details</DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitEditDialog();
        }}
      >
        <DialogContent>
          <TextField
            id="playground-name-input"
            autoFocus
            margin="dense"
            label="Name of playground"
            fullWidth
            variant="standard"
            defaultValue={`${props.graphName}`}
            placeholder={`${props.graphName}`}
            InputProps={{
              inputRef: inputRef,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => props.setShowEdit(false)}>Cancel</Button>
          <Button
            onClick={() => {
              submitEditDialog();
            }}
          >
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

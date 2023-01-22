import React, { useState } from 'react';
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
import {
  createGist,
  updateGist,
  formatDate,
  writeTextToClipboard,
} from '../utils/utils';
import PPGraph from '../classes/GraphClass';
import PPStorage from '../PPStorage';
import { GITHUB_REDIRECT_URL } from '../utils/constants';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const gitHubRedirectURL = GITHUB_REDIRECT_URL;
const path = '/';

export const ShareDialog = (props) => {
  const submitSharePlaygroundDialog = (): void => {
    props.setShowSharePlayground(false);

    const description = (
      document.getElementById(
        'share-playground-description-input'
      ) as HTMLInputElement
    ).value;

    const fileName =
      (
        document.getElementById(
          'share-playground-fileName-input'
        ) as HTMLInputElement
      ).value + '.ppgraph';

    const fileContent = JSON.stringify(
      PPGraph.currentGraph.serialize(),
      null,
      2
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
        const shareableLink = `https://plugandplayground.dev/?loadURL=${data.files[fileName].raw_url}`;
        const newDescription = `${description} - load this playground by clicking here: ${shareableLink}`;
        InterfaceController.showSnackBar(
          <span>
            The{' '}
            <Link target="_blank" href={data.html_url}>
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
                    writeTextToClipboard(shareableLink);
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
          }
        );
        return updateGist(data.id, newDescription, undefined, undefined);
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          if (data.sessionExpired) {
            props.setIsLoggedIn(false);
          }
          throw new Error(data.error);
        }
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
                      <Button
                        variant="contained"
                        href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${gitHubRedirectURL}?path=${path}&scope=gist`}
                      >
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
                          PPStorage.getInstance().downloadGraph();
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
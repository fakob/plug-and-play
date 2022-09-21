import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import isUrl from 'is-url';
import { LinkState } from './custom-types';

const invalidUrlMessage =
  'Please enter a valid URL, e.g., "http://plugandplayground.dev".';

export interface LinkEditorProps {
  linkState: LinkState;
  onSave: (url: string) => void;
  onRemove: () => void;
  onCancel: () => void;
}

export const LinkEditor = ({
  linkState,
  onSave,
  onRemove,
  onCancel,
}: LinkEditorProps) => {
  const [url, setUrl] = useState(linkState.url);
  const [isUrlTouched, setUrlTouched] = useState(false);
  const [isUrlValid, setUrlValid] = useState(true);

  const handleSave = () => {
    if (isUrl(url)) {
      onSave(url);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value;
    setUrl(newUrl);
    setUrlValid(isUrl(newUrl));
  };

  const handleUrlBlur = () => {
    setUrlTouched(true);
  };

  /**
   * React to special keys:
   *   Enter: create link
   *   Esc: cancel
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setUrlTouched(true);
      setUrlValid(isUrl(url));
      handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <Dialog open={true} fullWidth={true} maxWidth="sm" onClose={onCancel}>
      <DialogTitle>{linkState.isNew ? 'Insert Link' : 'Edit Link'}</DialogTitle>
      <DialogContent>
        <TextField
          id="url"
          label="URL"
          type="url"
          value={url}
          placeholder="Paste or type a link..."
          fullWidth
          autoFocus
          error={isUrlTouched && !isUrlValid}
          helperText={
            isUrlTouched && !isUrlValid ? invalidUrlMessage : undefined
          }
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          onKeyDown={handleKeyDown}
        />
      </DialogContent>
      <DialogActions>
        {!linkState.isNew ? (
          <Box flex={1}>
            <Button color="primary" onClick={onRemove}>
              Remove Link
            </Button>
          </Box>
        ) : null}
        <Button color="primary" onClick={onCancel}>
          CANCEL
        </Button>
        <Button
          color="primary"
          onClick={handleSave}
          disabled={url.length === 0 || !isUrlValid}
        >
          SAVE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import { ToggleButton, ToggleButtonProps } from '@mui/material';
import React, { FormEvent } from 'react';
import { useSlate } from 'slate-react';
import { isBlockActive, toggleBlock } from './slate-editor-components';

export interface BlockButtonProps extends ToggleButtonProps {
  value: string;
}

export const BlockButton = ({
  value,
  children,
  ...props
}: BlockButtonProps) => {
  const editor = useSlate();

  const handleMouseDown = (event: FormEvent<HTMLButtonElement>) => {
    // preventDefault() makes sure that the selection does not go away
    // onMouseDown. This makes the hover toolbar stick.
    // Note: Don't use onClick() or onChange(). onMouseDown() is needed
    // for this mechanism to work.
    event.preventDefault();
    toggleBlock(editor, value);
  };

  return (
    <ToggleButton
      size="small"
      value={value}
      selected={isBlockActive(editor, value)}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {children}
    </ToggleButton>
  );
};

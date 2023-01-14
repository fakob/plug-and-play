import {
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import React, { useEffect, useState } from 'react';
import Color from 'color';
import PPNode from '../classes/NodeClass';
import styles from './../utils/style.module.css';
import { theme } from './../utils/customTheme';

const FloatingNodeMenu = (props) => {
  const selectedNodes: PPNode[] = props.selectedNodes;
  const [anchorElMore, setAnchorElMore] =
    React.useState<HTMLButtonElement | null>(null);

  if (selectedNodes === null || selectedNodes.length === 0) {
    return <div />;
  }

  const handleClickMore = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElMore(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElMore(null);
  };

  const openMore = Boolean(anchorElMore);

  // returns null for a specific property,
  // if its value is not the same throughout the array
  // else it returns the value
  const getUpdateBehaviourStateForArray = () => {
    const areAllIntervalsTheSame = selectedNodes.every(
      (selectedNode) =>
        selectedNode.updateBehaviour.interval ===
        selectedNodes[0].updateBehaviour.interval
    );
    const areAllFrequenciesTheSame = selectedNodes.every(
      (selectedNode) =>
        selectedNode.updateBehaviour.intervalFrequency ===
        selectedNodes[0].updateBehaviour.intervalFrequency
    );
    const areAllUpdatesTheSame = selectedNodes.every(
      (selectedNode) =>
        selectedNode.updateBehaviour.update ===
        selectedNodes[0].updateBehaviour.update
    );
    const updateBehaviourObject = {
      interval: areAllIntervalsTheSame
        ? selectedNodes[0].updateBehaviour.interval
        : null,
      intervalFrequency: areAllFrequenciesTheSame
        ? selectedNodes[0].updateBehaviour.intervalFrequency
        : null,
      update: areAllUpdatesTheSame
        ? selectedNodes[0].updateBehaviour.update
        : null,
    };
    return updateBehaviourObject;
  };

  const [updateBehaviour, setUpdatebehaviour] = useState(
    getUpdateBehaviourStateForArray()
  );

  useEffect(() => {
    setUpdatebehaviour(getUpdateBehaviourStateForArray());
  }, [selectedNodes.length]);

  const onCheckboxChange = (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    const name = (event.target as HTMLInputElement).name;
    selectedNodes.forEach((selectedNode) => {
      selectedNode.updateBehaviour[event.target.name] = checked;
    });
    setUpdatebehaviour((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  const onFrequencyChange = (event) => {
    const value = (event.target as HTMLInputElement).value;
    selectedNodes.forEach((selectedNode) => {
      selectedNode.updateBehaviour.intervalFrequency = parseInt(value);
    });
    setUpdatebehaviour((prevState) => ({
      ...prevState,
      intervalFrequency: parseInt(value),
    }));
  };

  const onUpdateNow = (event) => {
    selectedNodes.forEach((selectedNode) => {
      selectedNode.executeOptimizedChain();
    });
  };

  const [nodeName, setNodeName] = React.useState(selectedNodes[0].name);

  return (
    <ThemeProvider theme={theme}>
      <Paper
        className={styles.floatingNodeMenu}
        elevation={3}
        sx={{
          left: props.x,
          top: props.y,
        }}
      >
        <Stack direction="row" spacing={1}>
          <TextField
            hiddenLabel
            disabled={selectedNodes.length !== 1}
            onChange={(event) => {
              const value = event.target.value;
              selectedNodes[0].nodeName = value;
              setNodeName(value);
            }}
            value={
              selectedNodes.length === 1
                ? nodeName
                : `${selectedNodes.length} nodes`
            }
            sx={{
              '&& .MuiOutlinedInput-root': {
                marginLeft: '8px',
                marginBottom: '4px',
                '& fieldset': {
                  border: 0,
                },
                '& input:hover': {
                  backgroundColor: Color(props.randomMainColor)
                    .alpha(0.1)
                    .hexa(),
                },
                '& input:focus': {
                  boxShadow: `0 0 0 1px ${props.randomMainColor}`,
                  backgroundColor: Color(props.randomMainColor)
                    .alpha(0.1)
                    .hexa(),
                },
              },
            }}
          />
          <ButtonGroup>
            <IconButton onClick={onUpdateNow} title="Update now">
              <UpdateIcon />
            </IconButton>
            <IconButton onClick={handleClickMore} title="More update options">
              <ArrowDropDownIcon />
            </IconButton>
            <Menu anchorEl={anchorElMore} open={openMore} onClose={handleClose}>
              <MenuItem>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="update"
                      checked={updateBehaviour.update}
                      indeterminate={updateBehaviour.update === null}
                      onChange={onCheckboxChange}
                    />
                  }
                  label="Update on change"
                />
              </MenuItem>
              <MenuItem>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="interval"
                        checked={updateBehaviour.interval}
                        indeterminate={updateBehaviour.interval === null}
                        onChange={onCheckboxChange}
                      />
                    }
                    label="Update on interval (in ms)"
                  />
                  <TextField
                    variant="filled"
                    label="Frequency"
                    disabled={!updateBehaviour.interval}
                    inputProps={{
                      type: 'number',
                      inputMode: 'numeric',
                    }}
                    onChange={onFrequencyChange}
                    value={
                      updateBehaviour.intervalFrequency === null
                        ? 'null'
                        : updateBehaviour.intervalFrequency.toString()
                    }
                  />
                </FormGroup>
              </MenuItem>
            </Menu>
          </ButtonGroup>
        </Stack>
      </Paper>
    </ThemeProvider>
  );
};

export default FloatingNodeMenu;

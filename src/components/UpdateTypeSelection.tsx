import {
  Button,
  Checkbox,
  ControlGroup,
  EditableText,
  FormGroup,
  InputGroup,
} from '@blueprintjs/core';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import NodeClass from '../classes/NodeClass';
import styles from './../utils/style.module.css';

const UpdateTypeSelection = (props) => {
  const selectedNode: NodeClass = props.selectedNode;
  if (!selectedNode) {
    return <div />;
  }

  const [updateBehaviour, setUpdatebehaviour] = useState(
    selectedNode.updateBehaviour
  );

  const onCheckboxChange = (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    const name = (event.target as HTMLInputElement).name;
    selectedNode.updateBehaviour[event.target.name] = checked;
    setUpdatebehaviour((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  const onFrequencyChange = (event) => {
    const value = (event.target as HTMLInputElement).value;
    selectedNode.updateBehaviour.intervalFrequency = parseInt(value);
    setUpdatebehaviour((prevState) => ({
      ...prevState,
      intervalFrequency: parseInt(value),
    }));
  };

  return (
    <div className={styles.updateTypeSelection}>
      <FormGroup label="Node update behaviour">
        <ControlGroup fill={true} className={styles.updateTypeSelectionRow}>
          <Checkbox
            checked={updateBehaviour.update}
            name="update"
            label="Update on change"
            onChange={onCheckboxChange}
          />
          <Button
            onClick={() => {
              selectedNode.execute(new Set());
            }}
          >
            Update now
          </Button>
        </ControlGroup>
        <ControlGroup fill={true} className={styles.updateTypeSelectionRow}>
          <Checkbox
            checked={updateBehaviour.interval}
            name="interval"
            label="Interval (in ms)"
            onChange={onCheckboxChange}
          />
          <InputGroup
            className={styles.intervalFrequency}
            disabled={!updateBehaviour.interval}
            value={updateBehaviour.intervalFrequency.toString()}
            type="number"
            onChange={onFrequencyChange}
          />
        </ControlGroup>
      </FormGroup>
    </div>
  );
};

UpdateTypeSelection.propTypes = {
  selectedNode: PropTypes.object.isRequired,
};

export default UpdateTypeSelection;

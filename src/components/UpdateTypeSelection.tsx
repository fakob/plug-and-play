import {
  Button,
  Checkbox,
  ControlGroup,
  FormGroup,
  InputGroup,
} from '@blueprintjs/core';
import React, { useEffect, useState } from 'react';
import PPNode from '../classes/NodeClass';
import styles from './../utils/style.module.css';

type MyProps = {
  selectedNode: PPNode;
};

const UpdateTypeSelection: React.FunctionComponent<MyProps> = (props) => {
  const selectedNode: PPNode = props.selectedNode;
  if (!selectedNode) {
    return <div />;
  }

  const [updateBehaviour, setUpdatebehaviour] = useState(
    selectedNode.updateBehaviour
  );

  // detect prop changes when switching between nodes
  useEffect(() => {
    setUpdatebehaviour(selectedNode.updateBehaviour);
  }, [
    selectedNode.updateBehaviour.update,
    selectedNode.updateBehaviour.interval,
    selectedNode.updateBehaviour.intervalFrequency,
  ]);

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

export default UpdateTypeSelection;

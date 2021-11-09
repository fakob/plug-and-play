import {
  Button,
  ButtonGroup,
  Checkbox,
  Classes,
  ControlGroup,
  EditableText,
  FormGroup,
  InputGroup,
  Menu,
  MenuItem,
  Position,
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Popover2 } from '@blueprintjs/popover2';
import React, { useEffect, useState } from 'react';
import PPNode from '../classes/NodeClass';
import { ColorWidget } from '../widgets';
import styles from './../utils/style.module.css';

const FloatingNodeMenu = (props) => {
  const selectedNodes: PPNode[] = props.selectedNodes;
  if (selectedNodes === null || selectedNodes.length === 0) {
    return <div />;
  }

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
      selectedNode.execute(new Set());
    });
  };

  return (
    <ControlGroup
      className={`${styles.floatingNodeMenu} ${styles.noSelect}`}
      vertical={false}
      style={{
        left: props.x,
        top: props.y,
      }}
    >
      <span className={`${styles.floatingNodeMenuName} ${styles.noSelect}`}>
        {selectedNodes.length === 1
          ? selectedNodes[0].name
          : `${selectedNodes.length} nodes`}
      </span>
      <Button
        className={styles.noSelect}
        onClick={onUpdateNow}
        title="Update now"
        icon="repeat"
        minimal
        large
      />
      <Popover2
        position={Position.BOTTOM}
        minimal={true}
        content={
          <Menu>
            <MenuItem
              text={
                <Checkbox
                  className={`${styles.noSelect} ${Classes.POPOVER_DISMISS_OVERRIDE}`}
                  checked={updateBehaviour.update}
                  indeterminate={updateBehaviour.update === null}
                  name="update"
                  label="Update on change"
                  onChange={onCheckboxChange}
                />
              }
            />
            <MenuItem
              text={
                <>
                  <Checkbox
                    className={`${styles.noSelect} ${Classes.POPOVER_DISMISS_OVERRIDE}`}
                    checked={updateBehaviour.interval}
                    indeterminate={updateBehaviour.interval === null}
                    name="interval"
                    label="Update on interval (in ms)"
                    onChange={onCheckboxChange}
                  />
                  <InputGroup
                    className={`${Classes.POPOVER_DISMISS_OVERRIDE}`}
                    disabled={!updateBehaviour.interval}
                    value={
                      updateBehaviour.intervalFrequency === null
                        ? 'null'
                        : updateBehaviour.intervalFrequency.toString()
                    }
                    type="number"
                    onChange={onFrequencyChange}
                  />
                </>
              }
            />
          </Menu>
        }
      >
        <Button
          className={styles.noSelect}
          rightIcon="caret-down"
          minimal
          large
        />
      </Popover2>
    </ControlGroup>
  );
};

export default FloatingNodeMenu;

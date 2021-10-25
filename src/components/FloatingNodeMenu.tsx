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
import React, { useState } from 'react';
import NodeClass from '../classes/NodeClass';
import { ColorWidget } from '../widgets';
import styles from './../utils/style.module.css';

const FloatingNodeMenu = (props) => {
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
    <ControlGroup
      className={styles.noSelect}
      vertical={false}
      style={{
        position: 'absolute',
        left: props.x,
        top: props.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <EditableText
        className={styles.editablePropertyName2}
        selectAllOnFocus
        value={selectedNode.name}
        onChange={(name) => {
          // setName(name);
        }}
      />
      <Button
        className={styles.noSelect}
        onClick={() => {
          selectedNode.execute(new Set());
        }}
        title="Update now"
        icon="refresh"
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
                  checked={selectedNode.updateBehaviour.update}
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
                    name="interval"
                    label="Update on interval (in ms)"
                    onChange={onCheckboxChange}
                  />
                  <InputGroup
                    className={`${Classes.POPOVER_DISMISS_OVERRIDE}`}
                    disabled={!updateBehaviour.interval}
                    value={updateBehaviour.intervalFrequency.toString()}
                    type="number"
                    onChange={onFrequencyChange}
                  />
                </>
              }
            />
          </Menu>
        }
      >
        <Button rightIcon="caret-down" />
      </Popover2>
    </ControlGroup>
  );
};

export default FloatingNodeMenu;

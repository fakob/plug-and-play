import { Button } from '@blueprintjs/core';
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import NodeClass from '../classes/NodeClass';

const ToggleButton = (props) => {
  const [showEnabled, setShowEnabled] = React.useState(props.enabled);

  return (
    <Button
      style={{
        backgroundColor: showEnabled ? 'gray' : 'black',
      }}
      text={props.text}
      onClick={() => {
        props.setValue(!showEnabled);
        setShowEnabled(!showEnabled);
      }}
    />
  );
};
const UpdateTypeSelection = (props) => {
  const selectedNode: NodeClass = props.selectedNode;
  if (!selectedNode) {
    return <div />;
  }

  return (
    <div>
      <ToggleButton
        enabled={selectedNode.updateBehaviour.update}
        setValue={(newVal) => (selectedNode.updateBehaviour.update = newVal)}
        text={'Update'}
      />
      <ToggleButton
        enabled={selectedNode.updateBehaviour.interval}
        setValue={(newVal) => (selectedNode.updateBehaviour.interval = newVal)}
        text={'Interval'}
      />
      <ToggleButton
        enabled={selectedNode.updateBehaviour.manual}
        setValue={(newVal) => (selectedNode.updateBehaviour.manual = newVal)}
        text={'Manual'}
      />
    </div>
  );
};

UpdateTypeSelection.propTypes = {
  selectedNode: PropTypes.object.isRequired,
};

export default UpdateTypeSelection;

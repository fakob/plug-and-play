import { Button } from '@blueprintjs/core';
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import NodeClass from '../classes/NodeClass';

const UpdateTypeSelection = (props) => {
  const selectedNode: NodeClass = props.selectedNode;
  if (!selectedNode) {
    return <div />;
  }
  const [update, setUpdate] = React.useState(
    selectedNode.updateBehaviour.update
  );
  const [manual, setManual] = React.useState(
    selectedNode.updateBehaviour.manual
  );
  const [interval, setInterval] = React.useState(
    selectedNode.updateBehaviour.interval
  );

  return (
    <div>
      <Button
        style={{
          backgroundColor: update ? 'gray' : 'black',
        }}
        text={'Update'}
        onClick={() => {
          selectedNode.updateBehaviour.update = !update;
          setUpdate(!update);
        }}
      />
      <Button
        text={'Interval'}
        style={{
          backgroundColor: interval !== 0 ? 'gray' : 'black',
        }}
        onClick={() => {
          selectedNode.updateBehaviour.interval = interval ? 0 : 1;
          setInterval(interval ? 0 : 1);
          console.log('gloggas');
        }}
      />
      <Button
        style={{
          backgroundColor: manual ? 'gray' : 'black',
        }}
        text={'Manual'}
        onClick={() => {
          selectedNode.updateBehaviour.manual = !manual;
          setManual(!manual);
        }}
      />
    </div>
  );
};

UpdateTypeSelection.propTypes = {
  selectedNode: PropTypes.object.isRequired,
};

export default UpdateTypeSelection;

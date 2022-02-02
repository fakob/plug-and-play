import React, { useEffect, useState } from 'react';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import GraphOverlayDrawer from './GraphOverlayDrawer';
import GraphOverlayNodeMenu from './GraphOverlayNodeMenu';

type GraphOverlayProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
};

const GraphOverlay: React.FunctionComponent<GraphOverlayProps> = (props) => {
  const [selectedNodes, setSelectedNodes] = useState<PPNode[]>([]);

  useEffect(() => {
    if (props.currentGraph) {
      // register callbacks when currentGraph mounted
      props.currentGraph.selection.onSelectionChange = setSelectedNodes;
    }
    console.log('GraphOverlay:', selectedNodes);
  }, [props.currentGraph]);

  return (
    <>
      <GraphOverlayDrawer
        selectedNodes={selectedNodes}
        currentGraph={props.currentGraph}
        randomMainColor={props.randomMainColor}
      />
      <GraphOverlayNodeMenu
        selectedNodes={selectedNodes}
        currentGraph={props.currentGraph}
        randomMainColor={props.randomMainColor}
      />
    </>
  );
};

export default GraphOverlay;

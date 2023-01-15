import React, { useEffect, useState } from 'react';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import GraphOverlayDrawer from './GraphOverlayDrawer';
import GraphOverlaySocketInspector from './GraphOverlaySocketInspector';

type GraphOverlayProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
  toggle: boolean;
};

const GraphOverlay: React.FunctionComponent<GraphOverlayProps> = (props) => {
  const [selectedNodes, setSelectedNodes] = useState<PPNode[]>([]);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const [isZoomingViewport, setIsZoomingViewport] = useState(false);

  useEffect(() => {
    // register callbacks when currentGraph mounted
    const ids = [];
    ids.push(
      InterfaceController.addListener(
        ListenEvent.SelectionChanged,
        setSelectedNodes
      )
    );
    ids.push(
      InterfaceController.addListener(
        ListenEvent.SelectionDragging,
        setIsDraggingSelection
      )
    );
    ids.push(
      InterfaceController.addListener(
        ListenEvent.ViewportDragging,
        setIsDraggingViewport
      )
    );
    ids.push(
      InterfaceController.addListener(
        ListenEvent.ViewportZoom,
        setIsZoomingViewport
      )
    );

    return () => {
      ids.forEach((id) => InterfaceController.removeListener(id));
    };
  });

  return (
    <>
      <GraphOverlayDrawer
        toggle={props.toggle}
        selectedNodes={selectedNodes}
        randomMainColor={props.randomMainColor}
      />
      <GraphOverlaySocketInspector randomMainColor={props.randomMainColor} />
    </>
  );
};

export default GraphOverlay;

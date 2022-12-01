import React, { useEffect, useState } from 'react';
import useInterval from 'use-interval';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import GraphOverlayDrawer from './GraphOverlayDrawer';
import GraphOverlayNodeMenu from './GraphOverlayNodeMenu';
import GraphOverlaySocketInspector from './GraphOverlaySocketInspector';

type GraphOverlayProps = {
  currentGraph: PPGraph;
  randomMainColor: string;
};

const GraphOverlay: React.FunctionComponent<GraphOverlayProps> = (props) => {
  const [selectedNodes, setSelectedNodes] = useState<PPNode[]>([]);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const [isZoomingViewport, setIsZoomingViewport] = useState(false);

  useEffect(() => {
    if (props.currentGraph) {
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
      props.currentGraph.viewport.on('zoomed', () => {
        setIsZoomingViewport(true);
      });
      props.currentGraph.viewport.on('zoomed-end', () => {
        setIsZoomingViewport(false);
      });
      return () => {
        ids.forEach((id) => InterfaceController.removeListener(id));
      };
    }
  });

  useInterval(() => {
    setIsDraggingNode(selectedNodes.length === 1 && isDraggingSelection);
  }, 16);

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
        isDragging={
          isZoomingViewport ||
          isDraggingViewport ||
          isDraggingNode ||
          isDraggingSelection
        }
      />
      <GraphOverlaySocketInspector randomMainColor={props.randomMainColor} />
    </>
  );
};

export default GraphOverlay;

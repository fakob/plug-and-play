import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import * as PIXI from 'pixi.js';
import _ from 'lodash';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { SocketContainer } from '../SocketContainer';
import PPNode from '../classes/NodeClass';
import PPSocket from '../classes/SocketClass';
import InterfaceController from '../InterfaceController';
import PPGraph from '../classes/GraphClass';
import { deconstructSocketId } from '../utils/utils';
import { LAYOUTS_EMPTY } from '../utils/constants';

type GraphOverlayDashboardProps = {
  randomMainColor: string;
};

const GraphOverlayDashboard: React.FunctionComponent<
  GraphOverlayDashboardProps
> = (props) => {
  // const [socketInspectorPosition, setSocketInspectorPosition] =
  //   useState<PIXI.Point>(new PIXI.Point(0, 0));
  // const [socketsToInspect, setSocketsToInspect] = useState<PPSocket[]>([]);
  const [layouts, setLayouts] = useState(
    PPGraph.currentGraph?.layouts || LAYOUTS_EMPTY,
  );
  const [breakPoint, setBreakPoint] = useState('lg');
  const [columns, setColumns] = useState(12);

  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);

  const [socketsToInspect, setSocketsToInspect] = useState<PPSocket[]>([]);

  useEffect(() => {
    InterfaceController.onAddToDashboard = addToDashboard;
  }, []);

  const addToDashboard = (socket = null) => {
    console.log('addToDashboard', socket);
    console.log(deconstructSocketId(socket.getSocketId()));
    console.log(layouts);
    const newCurrentLayout = layouts[breakPoint];
    newCurrentLayout.push({
      i: socket.getSocketId(),
      x: (newCurrentLayout.length * 2) % columns,
      y: Infinity, // puts it at the bottom
      w: 2,
      h: 2,
    });
    console.log(newCurrentLayout);
    // setLayouts({ ...layouts });
    setSocketsToInspect([...socketsToInspect, socket]);
  };

  const onWidthChange = (
    containerWidth: number,
    margin: [number, number],
    cols: number,
    containerPadding: [number, number],
  ) => {
    console.log(containerWidth, margin, cols, containerPadding);
  };

  const onLayoutChange = (currentLayout, allLayouts) => {
    console.log(currentLayout, allLayouts);
  };

  const onBreakpointChange = (breakpoint, cols) => {
    console.log(breakpoint, cols);
    setBreakPoint(breakPoint);
    setColumns(cols);
  };

  return (
    // <Box sx={{ position: 'relative', zIndex: 2000, background: 'black' }}>
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      style={{ zIndex: 1, pointerEvents: 'none' }}
      margin={[8, 8]}
      rowHeight={48}
      onLayoutChange={onLayoutChange}
      onBreakpointChange={onBreakpointChange}
      onWidthChange={onWidthChange}
    >
      {layouts.lg.map((item) => {
        if (item.i === 'placeholder') {
          return (
            <Box key={item.i} sx={{ background: 'red', pointerEvents: 'auto' }}>
              <span className="text">{`${item.i}: ${JSON.stringify(
                item,
                null,
                2,
              )}`}</span>
            </Box>
          );
        }
        const { nodeId, socketType, socketName } = deconstructSocketId(item.i);
        console.log(item, nodeId, socketType, socketName);
        const socket = PPGraph.currentGraph
          .getNodeById(nodeId)
          .getSocketByNameAndType(socketName, socketType);
        return (
          <Box key={item.i} sx={{ background: 'blue', pointerEvents: 'auto' }}>
            <SocketContainer
              triggerScrollIntoView={false}
              key={item.i}
              property={socket}
              index={0}
              dataType={socket.dataType}
              isInput={socket.isInput()}
              hasLink={socket.hasLink()}
              data={socket.data}
              randomMainColor={props.randomMainColor}
              selectedNode={socket.getNode() as PPNode}
            />
          </Box>
        );
      })}
    </ResponsiveGridLayout>
    // </Box>
  );
};

export default GraphOverlayDashboard;

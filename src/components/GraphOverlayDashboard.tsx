import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { SocketContainer } from '../SocketContainer';
import PPNode from '../classes/NodeClass';
import InterfaceController from '../InterfaceController';
import PPGraph from '../classes/GraphClass';
import PPSocket from '../classes/SocketClass';
import { deconstructSocketId } from '../utils/utils';
import { LAYOUTS_EMPTY } from '../utils/constants';

type GraphOverlayDashboardProps = {
  randomMainColor: string;
};

const GraphOverlayDashboard: React.FunctionComponent<
  GraphOverlayDashboardProps
> = (props) => {
  const [layouts, setLayouts] = useState(LAYOUTS_EMPTY);
  const [currentLayout, setCurrentLayout] = useState([]);
  const [columns, setColumns] = useState(12);
  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);

  useEffect(() => {
    InterfaceController.onAddToDashboard = addToDashboard;
    InterfaceController.onRemoveFromDashboard = removeFromDashboard;
  }, []);

  useEffect(() => {
    console.log(layouts);
    if (PPGraph.currentGraph?.layouts) {
      console.log(PPGraph.currentGraph.layouts);
      setLayouts(PPGraph.currentGraph.layouts);
      setCurrentLayout(
        JSON.parse(JSON.stringify(PPGraph.currentGraph.layouts.layout1)),
      );
    }
  }, [PPGraph.currentGraph?.layouts]);

  const addToDashboard = (socket: PPSocket) => {
    console.log('addToDashboard', socket);
    console.log(deconstructSocketId(socket.getSocketId()));
    console.log(layouts);
    const newCurrentLayout = JSON.parse(
      JSON.stringify(PPGraph.currentGraph.layouts.layout1),
    );
    const socketId = socket.getSocketId();
    const socketIdExists = newCurrentLayout.find((item) => item.i === socketId);
    const size = socket.dataType.getInputWidgetSize();
    if (!socketIdExists) {
      newCurrentLayout.push({
        i: socketId,
        x: (newCurrentLayout.length * 2) % columns,
        y: Infinity, // puts it at the bottom
        w: size.w,
        h: size.h,
        minW: size.minW,
        minH: size.minH,
      });
      console.log(newCurrentLayout);
      setCurrentLayout(newCurrentLayout);
    }
  };

  const removeFromDashboard = (socket: PPSocket) => {
    console.log('removeFromDashboard', socket);
    console.log(deconstructSocketId(socket.getSocketId()));
    console.log(layouts);
    const currentLayout = JSON.parse(
      JSON.stringify(PPGraph.currentGraph.layouts.layout1),
    );
    const socketId = socket.getSocketId();
    const newLayout = currentLayout.filter((item) => item.i !== socketId);
    setCurrentLayout(newLayout);
  };

  const onWidthChange = (
    containerWidth: number,
    margin: [number, number],
    cols: number,
    containerPadding: [number, number],
  ) => {
    // console.log(containerWidth, margin, cols, containerPadding);
    setColumns(cols);
  };

  const onLayoutChange = (currentLayout, allLayouts) => {
    console.log(currentLayout, allLayouts);
    if (PPGraph.currentGraph && currentLayout.length > 1) {
      PPGraph.currentGraph.layouts.layout1 = currentLayout;
    }
  };

  return (
    // <Box sx={{ position: 'relative', zIndex: 2000, background: 'black' }}>
    <ResponsiveGridLayout
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      className="layout"
      layouts={{ lg: currentLayout }}
      style={{ zIndex: 1, pointerEvents: 'none' }}
      margin={[8, 8]}
      rowHeight={48}
      onLayoutChange={onLayoutChange}
      onWidthChange={onWidthChange}
      draggableHandle=".dragHandle"
      resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
    >
      {currentLayout.map((item) => {
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
        // console.log(item, nodeId, socketType, socketName);
        const socket = PPGraph.currentGraph
          .getNodeById(nodeId)
          .getSocketByNameAndType(socketName, socketType);
        return (
          <Box
            key={item.i}
            sx={{
              background: 'blue',
              pointerEvents: 'auto',
              filter: 'drop-shadow(0px 0px 24px rgba(0, 0, 0, 0.15))',
            }}
          >
            {/* <Box
              sx={{ width: '100%', height: '16px' }}
              className="dragHandle"
            ></Box> */}
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
              onDashboard={true}
            />
          </Box>
        );
      })}
    </ResponsiveGridLayout>
    // </Box>
  );
};

export default GraphOverlayDashboard;

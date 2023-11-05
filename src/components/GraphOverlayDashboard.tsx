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
import { LAYOUTS_EMPTY } from '../utils/constants';

type GraphOverlayDashboardProps = {
  randomMainColor: string;
  selectedNodes: PPNode[];
};

const GraphOverlayDashboard: React.FunctionComponent<
  GraphOverlayDashboardProps
> = (props) => {
  // const [socketInspectorPosition, setSocketInspectorPosition] =
  //   useState<PIXI.Point>(new PIXI.Point(0, 0));
  // const [socketsToInspect, setSocketsToInspect] = useState<PPSocket[]>([]);
  const singleNode = props.selectedNodes.length ? props.selectedNodes[0] : null;
  const [selectedNode, setSelectedNode] = useState(singleNode);
  const [layouts, setLayouts] = useState(
    PPGraph.currentGraph?.layouts || LAYOUTS_EMPTY,
  );

  // const layouts = {
  //   lg: [
  //     { i: 'a', x: 0, y: 0, w: 1, h: 2, static: true },
  //     { i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4 },
  //     { i: 'c', x: 4, y: 0, w: 1, h: 2 },
  //   ],
  // };

  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);

  useEffect(() => {
    const newSelectedNode =
      props.selectedNodes.length > 0 ? props.selectedNodes?.[0] : null;
    setSelectedNode(newSelectedNode);
  }, [props.selectedNodes]);

  const generateLayout = useCallback(() => {
    const layout = _.map(
      _.range(0, selectedNode?.getAllSockets()?.length || 10),
      function (item, i) {
        const y = Math.ceil(Math.random() * 1) + 1;
        return {
          x: (_.random(0, 5) * 2) % 12,
          y: Math.floor(i / 6) * y,
          w: 2,
          h: y,
          i: i.toString(),
          static: Math.random() < 0.05,
        };
      },
    );
    console.log(layout);
    return layout;
  }, [selectedNode]);

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
    >
      {layouts.lg.map((socket, index) => {
        console.log(index, socket);
        if (socket.i === 'placeholder') {
          return (
            <Box
              key={socket.i}
              sx={{ background: 'red', pointerEvents: 'auto' }}
            >
              <span className="text">{`${socket.i}: ${JSON.stringify(
                socket,
                null,
                2,
              )}`}</span>
            </Box>
          );
        }
        return (
          <SocketContainer
            triggerScrollIntoView={false}
            key={index}
            property={socket}
            index={0}
            dataType={socket.dataType}
            isInput={socket.isInput()}
            hasLink={socket.hasLink()}
            data={socket.data}
            randomMainColor={props.randomMainColor}
            selectedNode={socket.getNode() as PPNode}
          />
        );
      })}
    </ResponsiveGridLayout>
    // </Box>
  );
};

export default GraphOverlayDashboard;

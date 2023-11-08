import React, { useEffect, useMemo, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ClearIcon from '@mui/icons-material/Clear';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { SocketBody } from '../SocketContainer';
import PPNode from '../classes/NodeClass';
import InterfaceController from '../InterfaceController';
import PPGraph from '../classes/GraphClass';
import PPSocket from '../classes/SocketClass';
import { AbstractType } from '../nodes/datatypes/abstractType';
import { ensureVisible, zoomToFitNodes } from '../pixi/utils-pixi';
import { deconstructSocketId } from '../utils/utils';
import { ONCLICK_DOUBLECLICK, ONCLICK_TRIPPLECLICK } from '../utils/constants';

type GraphOverlayDashboardProps = {
  randomMainColor: string;
};

const GraphOverlayDashboard: React.FunctionComponent<
  GraphOverlayDashboardProps
> = (props) => {
  const [currentLayout, setCurrentLayout] = useState([]);
  // const [columns, setColumns] = useState(12);
  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);

  useEffect(() => {
    InterfaceController.onAddToDashboard = addToDashboard;
    InterfaceController.onRemoveFromDashboard = removeFromDashboard;
  }, []);

  useEffect(() => {
    if (PPGraph.currentGraph?.layouts) {
      console.log(PPGraph.currentGraph.layouts);
      const newCurrentLayout = JSON.parse(
        JSON.stringify(PPGraph.currentGraph.layouts.layout1),
      );
      console.log(newCurrentLayout);
      setCurrentLayout(newCurrentLayout);
    }
  }, [PPGraph.currentGraph?.layouts]);

  const addToDashboard = (socket: PPSocket) => {
    setCurrentLayout((prevLayout) => {
      console.log('addToDashboard', socket);
      console.log(deconstructSocketId(socket.getSocketId()));
      const socketId = socket.getSocketId();
      const socketIdExists = prevLayout.find((item) => item.i === socketId);
      // const size = socket.dataType.getInputWidgetSize();
      const size = socket.isInput
        ? socket.dataType.getInputWidgetSize()
        : socket.dataType.getOutputWidgetSize();

      if (!socketIdExists) {
        const newItem = {
          i: socketId,
          x: 0,
          y: 0,
          w: size.w,
          h: size.h,
          minW: size.minW,
          minH: size.minH,
        };
        return [...prevLayout, newItem];
      }
      return prevLayout;
    });
  };

  const removeFromDashboard = (socket: PPSocket) => {
    console.log('removeFromDashboard', socket);
    setCurrentLayout((prevLayout) => {
      const newLayout = prevLayout.filter(
        (item) => item.i !== socket.getSocketId(),
      );
      return newLayout;
    });
  };

  const onWidthChange = (
    containerWidth: number,
    margin: [number, number],
    cols: number,
    containerPadding: [number, number],
  ) => {
    // console.log(containerWidth, margin, cols, containerPadding);
    // setColumns(cols);
  };

  const onLayoutChange = (currLayout, allLayouts) => {
    console.log('onLayoutChange', currLayout, allLayouts);
    if (PPGraph.currentGraph) {
      PPGraph.currentGraph.layouts.layout1 = currLayout;
      setCurrentLayout(currLayout);
    }
  };

  return (
    <Box
      id="dashboard-container"
      sx={{
        position: 'absolute',
        pointerEvents: 'none',
        height: '100vh !important',
        width: 'calc(100% - 320px)',
        overflow: 'auto',
        left: '320px',
      }}
    >
      <ResponsiveGridLayout
        breakpoints={{ lg: 1200, sm: 768, xxs: 0 }}
        cols={{ lg: 12, sm: 6, xxs: 4 }}
        className="layout"
        layouts={{ lg: currentLayout }}
        style={{
          zIndex: 1,
          pointerEvents: 'none',
          filter: 'drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.5))',
          // filter: 'drop-shadow(0px 0px 24px rgba(0, 0, 0, 0.5))',
        }}
        margin={[4, 4]}
        rowHeight={56}
        onLayoutChange={onLayoutChange}
        onWidthChange={onWidthChange}
        draggableHandle=".dragHandle"
        resizeHandles={['s', 'w', 'e', 'sw', 'se']}
      >
        {currentLayout.map((item) => {
          if (item.i === 'placeholder') {
            return <EmptyDashboardWidget item={item} />;
          }
          const { nodeId, socketType, socketName } = deconstructSocketId(
            item.i,
          );
          // console.log(item, nodeId, socketType, socketName);
          const node = PPGraph.currentGraph.getNodeById(nodeId);
          if (!node) {
            return <EmptyDashboardWidget item={item} />;
          }
          const socket = node.getSocketByNameAndType(socketName, socketType);
          return (
            <Box
              key={item.i}
              sx={{
                pointerEvents: 'auto',
                // background: `${Color(props.randomMainColor).alpha(0.98)}`,
                bgcolor: 'background.paper',
              }}
            >
              <DashboardWidgetContainer
                triggerScrollIntoView={false}
                key={item.i}
                property={socket}
                index={item.i}
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
    </Box>
  );
};

export default GraphOverlayDashboard;

type DashboardWidgetContainerProps = {
  triggerScrollIntoView: boolean;
  property: PPSocket;
  index: number;
  dataType: AbstractType;
  isInput: boolean;
  hasLink: boolean;
  data: any;
  randomMainColor: string;
  selectedNode: PPNode;
  onDashboard?: boolean;
};

export const DashboardWidgetContainer: React.FunctionComponent<
  DashboardWidgetContainerProps
> = (props) => {
  const [dataTypeValue, setDataTypeValue] = useState(props.dataType);
  const baseProps = {
    key: props.dataType.getName(),
    property: props.property,
    index: props.index,
    isInput: props.isInput,
    hasLink: props.hasLink,
    data: props.data,
    randomMainColor: props.randomMainColor,
  };

  const widget = props.isInput
    ? dataTypeValue.getInputWidget(baseProps)
    : dataTypeValue.getOutputWidget(baseProps);

  useEffect(() => {
    setDataTypeValue(props.dataType);
  }, [props.dataType]);

  return (
    <Box
      id={`inspector-socket-${props.dataType.getName()}`}
      sx={{
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <DashboardWidgetHeader
        key={`SocketHeader-${props.dataType.getName()}`}
        property={props.property}
        selectedNode={props.selectedNode}
        index={props.index}
        isInput={props.isInput}
        hasLink={props.hasLink}
        randomMainColor={props.randomMainColor}
      />
      <Box
        sx={{
          p: 1,
          height: 'calc(100% - 32px)',
          bgcolor: 'background.default',
          overflow: 'auto',
        }}
      >
        <SocketBody
          property={props.property}
          randomMainColor={props.randomMainColor}
          selectedNode={props.selectedNode}
          widget={widget}
        />
      </Box>
    </Box>
  );
};

type DashboardWidgetHeaderProps = {
  property: PPSocket;
  selectedNode: PPNode;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  randomMainColor: string;
};

const DashboardWidgetHeader: React.FunctionComponent<
  DashboardWidgetHeaderProps
> = (props) => {
  const locked = !props.isInput || props.hasLink;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        width: '100%',
        color: 'text.secondary',
        justifyContent: 'space-between',
        height: '32px',
      }}
      onPointerEnter={(event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        const nodeToJumpTo = props.selectedNode;
        if (nodeToJumpTo) {
          PPGraph.currentGraph.selection.drawSingleFocus(nodeToJumpTo);
        }
      }}
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        const nodeToJumpTo = props.selectedNode;
        if (nodeToJumpTo) {
          if (event.detail === ONCLICK_DOUBLECLICK) {
            ensureVisible([nodeToJumpTo]);
            setTimeout(() => {
              PPGraph.currentGraph.selection.drawSingleFocus(nodeToJumpTo);
            }, 800);
          } else if (event.detail === ONCLICK_TRIPPLECLICK) {
            zoomToFitNodes([nodeToJumpTo], -0.5);
          }
        }
      }}
    >
      <Box
        className="dragHandle"
        title={props.property.getNode().id}
        sx={{
          pl: 1,
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          cursor: 'move',
          width: 'calc(100% - 32px)',
        }}
      >
        {locked && <LockIcon sx={{ fontSize: '16px', opacity: 0.5 }} />}
        <Box
          sx={{
            pl: 0.5,
            pt: 0.3,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >{`${props.property.getNode().name} > ${props.property.name}`}</Box>
      </Box>
      <Box sx={{ flex: '1' }}></Box>{' '}
      <IconButton
        title="Remove from dashboard"
        size="small"
        onClick={() => {
          InterfaceController.onRemoveFromDashboard(props.property);
        }}
        sx={{
          borderRadius: 0,
        }}
      >
        <ClearIcon sx={{ fontSize: '12px' }} />
      </IconButton>
      {/* </Box> */}
    </Box>
  );
};

function EmptyDashboardWidget({ item }) {
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

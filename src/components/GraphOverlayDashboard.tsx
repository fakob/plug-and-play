import React, { useEffect, useMemo, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import Color from 'color';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { CustomSocketInjection } from '../SocketContainer';
import PPNode from '../classes/NodeClass';
import InterfaceController from '../InterfaceController';
import PPGraph from '../classes/GraphClass';
import PPSocket from '../classes/SocketClass';
import { AbstractType } from '../nodes/datatypes/abstractType';
import { deconstructSocketId, writeDataToClipboard } from '../utils/utils';

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
    }
  };

  return (
    // <Box sx={{ position: 'relative', zIndex: 2000, background: 'black' }}>
    <ResponsiveGridLayout
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      className="layout"
      layouts={{ lg: currentLayout }}
      style={{
        zIndex: 1,
        pointerEvents: 'none',
        filter: 'drop-shadow(0px 0px 24px rgba(0, 0, 0, 0.5))',
      }}
      margin={[2, 2]}
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
        const { nodeId, socketType, socketName } = deconstructSocketId(item.i);
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
    // </Box>
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
  showHeader?: boolean;
  selectedNode: PPNode;
  onDashboard?: boolean;
};

export const DashboardWidgetContainer: React.FunctionComponent<
  DashboardWidgetContainerProps
> = (props) => {
  const { showHeader = true } = props;
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
        // p: 1,
      }}
    >
      {showHeader && (
        <DashboardWidgetHeader
          key={`SocketHeader-${props.dataType.getName()}`}
          property={props.property}
          index={props.index}
          isInput={props.isInput}
          hasLink={props.hasLink}
          randomMainColor={props.randomMainColor}
        />
      )}
      <Box
        sx={{
          p: 1,
          height: 'calc(100% - 40px)',
          bgcolor: 'background.default',
          overflow: 'auto',
        }}
      >
        {props.property.custom?.inspectorInjection && (
          <CustomSocketInjection
            InjectionContent={
              props.property.custom?.inspectorInjection?.reactComponent
            }
            props={{
              ...props.property.custom?.inspectorInjection?.props,
              randomMainColor: props.randomMainColor,
              selectedNode: props.selectedNode,
            }}
          />
        )}
        {widget}
      </Box>
    </Box>
  );
};

type DashboardWidgetHeaderProps = {
  property: PPSocket;
  index: number;
  isInput: boolean;
  hasLink: boolean;
  randomMainColor: string;
};

const DashboardWidgetHeader: React.FunctionComponent<
  DashboardWidgetHeaderProps
> = (props) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        width: '100%',
        bgcolor: 'background.default',
        justifyContent: 'space-between', // Add this to the parent container
      }}
    >
      <Box
        className="dragHandle"
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'move',
          width: '100%',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: 'inline-flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Box
            sx={{
              pl: 1,
              color: 'text.primary',
              // width: '100%',
            }}
          >{`${props.property.getNode().name} > ${props.property.name}`}</Box>
          {(!props.isInput || props.hasLink) && (
            <LockIcon sx={{ pl: '2px', fontSize: '16px', opacity: 0.5 }} />
          )}
          <IconButton
            size="small"
            onClick={() => writeDataToClipboard(props.property?.data)}
            sx={{
              borderRadius: 0,
            }}
          >
            <ContentCopyIcon sx={{ fontSize: '12px' }} />
          </IconButton>
        </Box>
        <Box sx={{ flex: '1' }}></Box>{' '}
        <IconButton
          title="Remove from dashboard"
          aria-label="more"
          id="select-type"
          aria-controls="long-menu"
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={() => {
            InterfaceController.onRemoveFromDashboard(props.property);
          }}
          sx={{
            borderRadius: 0,
            // position: 'absolute',
            // right: 0,
          }}
        >
          <ClearIcon />
        </IconButton>
      </Box>
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

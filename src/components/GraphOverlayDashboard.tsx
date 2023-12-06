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
import { AbstractType, DataTypeProps } from '../nodes/datatypes/abstractType';
import { ensureVisible, zoomToFitNodes } from '../pixi/utils-pixi';
import { deconstructSocketId } from '../utils/utils';
import {
  DEFAULT_DRAWER_WIDTH,
  ONCLICK_DOUBLECLICK,
  ONCLICK_TRIPPLECLICK,
} from '../utils/constants';
import { TSocketId } from '../utils/interfaces';

type GraphOverlayDashboardProps = {
  randomMainColor: string;
  toggleLeft: boolean;
};

const GraphOverlayDashboard: React.FunctionComponent<
  GraphOverlayDashboardProps
> = (props) => {
  const [currentLayout, setCurrentLayout] = useState([]);
  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);
  const [leftDrawerWidth, setLeftDrawerWidth] = useState(
    props.toggleLeft ? DEFAULT_DRAWER_WIDTH : 0,
  );
  const [showDashboard, setShowDashboard] = useState(true);

  useEffect(() => {
    InterfaceController.onAddToDashboard = addToDashboard;
    InterfaceController.onRemoveFromDashboard = removeFromDashboard;
    InterfaceController.onDrawerSizeChanged = drawerSizeChanged;
    InterfaceController.toggleShowDashboard = (open) =>
      setShowDashboard((prev) => open ?? !prev);
  }, []);

  useEffect(() => {
    if (PPGraph.currentGraph?.layouts) {
      const newCurrentLayout = JSON.parse(
        JSON.stringify(PPGraph.currentGraph.layouts.default),
      );
      setCurrentLayout(newCurrentLayout);
    }
  }, [PPGraph.currentGraph?.layouts]);

  const addToDashboard = (socket: PPSocket) => {
    InterfaceController.toggleShowDashboard(true);
    setCurrentLayout((prevLayout) => {
      const socketId = socket.getSocketId();
      const socketIdExists = prevLayout.find((item) => item.i === socketId);
      const size = socket.isInput()
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

  const removeFromDashboard = (socketId: TSocketId) => {
    setCurrentLayout((prevLayout) =>
      prevLayout.filter((item) => item.i !== socketId),
    );
  };

  const drawerSizeChanged = (leftWidth: number, rightWidth: number) => {
    setLeftDrawerWidth(leftWidth);
  };

  const onLayoutChange = (currLayout) => {
    if (PPGraph.currentGraph) {
      PPGraph.currentGraph.layouts.default = currLayout;
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
        width: `calc(100% - ${leftDrawerWidth}px)`,
        overflow: 'auto',
        left: `${leftDrawerWidth}px`,
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
          visibility: showDashboard ? 'visible' : 'hidden',
        }}
        margin={[4, 4]}
        containerPadding={props.toggleLeft ? [4, 12] : [4, 4]}
        rowHeight={64}
        onLayoutChange={onLayoutChange}
        draggableHandle=".MyDragHandleClassName"
        resizeHandles={['s', 'w', 'e', 'sw', 'se']}
        resizeHandle={<MyHandle />}
      >
        {currentLayout.map((item) => {
          const { nodeId, socketType, socketName } = deconstructSocketId(
            item.i,
          );
          const node = PPGraph.currentGraph.getNodeById(nodeId);
          if (!node) {
            removeFromDashboard(item.i);
            return;
          }
          const socket = node.getSocketByNameAndType(socketName, socketType);
          return (
            <Box
              key={item.i}
              sx={{
                pointerEvents: 'auto',
                bgcolor: 'background.paper',
              }}
            >
              <DashboardWidgetContainer
                key={item.i}
                property={socket}
                index={item.i}
                dataType={socket.dataType}
                isInput={socket.isInput()}
                hasLink={socket.hasLink()}
                data={socket.data}
                randomMainColor={props.randomMainColor}
                selectedNode={socket.getNode()}
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
  property: PPSocket;
  index: number;
  dataType: AbstractType;
  isInput: boolean;
  hasLink: boolean;
  data: any;
  randomMainColor: string;
  selectedNode: PPNode;
};

export const DashboardWidgetContainer: React.FunctionComponent<
  DashboardWidgetContainerProps
> = (props) => {
  const [dataTypeValue, setDataTypeValue] = useState(props.dataType);
  const baseProps: DataTypeProps = {
    key: props.dataType.getName(),
    property: props.property,
    index: props.index,
    isInput: props.isInput,
    hasLink: props.hasLink,
    randomMainColor: props.randomMainColor,
    dataType: props.dataType,
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
        isInput={props.isInput}
        hasLink={props.hasLink}
      />
      <Box
        sx={{
          p: 0.5,
          height: 'calc(100% - 24px)',
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
  isInput: boolean;
  hasLink: boolean;
};

const DashboardWidgetHeader: React.FunctionComponent<
  DashboardWidgetHeaderProps
> = (props) => {
  const locked = !props.isInput || props.hasLink;
  const headerText = `${props.property.getNode().name} > ${
    props.property.name
  }`;

  return (
    <Box
      className="MyDragHandleClassName"
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        width: '100%',
        color: 'text.secondary',
        justifyContent: 'space-between',
        height: '24px',
        userSelect: 'none',
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
        title={headerText}
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
        >
          {headerText}
        </Box>
      </Box>
      <Box sx={{ flex: '1' }}></Box>{' '}
      <IconButton
        title="Remove from dashboard"
        size="small"
        onClick={() => {
          InterfaceController.onRemoveFromDashboard(
            props.property.getSocketId(),
          );
        }}
        sx={{
          borderRadius: 0,
        }}
      >
        <ClearIcon sx={{ fontSize: '20px' }} />
      </IconButton>
    </Box>
  );
};

const MyHandle = React.forwardRef<HTMLInputElement, { handleAxis?: string }>(
  (props, ref) => {
    const { handleAxis, ...restProps } = props;
    return (
      <Box
        ref={ref}
        className={`react-resizable-handle react-resizable-handle-${handleAxis}`}
        {...restProps}
        sx={{
          zIndex: 100,
        }}
      />
    );
  },
);

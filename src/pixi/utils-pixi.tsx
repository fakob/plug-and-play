import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { ActionHandler } from '../utils/actionHandler';
import { getCurrentCursorPosition } from '../utils/utils';

export const getTextWithLineBreaks = (node: any): string => {
  // we only deal with TextNodes
  if (!node || !node.parentNode || node.nodeType !== 3) return '';
  // our Range object form which we'll get the characters positions
  const range = document.createRange();
  // here we'll store all our lines
  const lines = [];
  // begin at the first char
  range.setStart(node, 0);
  // initial position
  let prevBottom = range.getBoundingClientRect().bottom;
  const str = node.textContent;
  let current = 1; // we already got index 0
  let lastFound = 0;
  let bottom = 0;
  // iterate over all characters
  while (current <= str.length) {
    // move our cursor
    range.setStart(node, current);
    if (current < str.length - 1) range.setEnd(node, current + 1);
    bottom = range.getBoundingClientRect().bottom;
    if (bottom > prevBottom) {
      // line break
      lines.push(
        str.substr(lastFound, current - lastFound), // text content
      );
      prevBottom = bottom;
      lastFound = current;
    }
    current++;
  }
  // push the last line
  lines.push(str.substr(lastFound));

  return lines.join('\n');
};

export const getObjectsInsideBounds = (
  nodes: PPNode[],
  selectionRect: PIXI.Rectangle,
): PPNode[] => {
  // console.log(selectionRect);
  return nodes
    .filter((node) => node.selectableViaBounds())
    .filter((node) =>
      doRectsIntersect(selectionRect, node.getSelectionBounds()),
    );
};

export const doRectsIntersect = (
  firstRect: PIXI.Rectangle,
  secondRect: PIXI.Rectangle,
): boolean => {
  return (
    Math.max(firstRect.x, secondRect.x) <
      Math.min(
        firstRect.x + firstRect.width,
        secondRect.x + secondRect.width,
      ) &&
    Math.max(firstRect.y, secondRect.y) <
      Math.min(firstRect.y + firstRect.height, secondRect.y + secondRect.height)
  );
};

export function drawDottedLine(
  graphics: PIXI.Graphics,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  interval: number,
) {
  const deltaX: number = endX - startX;
  const deltaY: number = endY - startY;
  const totalDist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
  const segments = totalDist / interval;
  const segmentLengthX = deltaX / segments;
  const segmentLengthY = deltaY / segments;
  for (let i = 0; i < segments - 1; i += 2) {
    graphics.moveTo(startX + i * segmentLengthX, startY + i * segmentLengthY);
    graphics.lineTo(
      startX + (i + 1) * segmentLengthX,
      startY + (i + 1) * segmentLengthY,
    );
  }
}

export const getNodesBounds = (nodes: PPNode[]): PIXI.Rectangle => {
  let bounds = new PIXI.Rectangle();
  nodes.forEach((node: PIXI.DisplayObject, index: number) => {
    const tempRect = node.getLocalBounds();
    // move rect to get bounds local to nodeContainer
    tempRect.x += node.transform.position.x;
    tempRect.y += node.transform.position.y;
    if (index === 0) {
      bounds = tempRect;
    }
    bounds.enlarge(tempRect);
  });
  return bounds;
};

export const zoomToFitNodes = (
  nodes?: PPNode[],
  initZoomOutFactor = undefined,
): void => {
  const currentGraph = PPGraph.currentGraph;
  let boundsToZoomTo: PIXI.Rectangle;
  let zoomOutFactor: number;

  if (nodes === undefined || nodes.length < 1) {
    boundsToZoomTo = currentGraph.nodeContainer.getLocalBounds(); // get bounds of the whole nodeContainer
    zoomOutFactor = -0.2;
  } else {
    boundsToZoomTo = getNodesBounds(nodes);
    zoomOutFactor = -0.3;
  }

  currentGraph.viewport.moveCenter(
    boundsToZoomTo.x + boundsToZoomTo.width / 2,
    boundsToZoomTo.y + boundsToZoomTo.height / 2,
  );
  currentGraph.viewport.fit(true, boundsToZoomTo.width, boundsToZoomTo.height);
  currentGraph.viewport.zoomPercent(initZoomOutFactor || zoomOutFactor, true); // zoom out a bit more
  currentGraph.selection.drawRectanglesFromSelection();
  emitMoved();
};

export function smoothMoveViewport(point: PIXI.Point, scale: number) {
  PPGraph.currentGraph.viewport.animate({
    position: point,
    scale: scale,
    ease: 'easeOutExpo',
    time: 750,
  });
  emitMoved();
}

export function zoomInOutViewport(zoomIn) {
  PPGraph.currentGraph.viewport.zoomPercent(zoomIn ? 0.2 : -0.2, true);
  emitMoved();
}

export function emitMoved() {
  PPGraph.currentGraph.viewport.emit('moved', {
    viewport: PPGraph.currentGraph.viewport,
    type: 'pinch',
  });
}

export const ensureVisible = (nodes: PPNode[], undoable = false): void => {
  const currentGraph = PPGraph.currentGraph;

  const action = async () => {
    let boundsToZoomTo: PIXI.Rectangle;

    if (nodes.length < 1) {
      boundsToZoomTo = currentGraph.nodeContainer.getLocalBounds(); // get bounds of the whole nodeContainer
    } else {
      boundsToZoomTo = getNodesBounds(nodes);
    }
    const fitScale = currentGraph.viewport.findFit(
      boundsToZoomTo.width,
      boundsToZoomTo.height,
    );
    const fitScaleWithViewport = fitScale / currentGraph.viewportScaleX;
    const scale = fitScaleWithViewport < 1 ? fitScale / 2 : undefined; // only zoom out if necessary
    const position = new PIXI.Point(
      boundsToZoomTo.x + boundsToZoomTo.width / 2,
      boundsToZoomTo.y + boundsToZoomTo.height / 2,
    );
    smoothMoveViewport(position, scale);
  };

  if (undoable) {
    const positionPre = getCurrentCursorPosition();
    const scalePre = currentGraph.viewport.scale.x;
    const undoAction = async () => smoothMoveViewport(positionPre, scalePre);
    ActionHandler.performAction(action, undoAction, 'Move Viewport', true);
  } else {
    action();
  }
};

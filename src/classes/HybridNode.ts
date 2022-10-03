/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-this-alias */

import PPNode from './NodeClass';

import { createRoot, Root } from 'react-dom/client';
import PPGraph from './GraphClass';
import styles from '../utils/style.module.css';
import { SerializedNode } from '../utils/interfaces';
import * as PIXI from 'pixi.js';
export default class HybridNode extends PPNode {
  container: HTMLElement;

  // • creates a container component
  // • adds the onNodeDragOrViewportMove listener to it
  // • adds a react parent component with props
  createContainerComponent(
    parentDocument: Document,
    reactParent,
    reactProps,
    customStyles = {}
  ): HTMLElement {
    const { margin = 0 } = reactProps;
    const reactElement = parentDocument.createElement('div');
    this.container = parentDocument.body.appendChild(reactElement);
    this.root = createRoot(this.container!);
    this.container.id = `Container-${this.id}`;

    const screenPoint = this.screenPoint();
    const scaleX = PPGraph.currentGraph.viewport.scale.x;
    this.container.classList.add(styles.hybridContainer);
    Object.assign(this.container.style, customStyles);

    // set initial position
    this.container.style.width = `${this.nodeWidth - (2 * margin) / scaleX}px`;
    this.container.style.height = `${
      this.nodeHeight - (2 * margin) / scaleX
    }px`;
    this.container.style.transform = `translate(50%, 50%)`;
    this.container.style.transform = `scale(${scaleX}`;
    this.container.style.left = `${screenPoint.x + margin}px`;
    this.container.style.top = `${screenPoint.y + margin}px`;

    this.onNodeDragOrViewportMove = ({ screenX, screenY, scale }) => {
      this.container.style.width = `${this.nodeWidth - (2 * margin) / scale}px`;
      this.container.style.height = `${
        this.nodeHeight - (2 * margin) / scale
      }px`;
      // this.container.style.transform = `translate(50%, 50%)`;
      this.container.style.transform = `scale(${scale}`;
      this.container.style.left = `${screenX + margin}px`;
      this.container.style.top = `${screenY + margin}px`;
    };

    this.onViewportPointerUpHandler = this._onViewportPointerUp.bind(this);

    // when the Node is removed also remove the react component and its container
    this.onNodeRemoved = () => {
      this.removeContainerComponent(this.container, this.root);
    };

    // render react component
    this.renderReactComponent(
      reactParent,
      {
        ...reactProps,
      },
      this.root
    );

    return this.container;
  }

  configure(nodeConfig: SerializedNode): void {
    super.configure(nodeConfig);
    this._onViewportMove(); // trigger this once, so the react components get positioned properly
  }

  setPosition(x: number, y: number, isRelative = false): void {
    super.setPosition(x, y, isRelative);
    this._onViewportMove(); // trigger this once, so the react components get positioned properly
  }

  resizeNode(width: number, height: number, maintainAspectRatio = false): void {
    super.resizeNode(width, height, maintainAspectRatio);
    this.container.style.width = `${this.nodeWidth}px`;
    this.container.style.height = `${this.nodeHeight}px`;
  }

  _onDoubleClick(event: PIXI.InteractionEvent): void {
    super._onDoubleClick(event);
    // turn on pointer events for hybrid nodes so the react components become reactive
    if (this.getActivateByDoubleClick()) {
      // register hybrid nodes to listen to outside clicks
      PPGraph.currentGraph.viewport.on(
        'pointerup',
        (this as any).onViewportPointerUpHandler
      );
      this.container.style.pointerEvents = 'auto';
      this.container.classList.add(styles.hybridContainerFocused);
    }
  }

  _onViewportPointerUp(): void {
    super._onViewportPointerUp();
    // unregister hybrid nodes from listening to outside clicks
    PPGraph.currentGraph.viewport.removeListener(
      'pointerup',
      (this as any).onViewportPointerUpHandler
    );
    this.doubleClicked = false;
    this.onNodeExit();
    // this allows to zoom and drag when the hybrid node is not selected
    this.container.style.pointerEvents = 'none';
    this.container.classList.remove(styles.hybridContainerFocused);
  }
}

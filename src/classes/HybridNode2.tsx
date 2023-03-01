/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-this-alias */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import styles from '../utils/style.module.css';
import { CustomArgs, SerializedNode, TRgba } from '../utils/interfaces';
import { RANDOMMAINCOLOR } from '../utils/constants';

function pixiToContainerNumber(value: number) {
  return `${Math.round(value)}px`;
}

export default abstract class HybridNode2 extends PPNode {
  root: Root;
  static: HTMLElement;
  staticRoot: Root;
  container: HTMLElement;
  initialData: any;

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.initialData = customArgs?.initialData;
  }

  // this function can be called for hybrid nodes, it
  // • creates a container component
  // • adds the onNodeDragOrViewportMove listener to it
  // • adds a react parent component with props
  createContainerComponent(reactProps, customStyles = {}): HTMLElement {
    const reactElement = document.createElement('div');
    this.container = document
      .getElementById('container')
      .appendChild(reactElement);
    this.root = createRoot(this.container!);
    this.container.id = `Container-${this.id}`;

    const screenPoint = this.screenPoint();
    const scale = PPGraph.currentGraph.viewportScaleX;
    this.container.classList.add(styles.hybridContainer);
    Object.assign(this.container.style, customStyles);

    // set initial position
    this.container.style.width = `${this.nodeWidth}px`;
    this.container.style.height = `${this.nodeHeight}px`;
    //this.container.style.transform = `translate(50%, 50%)`;
    this.container.style.transform = `scale(${scale}`;
    this.container.style.left = `${screenPoint.x}px`;
    this.container.style.top = `${screenPoint.y}px`;

    this.onNodeDragOrViewportMove = ({ screenX, screenY, scale }) => {
      if (this.container.style.transform != `scale(${scale.toPrecision(3)})`) {
        this.container.style.transform = `scale(${scale.toPrecision(3)})`;
      }
      if (this.container.style.left != pixiToContainerNumber(screenX)) {
        this.container.style.left = pixiToContainerNumber(screenX);
      }
      if (this.container.style.top != pixiToContainerNumber(screenY)) {
        this.container.style.top = pixiToContainerNumber(screenY);
      }
    };

    this.onViewportPointerUpHandler = this._onViewportPointerUp.bind(this);

    // when the Node is removed also remove the react component and its container
    this.onNodeRemoved = () => {
      this.removeContainerComponent(this.container, this.root);
    };

    // render react component
    this.renderReactComponent(
      {
        ...reactProps,
      },
      this.root,
      this
    );

    return this.container;
  }

  protected abstract getParentComponent(inputObject: any): any;

  // the render method, takes a component and props, and renders it to the page
  renderReactComponent = (
    props: {
      [key: string]: any;
    },
    root = this.root,
    node: PPNode = this
  ): void => {
    root.render(
      <>
        <this.getParentComponent
          initialData={this.initialData} // positioned before the props so it can be overwritten by them
          {...props}
          id={this.id}
          selected={this.selected}
          doubleClicked={this.doubleClicked}
          randomMainColor={RANDOMMAINCOLOR}
          node={node}
        />
        {!this.doubleClicked && (
          <Button
            title={'Click to edit OR Double click node'}
            className={styles.hybridContainerEditButton}
            size="small"
            onClick={this._onDoubleClick.bind(this)}
            color="primary"
            sx={{
              background: RANDOMMAINCOLOR,
              color: TRgba.fromString(RANDOMMAINCOLOR)
                .getContrastTextColor()
                .hex(),
            }}
          >
            <EditIcon sx={{ fontSize: '16px' }} />
          </Button>
        )}
      </>
    );
  };

  removeContainerComponent(container: HTMLElement, root: Root): void {
    root.unmount();
    document.getElementById('container').removeChild(container);
  }

  protected onHybridNodeExit(): void {}

  configure(nodeConfig: SerializedNode): void {
    super.configure(nodeConfig);
    this._onViewportMove(); // trigger this once, so the react components get positioned properly
  }

  setPosition(x: number, y: number, isRelative = false): void {
    super.setPosition(x, y, isRelative);
    this._onViewportMove(); // trigger this once, so the react components get positioned properly
  }

  resizeAndDraw(
    width = this.nodeWidth,
    height = this.nodeHeight,
    maintainAspectRatio = false
  ): void {
    super.resizeAndDraw(width, height, maintainAspectRatio);
    if (this.container) {
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
    }
    this.execute();
  }

  _onDoubleClick(event: any): void {
    super._onDoubleClick(event);
    // turn on pointer events for hybrid nodes so the react components become reactive
    if (this.getActivateByDoubleClick()) {
      // register hybrid nodes to listen to outside clicks
      PPGraph.currentGraph.viewport.on(
        'pointerup',
        (this as any).onViewportPointerUpHandler
      );
      this.container.classList.add(styles.hybridContainerFocused);
      this.execute();
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
    this.onHybridNodeExit();
    // this allows to zoom and drag when the hybrid node is not selected
    this.container.classList.remove(styles.hybridContainerFocused);
    this.execute();
  }

  public executeOnPlace(): boolean {
    return true;
  }

  public getShrinkOnSocketRemove(): boolean {
    return false;
  }

  protected async onExecute(
    inputObject: unknown,
    outputObject: Record<string, unknown>
  ): Promise<void> {
    if (!this.container) {
      this.createContainerComponent(inputObject);
    } else {
      this.renderReactComponent(inputObject);
    }
  }
}

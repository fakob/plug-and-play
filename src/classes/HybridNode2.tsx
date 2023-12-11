/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-this-alias */

import * as PIXI from 'pixi.js';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import styles from '../utils/style.module.css';
import { CustomArgs, TNodeSource, TRgba } from '../utils/interfaces';
import {
  NINE_SLICE_SHADOW,
  NODE_MARGIN,
  NODE_CORNERRADIUS,
  RANDOMMAINCOLOR,
} from '../utils/constants';

function pixiToContainerNumber(value: number) {
  return `${Math.round(value)}px`;
}

const blurAmount = 48;

export default abstract class HybridNode2 extends PPNode {
  root: Root;
  static: HTMLElement;
  staticRoot: Root;
  container: HTMLElement;
  initialData: any;
  shadowPlane: PIXI.NineSlicePlane;
  listenId: string[] = [];

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.initialData = customArgs?.initialData;
  }

  public async onNodeAdded(source: TNodeSource): Promise<void> {
    this.shadowPlane = new PIXI.NineSlicePlane(
      PIXI.Texture.from(NINE_SLICE_SHADOW),
      blurAmount,
      blurAmount,
      blurAmount,
      blurAmount,
    );
    this.addChildAt(this.shadowPlane, 0);
    await super.onNodeAdded(source);
  }

  redraw({ screenX = 0, screenY = 0, scale = 1 }) {
    if (this.container.style.transform != `scale(${scale.toPrecision(3)})`) {
      this.container.style.transform = `scale(${scale.toPrecision(3)})`;
    }
    if (this.container.style.left != pixiToContainerNumber(screenX)) {
      this.container.style.left = pixiToContainerNumber(screenX);
    }
    if (this.container.style.top != pixiToContainerNumber(screenY)) {
      this.container.style.top = pixiToContainerNumber(screenY);
    }
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

    const scale = PPGraph.currentGraph.viewportScaleX;
    this.container.classList.add(styles.hybridContainer);
    Object.assign(this.container.style, customStyles);

    // set initial position
    this.container.style.width = `${this.nodeWidth}px`;
    this.container.style.height = `${this.nodeHeight}px`;
    this.container.style.transform = `scale(${scale}`;

    this.onNodeDragOrViewportMove = this.redraw;

    this.onViewportPointerUpHandler = this.onViewportPointerUp.bind(this);

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
      this,
    );

    this.refreshNodeDragOrViewportMove();

    return this.container;
  }

  protected abstract getParentComponent(inputObject: any): any;

  // the render method, takes a component and props, and renders it to the page
  renderReactComponent = (
    props: {
      [key: string]: any;
    },
    root = this.root,
    node: PPNode = this,
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
        <HybridNodeOverlay
          doubleClicked={this.doubleClicked}
          getActivateByDoubleClick={this.getActivateByDoubleClick()}
          isHovering={this.isHovering}
          onEditButtonClick={this.onEditButtonClick.bind(this)}
        />
      </>,
    );
  };

  removeContainerComponent(container: HTMLElement, root: Root): void {
    root.unmount();
    document.getElementById('container').removeChild(container);
  }

  protected onHybridNodeEnter(): void {}
  protected onHybridNodeExit(): void {}

  setPosition(x: number, y: number, isRelative = false): void {
    super.setPosition(x, y, isRelative);
    this.onViewportMove(); // trigger this once, so the react components get positioned properly
  }

  resizeAndDraw(
    width = this.nodeWidth,
    height = this.nodeHeight,
    maintainAspectRatio = false,
  ): void {
    super.resizeAndDraw(width, height, maintainAspectRatio);
    if (this.container) {
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
    }
    this.execute();
  }

  makeEditable(): void {
    // register hybrid nodes to listen to outside clicks
    this.onHybridNodeEnter();
    this.container.classList.add(styles.hybridContainerFocused);
    this.drawBackground();
    this.execute();
  }

  // needed so react is forced to rerender and get the isHovering state
  onPointerOver(): void {
    super.onPointerOver();
    // this.execute();
  }

  onPointerOut(): void {
    super.onPointerOut();
    // this.execute();
  }

  onEditButtonClick(): void {
    if (this.getActivateByDoubleClick()) {
      this.listenId.push(
        InterfaceController.addListener(
          ListenEvent.GlobalPointerUp,
          this.onViewportPointerUpHandler,
        ),
      );
      this.listenId.push(
        InterfaceController.addListener(
          ListenEvent.EscapeKeyUsed,
          this.onViewportPointerUpHandler,
        ),
      );
      this.doubleClicked = true;
      this.makeEditable();
    }
  }

  public onNodeDoubleClick = (event) => {
    // turn on pointer events for hybrid nodes so the react components become reactive
    if (this.getActivateByDoubleClick() && event.target === this) {
      this.makeEditable();
    }
  };

  onViewportPointerUp(): void {
    super.onViewportPointerUp();
    this.onHybridNodeExit();
    this.listenId.forEach((id) => InterfaceController.removeListener(id));
    // this allows to zoom and drag when the hybrid node is not selected
    this.container.classList.remove(styles.hybridContainerFocused);
    this.drawBackground();
    this.execute();
  }

  public getShrinkOnSocketRemove(): boolean {
    return false;
  }

  protected getActivateByDoubleClick(): boolean {
    return true;
  }

  protected getShowLabels(): boolean {
    return false;
  }

  protected async onExecute(inputObject: unknown): Promise<void> {
    if (!this.container) {
      this.createContainerComponent(inputObject);
    } else {
      this.renderReactComponent(inputObject);
    }
  }

  getOpacity(): number {
    return 0.01;
  }

  public drawBackground(): void {
    this._BackgroundGraphicsRef.beginFill(
      this.getColor().hexNumber(),
      this.getOpacity(),
    );
    this._BackgroundGraphicsRef.drawRoundedRect(
      NODE_MARGIN,
      0,
      this.nodeWidth,
      this.nodeHeight,
      this.getRoundedCorners() ? NODE_CORNERRADIUS : 0,
    );
    if (this.doubleClicked) {
      this.shadowPlane.x = -blurAmount + NODE_MARGIN;
      this.shadowPlane.y = -blurAmount;
      this.shadowPlane.width = this.nodeWidth + blurAmount * 2;
      this.shadowPlane.height = this.nodeHeight + blurAmount * 2;
      this.shadowPlane.visible = true;
    } else {
      this.shadowPlane.visible = false;
    }
    this._BackgroundGraphicsRef.endFill();
  }

  onNodeRemoved = (): void => {
    this.listenId.forEach((id) => InterfaceController.removeListener(id));
  };
}

type HybridNodeOverlayProps = {
  doubleClicked: boolean;
  getActivateByDoubleClick: boolean;
  isHovering: boolean;
  onEditButtonClick: () => void;
};

const HybridNodeOverlay: React.FunctionComponent<HybridNodeOverlayProps> = (
  props,
) => {
  return (
    props.getActivateByDoubleClick &&
    // props.isHovering &&
    !props.doubleClicked && (
      <Button
        title={'Click to edit OR Double click node'}
        className={styles.hybridContainerEditButton}
        size="small"
        onClick={props.onEditButtonClick}
        color="primary"
        sx={{
          background: RANDOMMAINCOLOR,
          color: TRgba.fromString(RANDOMMAINCOLOR).getContrastTextColor().hex(),
        }}
      >
        <EditIcon sx={{ fontSize: '16px' }} />
      </Button>
    )
  );
};

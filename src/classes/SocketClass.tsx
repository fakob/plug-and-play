import * as PIXI from 'pixi.js';
import React from 'react';
import { Box } from '@mui/material';
import { SocketContainer } from '../SocketContainer';
import { SerializedSocket, TRgba, TSocketType } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import { Tooltipable } from '../components/Tooltip';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import {
  SOCKET_CORNERRADIUS,
  SOCKET_TEXTMARGIN_TOP,
  SOCKET_TEXTMARGIN,
  SOCKET_TEXTSTYLE,
  SOCKET_TYPE,
  SOCKET_WIDTH,
  TEXT_RESOLUTION,
  TOOLTIP_DISTANCE,
  TOOLTIP_WIDTH,
  COLOR_MAIN,
} from '../utils/constants';
import { AbstractType } from '../nodes/datatypes/abstractType';
import { TriggerType } from '../nodes/datatypes/triggerType';
import { dataToType, serializeType } from '../nodes/datatypes/typehelper';
import { getCurrentCursorPosition } from '../utils/utils';
import { TextStyle } from 'pixi.js';

export default class Socket extends PIXI.Container implements Tooltipable {
  // Input sockets
  // only 1 link is allowed
  // data can be set or comes from link

  // Output sockets
  // data is derived from execute function

  _SocketRef: PIXI.Graphics;
  _TextRef: PIXI.Text;
  _SelectionBox: PIXI.Graphics;
  _MetaText: PIXI.Text;
  _ValueSpecificGraphics: PIXI.Graphics;

  _socketType: TSocketType;
  _dataType: AbstractType;
  _data: any;
  _defaultData: any; // for inputs: data backup while unplugged, restores data when unplugged again
  _custom: Record<string, any>;
  _links: PPLink[];

  linkDragPos: null | PIXI.Point;

  showLabel = false;
  visibilityCondition: () => boolean = () => true;

  // TODO get rid of custom here it is very ugly
  constructor(
    socketType: TSocketType,
    name: string,
    dataType: AbstractType,
    data = null,
    visible = true,
    custom?: Record<string, any>,
  ) {
    super();

    if (socketType !== SOCKET_TYPE.OUT) {
      // define defaultData for different types
      if (data == null && dataType) {
        data = dataType.getDefaultValue();
      }
    }

    this._socketType = socketType;
    this.name = name;
    this._dataType = dataType;
    this._data = data;
    this._defaultData = data;
    this.visible = visible;
    this._custom = custom;
    this._links = [];

    this.eventMode = 'static';

    this.addEventListener('pointerover', this.onPointerOver.bind(this));
    this.addEventListener('pointerout', this.onPointerOut.bind(this));
    this.addEventListener('pointerup', this.onPointerUp);
    this.addEventListener('pointerdown', this.onSocketPointerDown.bind(this));

    this.redraw();
  }

  static getOptionalVisibilitySocket(
    socketType: TSocketType,
    name: string,
    dataType: AbstractType,
    data: any,
    visibilityCondition: () => boolean,
  ): Socket {
    const socket = new Socket(socketType, name, dataType, data);
    socket.visibilityCondition = visibilityCondition;
    socket.visible = socket.visibilityCondition();
    return socket;
  }

  getSocketLocation(): PIXI.Point {
    return new PIXI.Point(
      this.isInput()
        ? this.getNode()?.getInputSocketXPos() + SOCKET_WIDTH / 2
        : this.getNode()?.getOutputSocketXPos() + SOCKET_WIDTH / 2,
      SOCKET_WIDTH / 2,
    );
  }

  redrawMetaText() {
    this.removeChild(this._MetaText);
    this._MetaText.text = this.dataType.getMetaText(this.data);
    this._MetaText.x = this.getSocketLocation().x + (this.isInput() ? 14 : -14);
    this._MetaText.y = this.getSocketLocation().y + 5;
    this.addChild(this._MetaText);
  }
  redrawValueSpecificGraphics() {
    this.removeChild(this._ValueSpecificGraphics);
    this._ValueSpecificGraphics.removeChildren();
    this.dataType.drawValueSpecificGraphics(
      this._ValueSpecificGraphics,
      this.data,
    );
    this._ValueSpecificGraphics.x = this.getSocketLocation().x;
    this._ValueSpecificGraphics.y = this.getSocketLocation().y;
    this.addChild(this._ValueSpecificGraphics);
  }

  redraw(): void {
    this.removeChildren();
    this._MetaText = new PIXI.Text(
      '',
      new TextStyle({
        fontSize: 8,
        fill: COLOR_MAIN,
      }),
    );
    if (!this.isInput()) {
      this._MetaText.anchor.set(1, 0);
    }
    this._SocketRef = new PIXI.Graphics();
    this._SelectionBox = new PIXI.Graphics();
    this._ValueSpecificGraphics = new PIXI.Graphics();
    this.dataType.drawBox(
      this._SocketRef,
      this._SelectionBox,
      this.getSocketLocation(),
      this.data,
    );
    this.redrawMetaText();
    this.addChild(this._SocketRef);
    this.addChild(this._SelectionBox);

    if (this.showLabel) {
      this._TextRef = new PIXI.Text(
        this.getNode()?.getSocketDisplayName(this),
        SOCKET_TEXTSTYLE,
      );
      if (this.socketType === SOCKET_TYPE.OUT) {
        this._TextRef.anchor.set(1, 0);
        this._TextRef.name = 'TextRef';
      }
      this._TextRef.x = this.isInput()
        ? this.getSocketLocation().x + SOCKET_WIDTH / 2 + SOCKET_TEXTMARGIN
        : this.getSocketLocation().x - SOCKET_TEXTMARGIN - SOCKET_WIDTH / 2;
      this._TextRef.y = SOCKET_TEXTMARGIN_TOP;
      this._TextRef.resolution = TEXT_RESOLUTION;

      this._TextRef.pivot = new PIXI.Point(0, SOCKET_WIDTH / 2);

      this._TextRef.eventMode = 'static';
      this._TextRef.addEventListener(
        'pointerover',
        this.onPointerOver.bind(this),
      );
      this._TextRef.addEventListener(
        'pointerout',
        this.onPointerOut.bind(this),
      );
      this._TextRef.addEventListener('pointerdown', (event) => {
        if (event.button !== 2) {
          this.socketNameRefMouseDown(event);
        }
      });
      this.addChild(this._TextRef);
      this.redrawValueSpecificGraphics();
    }
  }

  // GETTERS & SETTERS

  get socketType(): TSocketType {
    return this._socketType;
  }

  set socketType(newLink: TSocketType) {
    this._socketType = newLink;
  }

  get links(): PPLink[] {
    return this._links;
  }

  set links(newLink: PPLink[]) {
    this._links = newLink;
  }

  get data(): any {
    const dataToReturn = this._data;
    // allow the type to potentially sanitize the data before passing it on
    return this.dataType.parse(dataToReturn);
  }

  // for inputs: set data is called only on the socket where the change is being made
  set data(newData: any) {
    this._data = newData;
    this.redrawMetaText();
    this.redrawValueSpecificGraphics();
    if (
      this.getNode()?.socketShouldAutomaticallyAdapt(this) &&
      this.dataType.allowedToAutomaticallyAdapt()
    ) {
      const proposedType = dataToType(newData);
      if (this.dataType.getName() !== proposedType.getName()) {
        this.dataType = proposedType;
        this.redraw();
        this.getNode().socketTypeChanged();
        if (this.isOutput()) {
          this.links.forEach((link) => link.updateConnection());
        }
      }
    }
    if (this.isInput()) {
      if (!this.hasLink()) {
        this._defaultData = newData;
      } else if (PPGraph.currentGraph.showExecutionVisualisation) {
        this.links[0].renderOutlineThrottled();
      }

      // update defaultData only if socket is input
      // and does not have a link
    } else {
      // if output, set all inputs im linking to
      this.links.forEach((link) => {
        link.target.data = newData;
      });
    }
    this.dataType.onDataSet(newData, this);
  }

  get defaultData(): any {
    return this._defaultData;
  }

  set defaultData(defaultData: any) {
    this._defaultData = defaultData;
  }

  get dataType(): AbstractType {
    return this._dataType;
  }

  set dataType(newType: AbstractType) {
    this._dataType = newType;
  }

  get custom(): any {
    return this._custom;
  }

  set custom(newObject: any) {
    this._custom = newObject;
  }

  // METHODS

  isInput(): boolean {
    return (
      this.socketType === SOCKET_TYPE.IN ||
      this.socketType === SOCKET_TYPE.TRIGGER
    );
  }

  isOutput(): boolean {
    return this.socketType === SOCKET_TYPE.OUT;
  }

  hasLink(): boolean {
    return this.links.length > 0;
  }

  setVisible(value: boolean): void {
    if (value != this.visible && !this.hasLink()) {
      this.visible = value;

      // visibility change can result in position change
      // therefore redraw Node and connected Links
      if (this.getNode().getShrinkOnSocketRemove()) {
        this.getNode().resizeAndDraw(this.getNode().nodeWidth, 0);
      } else {
        this.getNode().resizeAndDraw();
      }
      this.getNode().updateConnectionPosition();
    }
  }

  removeLink(link?: PPLink): void {
    if (link === undefined) {
      this.links.forEach((link) => link.destroy());
      this.links = [];
    } else {
      this.links = this.links.filter((item) => item.id !== link.id);
    }

    // if this is an input which has defaultData stored
    // copy it back into data
    if (this.isInput()) {
      this.data = this.defaultData;
    }
  }

  getNode(): PPNode {
    return this.parent?.parent as PPNode;
  }

  getGraph(): PPGraph {
    return PPGraph.currentGraph;
  }

  public getPreferredNodes(): string[] {
    const preferredNodesPerSocket =
      this.getNode().getPreferredNodesPerSocket().get(this.name) || [];
    return preferredNodesPerSocket.concat(
      this.isInput()
        ? this.dataType.recommendedInputNodeWidgets()
        : this.dataType.recommendedOutputNodeWidgets(),
    );
  }

  //create serialization object
  serialize(): SerializedSocket {
    // ignore data for output sockets and input sockets with links
    // for input sockets with links store defaultData
    let data;
    let defaultData;
    if (this.isInput()) {
      if (!this.hasLink()) {
        data = this.data;
      } else {
        defaultData = this.defaultData;
      }
    }
    return {
      socketType: this.socketType,
      name: this.name,
      dataType: serializeType(this._dataType), // do not use this.dataType as, for linked inputs, it would save the linked output type
      ...{ data: data },
      ...{ defaultData: defaultData },
      visible: this.visible,
    };
  }

  getDirectDependents(): PPNode[] {
    // ask the socket whether their children are dependent

    const nodes = this.links.map((link) => link.getTarget().getNode());
    const filteredNodes = nodes.filter(
      (node) =>
        node && node.updateBehaviour.update && node.id !== this.getNode()?.id,
    );
    return filteredNodes;
  }

  getLinkedNodes(upstream = false): PPNode[] {
    return this.links.map((link) => {
      return upstream ? link.getSource().getNode() : link.getTarget().getNode();
    });
  }

  getTooltipContent(props): React.ReactElement {
    return (
      <>
        <Box
          sx={{
            p: '8px',
            py: '9px',
            color: 'text.primary',
            fontWeight: 'medium',
            fontSize: 'small',
            fontStyle: 'italic',
          }}
        >
          Shift+Click to pin
        </Box>
        <SocketContainer
          triggerScrollIntoView={false}
          key={0}
          property={this}
          index={0}
          dataType={this.dataType}
          isInput={this.isInput()}
          hasLink={this.hasLink()}
          data={this.data}
          randomMainColor={props.randomMainColor}
          selectedNode={this.getNode()}
        />
      </>
    );
  }

  getTooltipPosition(): PIXI.Point {
    const scale = PPGraph.currentGraph.viewportScaleX;
    const distanceX = TOOLTIP_DISTANCE * scale;
    const absPos = this.getGlobalPosition();
    const nodeWidthScaled = this.getNode()._BackgroundRef.width * scale;
    const pos = new PIXI.Point(0, absPos.y);
    if (this.isInput()) {
      pos.x = Math.max(0, absPos.x - TOOLTIP_WIDTH - distanceX);
    } else {
      pos.x = Math.max(0, absPos.x + nodeWidthScaled + distanceX);
    }
    return pos;
  }

  // SETUP

  pointerOverSocketMoving() {
    const currPos = getCurrentCursorPosition();
    const center = PPGraph.currentGraph.getSocketCenter(this);
    const dist = Math.sqrt(
      Math.pow(currPos.y - center.y, 2) +
        0.05 * Math.pow(currPos.x - center.x, 2),
    );
    const maxDist = 20;
    const scaleOutside =
      Math.pow(Math.max(0, (maxDist - dist) / maxDist), 1) * 1.2 + 1;

    this._SocketRef.scale = new PIXI.Point(scaleOutside, scaleOutside);
    if (this._TextRef) {
      this._TextRef.scale = new PIXI.Point(
        Math.sqrt(scaleOutside),
        Math.sqrt(scaleOutside),
      );
    }
  }

  onPointerOver(): void {
    this.cursor = 'pointer';
    (this._SocketRef as PIXI.Graphics).tint = TRgba.white().hexNumber();
    this.getGraph().socketHoverOver(this);
  }

  onPointerOut(): void {
    this.alpha = 1.0;
    this.cursor = 'default';
    (this._SocketRef as PIXI.Graphics).tint = 0xffffff;
    this.getGraph().socketHoverOut(this);
  }

  onSocketPointerDown(event: PIXI.FederatedPointerEvent): void {
    const clickedSourcePoint = this.getTooltipPosition();
    if (event.shiftKey) {
      InterfaceController.onOpenSocketInspector(clickedSourcePoint, this);
    } else {
      this.getGraph().socketMouseDown(this, event);
    }
  }

  protected onPointerUp(event: PIXI.FederatedPointerEvent): void {
    this.getGraph().socketMouseUp(this, event);
  }

  socketNameRefMouseDown(event: PIXI.FederatedPointerEvent): void {
    if (!event.shiftKey) {
      InterfaceController.notifyListeners(ListenEvent.SelectionChanged, [
        this.getNode(),
      ]);
      let shouldOpen;
      if (PPGraph.currentGraph.socketToInspect !== this) {
        shouldOpen = true;
        PPGraph.currentGraph.socketToInspect = this;
      } else {
        PPGraph.currentGraph.socketToInspect = null;
      }
      InterfaceController.notifyListeners(
        ListenEvent.ToggleInspectorWithFocus,
        {
          socket: PPGraph.currentGraph.socketToInspect,
          open: shouldOpen,
        },
      );
    }
  }

  public nodeHoveredOver() {
    this.links.forEach((link) => link.nodeHoveredOver());
  }

  public nodeHoveredOut() {
    this.links.forEach((link) => link.nodeHoveredOut());

    // scale might have been touched by us in pointeroversocketmoving
    this._SocketRef.scale = new PIXI.Point(1, 1);
    if (this._TextRef) {
      this._TextRef.scale = new PIXI.Point(1, 1);
    }
  }

  destroy(): void {
    PPGraph.currentGraph.socketHoverOut(this);
    super.destroy();
  }
}

export class DummySocket extends Socket {
  protected onPointerUp(event: PIXI.FederatedPointerEvent): void {
    this.getNode().onPointerUp(event);
  }
}

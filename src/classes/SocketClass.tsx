import * as PIXI from 'pixi.js';
import { TextStyle } from 'pixi.js';
import React from 'react';
import { Box } from '@mui/material';
import { SocketBody } from '../SocketContainer';
import {
  IWarningHandler,
  SerializedSocket,
  TRgba,
  TSocketId,
  TSocketType,
} from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import { Tooltipable } from '../components/Tooltip';
import InterfaceController, { ListenEvent } from '../InterfaceController';
import {
  COLOR_DARK,
  COLOR_WHITE_TEXT,
  SOCKET_TEXTMARGIN_TOP,
  SOCKET_TEXTMARGIN,
  SOCKET_TYPE,
  SOCKET_WIDTH,
  TEXT_RESOLUTION,
  TOOLTIP_DISTANCE,
  TOOLTIP_WIDTH,
  STATUS_SEVERITY,
} from '../utils/constants';
import { AbstractType, DataTypeProps } from '../nodes/datatypes/abstractType';
import { dataToType, serializeType } from '../nodes/datatypes/typehelper';
import {
  constructSocketId,
  convertToString,
  getCurrentCursorPosition,
  parseValueAndAttachWarnings,
} from '../utils/utils';
import { NodeExecutionWarning, PNPStatus, PNPSuccess } from './ErrorClass';

export default class Socket
  extends PIXI.Container
  implements Tooltipable, IWarningHandler
{
  onNodeAdded(): void {
    this.eventMode = 'static';
    this.addEventListener('pointerover', this.onPointerOver.bind(this));
    this.addEventListener('pointerout', this.onPointerOut.bind(this));
    this.addEventListener('pointerup', this.onPointerUp);
    this.addEventListener('pointerdown', this.onSocketPointerDown.bind(this));
    this.hasBeenAdded = true;

    this.redraw();
  }
  // Input sockets
  // only 1 link is allowed
  // data can be set or comes from link

  // Output sockets
  // data is derived from execute function

  _SocketRef: PIXI.Graphics;
  _TextRef: PIXI.Text;
  _SelectionBox: PIXI.Graphics;
  _ErrorBox: PIXI.Graphics;
  _MetaText: PIXI.Text;
  _ValueSpecificGraphics: PIXI.Graphics;
  status: PNPStatus = new PNPSuccess();

  _socketType: TSocketType;
  _dataType: AbstractType;
  _data: any;
  _defaultData: any; // for inputs: data backup while unplugged, restores data when unplugged again
  _custom: Record<string, any>;
  _links: PPLink[];

  linkDragPos: null | PIXI.Point;

  showLabel = false;
  hasBeenAdded = false;

  // cached data, for performance reasons (mostly UI related)
  cachedParsedData = undefined;
  cachedStringifiedData = undefined;
  lastSetTime = new Date().getTime();

  // special mode for sockets that are given a function to get the value instead of the actual value, to save performance in case no one asks for it, requires manual work node side to update needsToReFetchValue
  lazyEvaluationFunction = () => undefined;
  private needsToReFetchValue = true;

  visibilityCondition: () => boolean = () => true;

  constructor(
    socketType: TSocketType,
    name: string,
    dataType: AbstractType,
    data = null,
    visible = true,
    custom?: Record<string, any>,
    lazyEvaluation = false,
    lazyEvaluationFunction = () => {},
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

    this.lazyEvaluationFunction = lazyEvaluationFunction;
    this.needsToReFetchValue = lazyEvaluation;
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
    this._MetaText.text = this.dataType.getMetaText(this._data);
    this._MetaText.x = this.getSocketLocation().x + (this.isInput() ? 14 : -14);
    this._MetaText.y = this.getSocketLocation().y + 5;
    this.addChild(this._MetaText);
  }

  redrawValueSpecificGraphics() {
    this.removeChild(this._ValueSpecificGraphics);
    this._ValueSpecificGraphics.clear();
    this._ValueSpecificGraphics.removeChildren();
    this.dataType.drawValueSpecificGraphics(
      this._ValueSpecificGraphics,
      this._data,
    );
    this._ValueSpecificGraphics.x = this.getSocketLocation().x;
    this._ValueSpecificGraphics.y = this.getSocketLocation().y;
    this.addChild(this._ValueSpecificGraphics);
  }

  public setStatus(status: PNPStatus) {
    const currentMessage = this.status.message;
    const newMessage = status.message;
    if (currentMessage !== newMessage) {
      this.status = status;
      this.redraw();
      if (status.getSeverity() >= STATUS_SEVERITY.WARNING) {
        this.getNode().setStatus(
          new NodeExecutionWarning(
            `Parsing warning on ${this.isInput() ? 'input' : 'output'}: ${
              this.name
            }
${newMessage}`,
          ),
          'socket',
        );
      } else {
        this.getNode().adaptToSocketErrors();
      }
    }
  }

  redraw(): void {
    this.removeChildren();
    const color =
      this.status.getSeverity() >= STATUS_SEVERITY.WARNING
        ? TRgba.fromString(COLOR_DARK).hex()
        : TRgba.fromString(COLOR_WHITE_TEXT).hex();
    this._MetaText = new PIXI.Text(
      '',
      new TextStyle({
        fontSize: 8,
        fill: color,
      }),
    );
    if (!this.isInput()) {
      this._MetaText.anchor.set(1, 0);
    }
    this._ErrorBox = new PIXI.Graphics();
    this._SocketRef = new PIXI.Graphics();
    this._SelectionBox = new PIXI.Graphics();
    this._ValueSpecificGraphics = new PIXI.Graphics();
    this.dataType.drawBox(
      this._ErrorBox,
      this._SocketRef,
      this._SelectionBox,
      this.getSocketLocation(),
      this.isInput(),
      this.status,
    );
    this.redrawMetaText();
    this.addChild(this._ErrorBox);
    this.addChild(this._SocketRef);
    this.addChild(this._SelectionBox);
    if (this.showLabel) {
      this._TextRef = new PIXI.Text(
        this.getNode()?.getSocketDisplayName(this),
        new TextStyle({
          fontSize: 12,
          fill: color,
        }),
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

  // only applicable for lazily evaluated socket values, called when parents data has changed
  public valueNeedsRefresh(): void {
    this.needsToReFetchValue = true;
    if (this.links.length) {
      this.data = this.lazyEvaluationFunction();
    }
  }

  get data(): any {
    if (this.needsToReFetchValue) {
      this._data = this.lazyEvaluationFunction();
      this.needsToReFetchValue = false;
    }
    if (this.cachedParsedData == undefined) {
      this.cachedParsedData = parseValueAndAttachWarnings(
        this,
        this.dataType,
        this._data,
      );
    }
    return this.cachedParsedData;
  }

  getStringifiedData(): string {
    if (this.cachedStringifiedData == undefined) {
      this.cachedStringifiedData = convertToString(this.data);
    }
    return this.cachedStringifiedData;
  }

  changeSocketDataType(newType: AbstractType) {
    this.dataType = newType;
    this.clearCachedData();
    this.redraw();
    this.getNode().socketTypeChanged();
    if (this.isOutput()) {
      this.links.forEach((link) => link.updateConnection());
    }
  }

  clearCachedData(): void {
    this.cachedParsedData = undefined;
    this.cachedStringifiedData = undefined;
  }

  set data(newData: any) {
    this._data = newData;
    this.clearCachedData();
    this.lastSetTime = new Date().getTime();
    if (!this.hasBeenAdded) {
      return;
    }
    //console.log(
    //  'setting data innit: ' + this.getNode().getName() + ', ' + this.name,
    //);
    //console.trace();

    this.redrawMetaText();
    this.redrawValueSpecificGraphics();
    const adaptationAcceptable =
      this.getNode()?.socketShouldAutomaticallyAdapt(this) &&
      this.dataType.allowedToAutomaticallyAdapt();
    const socketWantsToAdapt = this.dataType.prefersToChangeAwayFromThisType();
    const incompatibleData = !this.dataType.dataIsCompatible(newData);
    if (
      adaptationAcceptable &&
      (incompatibleData || socketWantsToAdapt || this.isOutput())
    ) {
      const proposedType = dataToType(newData);
      if (this.dataType.getName() !== proposedType.getName()) {
        this.changeSocketDataType(proposedType);
      }
    }
    if (this.isInput()) {
      if (!this.hasLink()) {
        this._defaultData = this.data;
      } else if (PPGraph.currentGraph.showExecutionVisualisation) {
        this.links[0].renderOutlineThrottled();
      }

      // update defaultData only if socket is input
      // and does not have a link
    } else {
      // if output, set all inputs im linking to
      this.links.forEach((link) => {
        link.target.data = this.data;
      });
    }
    this.dataType.onDataSet(this.data, this);
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
    this.clearCachedData();
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
    const hadLinks = this.links.length > 0;
    if (link === undefined) {
      this.links.forEach((link) => link.destroy());
      this.links = [];
    } else {
      this.links = this.links.filter((item) => item.id !== link.id);
    }

    // if this is an input which has defaultData stored
    // copy it back into data
    if (this.isInput() && hadLinks) {
      this.data = this.defaultData;
    }
  }

  getNode(): PPNode {
    return this.parent?.parent as PPNode;
  }

  getGraph(): PPGraph {
    return PPGraph.currentGraph;
  }

  getSocketId(): TSocketId {
    return constructSocketId(this.getNode().id, this.socketType, this.name);
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

  // includeSocketInfo is here for performance reasons, interface is calling this, dont want to overwhelm it with data
  serialize(): SerializedSocket {
    // ignore data for output sockets and input sockets with links
    // for input sockets with links store defaultData
    let data;
    let defaultData;
    if (this.isInput()) {
      if (!this.hasLink()) {
        data = this.dataType.prepareDataForSaving(this.data);
      } else {
        defaultData = this.dataType.prepareDataForSaving(this.defaultData);
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
    const baseProps: DataTypeProps = {
      key: this.dataType.getName(),
      property: this,
      index: 0,
      isInput: this.isInput(),
      hasLink: this.hasLink(),
      randomMainColor: props.randomMainColor,
      dataType: this.dataType,
    };
    const widget = this.isInput
      ? this.dataType.getInputWidget(baseProps)
      : this.dataType.getOutputWidget(baseProps);
    return (
      <>
        <Box
          sx={{
            p: '8px',
            py: '9px',
            color: 'text.primary',
            fontWeight: 'medium',
            fontSize: 'small',
          }}
        >
          <em>Shift+Click</em> to add to dashboard
        </Box>
        <Box
          sx={{
            bgcolor: 'background.default',
          }}
        >
          <SocketBody
            property={this}
            randomMainColor={props.randomMainColor}
            selectedNode={props.selectedNode}
            widget={widget}
          />
        </Box>
      </>
    );
  }

  screenPointSocketCenter(): PIXI.Point {
    const socketRefPos = this._SocketRef.getGlobalPosition();
    return PPGraph.currentGraph.viewport.toScreen(
      socketRefPos.x,
      socketRefPos.y,
    );
  }

  screenPointSocketLabelCenter(): PIXI.Point {
    const textRefPos = this._TextRef.getGlobalPosition();
    const factor = this.isInput() ? 1 : -1;
    const x = textRefPos.x + (factor * this._TextRef.width) / 2;
    const y = textRefPos.y + this._TextRef.height / 2;
    return PPGraph.currentGraph.viewport.toScreen(x, y);
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
    this._ValueSpecificGraphics.scale = new PIXI.Point(
      scaleOutside,
      scaleOutside,
    );
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
    if (event.shiftKey) {
      InterfaceController.onAddToDashboard(this);
    } else {
      this.getGraph().socketPointerDown(this, event);
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
      if (PPGraph.currentGraph.socketToInspect !== this) {
        PPGraph.currentGraph.socketToInspect = this;
      } else {
        PPGraph.currentGraph.socketToInspect = null;
      }
      InterfaceController.notifyListeners(
        ListenEvent.ToggleInspectorWithFocus,
        {
          socket: PPGraph.currentGraph.socketToInspect,
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
    this._ValueSpecificGraphics.scale = new PIXI.Point(1, 1);
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

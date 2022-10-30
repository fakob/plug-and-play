import * as PIXI from 'pixi.js';
import { SerializedSocket, TRgba, TSocketType } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  SOCKET_CORNERRADIUS,
  SOCKET_TEXTMARGIN_TOP,
  SOCKET_TEXTMARGIN,
  SOCKET_TEXTSTYLE,
  SOCKET_TYPE,
  SOCKET_WIDTH,
  TEXT_RESOLUTION,
} from '../utils/constants';
import { AbstractType } from '../nodes/datatypes/abstractType';
import { TriggerType } from '../nodes/datatypes/triggerType';
import { dataToType, serializeType } from '../nodes/datatypes/typehelper';

export default class Socket extends PIXI.Container {
  // Input sockets
  // only 1 link is allowed
  // data can be set or comes from link

  // Output sockets
  // data is derived from execute function

  _SocketRef: PIXI.Graphics;
  _TextRef: PIXI.Graphics;

  _socketType: TSocketType;
  _dataType: AbstractType;
  _data: any;
  _defaultData: any; // for inputs: data backup while unplugged, restores data when unplugged again
  _custom: Record<string, any>;
  _links: PPLink[];

  interactionData: PIXI.InteractionData | null;
  linkDragPos: null | PIXI.Point;

  showLabel = false;

  constructor(
    socketType: TSocketType,
    name: string,
    dataType: AbstractType,
    data = null,
    visible = true,
    custom?: Record<string, any>
  ) {
    super();

    if (socketType === SOCKET_TYPE.IN) {
      // define defaultData for different types
      if (data === null && dataType) {
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

    this.interactionData = null;
    this.interactive = true;

    this.redrawAnythingChanging();
  }

  getSocketLocation(): PIXI.Point {
    return new PIXI.Point(
      this.socketType === SOCKET_TYPE.IN ? 0 : this.getNode()?.nodeWidth,
      SOCKET_WIDTH / 2
    );
  }

  redrawAnythingChanging(): void {
    this.removeChild(this._SocketRef);
    this.removeChild(this._TextRef);
    this._SocketRef = new PIXI.Graphics();
    this._TextRef = new PIXI.Graphics();
    this._SocketRef.beginFill(this.dataType.getColor().hexNumber());
    this._SocketRef.drawRoundedRect(
      this.getSocketLocation().x,
      this.getSocketLocation().y,
      SOCKET_WIDTH,
      SOCKET_WIDTH,
      this.dataType.constructor === new TriggerType().constructor
        ? 0
        : SOCKET_CORNERRADIUS
    );

    if (this.showLabel) {
      const socketNameText = new PIXI.Text(this.name, SOCKET_TEXTSTYLE);
      if (this.socketType === SOCKET_TYPE.OUT) {
        socketNameText.anchor.set(1, 0);
      }
      socketNameText.x =
        this.socketType === SOCKET_TYPE.IN
          ? SOCKET_WIDTH + SOCKET_TEXTMARGIN
          : this.getNode()?.nodeWidth - SOCKET_TEXTMARGIN;
      socketNameText.y = SOCKET_TEXTMARGIN_TOP;
      socketNameText.resolution = TEXT_RESOLUTION;

      socketNameText.interactive = true;
      socketNameText.on('pointerover', this._onPointerOver.bind(this));
      socketNameText.on('pointerout', this._onPointerOut.bind(this));
      socketNameText.on('pointerdown', (event) => {
        if (event.data.button !== 2) {
          this.getGraph().socketNameRefMouseDown(this, event);
        }
      });

      this._TextRef.addChild(socketNameText);
    }

    this._SocketRef.endFill();
    this._SocketRef.name = 'SocketRef';
    this._SocketRef.interactive = true;
    this._SocketRef.on('pointerover', this._onPointerOver.bind(this));
    this._SocketRef.on('pointerout', this._onPointerOut.bind(this));
    this._SocketRef.on('pointerdown', (event) => this._onPointerDown(event));
    this._SocketRef.on('pointerup', (event) => this._onPointerUp(event));
    this.addChild(this._SocketRef);
    this.addChild(this._TextRef);
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
    if (this.isInput()) {
      if (!this.hasLink()) {
        this._defaultData = newData;
      } else if (PPGraph.currentGraph.showExecutionVisualisation) {
        this.links[0].renderOutlineThrottled();
      }

      // update defaultData only if socket is input
      // and does not have a link
    } else {
      // potentially change type of output if desirable
      const proposedType = dataToType(newData);
      if (
        this.getNode().outputsAutomaticallyAdaptType() &&
        this.dataType.getName() !== proposedType.getName()
      ) {
        this.dataType = proposedType;
        this.redrawAnythingChanging();
      }
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
    return this.socketType === SOCKET_TYPE.IN;
  }

  hasLink(): boolean {
    return this.links.length > 0;
  }

  setVisible(value: boolean): void {
    this.visible = value;

    // visibility change can result in position change
    // therefore redraw Node and connected Links
    this.getNode().drawNodeShape();
    this.getNode().updateConnectionPosition();
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
    return this.parent as PPNode;
  }

  getGraph(): PPGraph {
    return PPGraph.currentGraph;
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
      isCustom: !this.getNode().hasSocketNameInDefaultIO(
        this.name,
        this.socketType
      ),
    };
  }

  getDirectDependents(): PPNode[] {
    // ask the socket whether their children are dependent

    const nodes = this.links.map((link) => link.getTarget().getNode());
    const filteredNodes = nodes.filter((node) => node.updateBehaviour.update);
    return filteredNodes;
  }

  getLinkedNodes(upstream = false): PPNode[] {
    return this.links.map((link) => {
      return upstream ? link.getSource().getNode() : link.getTarget().getNode();
    });
  }

  // SETUP

  _onPointerOver(): void {
    this.cursor = 'pointer';
    (this._SocketRef as PIXI.Graphics).tint = TRgba.white().hexNumber();
    this.getGraph().socketHoverOver(this);
  }

  _onPointerOut(): void {
    this.alpha = 1.0;
    this.cursor = 'default';
    (this._SocketRef as PIXI.Graphics).tint = 0xffffff;
    this.getGraph().socketHoverOut(this);
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    this.getGraph().socketMouseDown(this, event);
  }

  _onPointerUp(event: PIXI.InteractionEvent): void {
    this.getGraph().socketMouseUp(this, event);
  }

  destroy(): void {
    this.removeLink();
    this.getNode().inputSocketArray = this.getNode().inputSocketArray.filter(
      (socket) =>
        !(socket.name === this.name && socket.socketType === this.socketType)
    );
    this.getNode().outputSocketArray = this.getNode().outputSocketArray.filter(
      (socket) =>
        !(socket.name === this.name && socket.socketType === this.socketType)
    );
    super.destroy();
  }
}

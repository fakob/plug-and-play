import * as PIXI from 'pixi.js';
import { SerializedSocket, TRgba, TSocketType } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  NODE_WIDTH,
  SOCKET_CORNERRADIUS,
  SOCKET_TEXTMARGIN_TOP,
  SOCKET_TEXTMARGIN,
  SOCKET_TEXTSTYLE,
  SOCKET_TYPE,
  SOCKET_WIDTH,
  TEXT_RESOLUTION,
} from '../utils/constants';
import { AbstractType } from '../nodes/datatypes/abstractType';
import { serializeType } from '../nodes/datatypes/typehelper';

export default class Socket extends PIXI.Container {
  // Input sockets
  // only 1 link is allowed
  // data can be set or comes from link

  // Output sockets
  // data is derived from execute function

  _SocketNameRef: PIXI.DisplayObject;
  _SocketRef: PIXI.Graphics;

  _socketType: TSocketType;
  _dataType: AbstractType;
  _data: any;
  _defaultData: any; // for inputs: data backup while unplugged, restores data when unplugged again
  _custom: Record<string, any>;
  _links: PPLink[];

  interactionData: PIXI.InteractionData | null;
  linkDragPos: null | PIXI.Point;

  constructor(
    socketType: TSocketType,
    name: string,
    dataType: AbstractType,
    data = null,
    visible = true,
    custom?: Record<string, any>
  ) {
    super();

    let defaultData;
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
    this._defaultData = defaultData;
    this.visible = visible;
    this._custom = custom;
    this._links = [];

    const socketNameText = new PIXI.Text(name, SOCKET_TEXTSTYLE);
    if (socketType === SOCKET_TYPE.OUT) {
      socketNameText.anchor.set(1, 0);
    }
    socketNameText.x =
      socketType === SOCKET_TYPE.IN
        ? SOCKET_WIDTH + SOCKET_TEXTMARGIN
        : NODE_WIDTH - SOCKET_TEXTMARGIN;
    socketNameText.y = SOCKET_TEXTMARGIN_TOP;
    socketNameText.resolution = TEXT_RESOLUTION;

    this._SocketNameRef = this.addChild(socketNameText);

    this.interactionData = null;
    this.interactive = true;
    this._SocketNameRef.interactive = true;
    this._SocketNameRef.on('pointerover', this._onPointerOver.bind(this));
    this._SocketNameRef.on('pointerout', this._onPointerOut.bind(this));
    this._SocketNameRef.on('pointerdown', (event) => {
      if (event.data.button !== 2) {
        this.getGraph().socketNameRefMouseDown(this, event);
      }
    });
    this.redrawAnythingChanging();
  }

  redrawAnythingChanging(): void {
    this.removeChild(this._SocketRef);
    this._SocketRef = new PIXI.Graphics();
    this._SocketRef.beginFill(this.dataType.getColor().hexNumber());
    this._SocketRef.drawRoundedRect(
      this.socketType === SOCKET_TYPE.IN ? 0 : NODE_WIDTH,
      SOCKET_WIDTH / 2,
      SOCKET_WIDTH,
      SOCKET_WIDTH,
      SOCKET_CORNERRADIUS
    );
    this._SocketRef.endFill();
    this._SocketRef.name = 'SocketRef';
    this._SocketRef.interactive = true;
    this._SocketRef.on('pointerover', this._onPointerOver.bind(this));
    this._SocketRef.on('pointerout', this._onPointerOut.bind(this));
    this._SocketRef.on('pointerdown', (event) => this._onPointerDown(event));
    this._SocketRef.on('pointerup', (event) => this._onPointerUp(event));
    this.addChild(this._SocketRef);
  }

  // GETTERS & SETTERS

  get socketType(): TSocketType {
    return this._socketType;
  }

  set socketType(newLink: TSocketType) {
    this._socketType = newLink;
  }

  get socketRef(): PIXI.DisplayObject {
    return this._SocketRef;
  }

  get socketNameRef(): PIXI.DisplayObject {
    return this._SocketNameRef;
  }

  get index(): number {
    if (this.socketType === SOCKET_TYPE.IN) {
      return (this.parent as PPNode).inputSocketArray.findIndex((item) => {
        return this === item;
      });
    } else {
      return (this.parent as PPNode).outputSocketArray.findIndex((item) => {
        return this === item;
      });
    }
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
    return this.socketType === SOCKET_TYPE.IN;
  }

  hasLink(): boolean {
    return this.links.length > 0;
  }

  setName(newName: string): void {
    this.name = newName;
    (this._SocketNameRef as PIXI.Text).text = newName;
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
    return (this.parent as PPNode).graph;
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

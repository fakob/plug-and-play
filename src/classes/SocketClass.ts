import * as PIXI from 'pixi.js';
import { SerializedSocket, TSocketType } from '../utils/interfaces';
import PPGraph from './GraphClass';
import PPNode from './NodeClass';
import PPLink from './LinkClass';
import {
  NODE_WIDTH,
  SOCKET_COLOR_HEX,
  SOCKET_COLOR_TINT_HEX,
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
  _SocketRef: PIXI.DisplayObject;

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
      if (data === null && dataType && dataType instanceof AbstractType) {
        data = dataType.getDefaultValue();
      }
    } else {
      data = null; // for output sockets, data is calculated
    }

    this._socketType = socketType;
    this.name = name;
    this._dataType = dataType;
    this._data = data;
    this._defaultData = defaultData;
    this.visible = visible;
    this._custom = custom;
    this._links = [];

    const socket = new PIXI.Graphics();
    socket.beginFill(SOCKET_COLOR_HEX);
    socket.drawRoundedRect(
      socketType === SOCKET_TYPE.IN ? 0 : NODE_WIDTH,
      SOCKET_WIDTH / 2,
      SOCKET_WIDTH,
      SOCKET_WIDTH,
      SOCKET_CORNERRADIUS
    );
    socket.endFill();

    const socketNameText = new PIXI.Text(name, SOCKET_TEXTSTYLE);
    if (socketType === SOCKET_TYPE.OUT) {
      socketNameText.anchor.set(1, 0);
    }
    socketNameText.x =
      socketType === SOCKET_TYPE.IN
        ? socket.width + SOCKET_TEXTMARGIN
        : NODE_WIDTH - SOCKET_TEXTMARGIN;
    socketNameText.y = SOCKET_TEXTMARGIN_TOP;
    socketNameText.resolution = TEXT_RESOLUTION;

    this._SocketRef = this.addChild(socket);
    this._SocketNameRef = this.addChild(socketNameText);

    this.interactionData = null;
    this.interactive = true;
    this._SocketRef.name = 'SocketRef';
    this._SocketRef.interactive = true;
    this._SocketRef.on('pointerover', this._onPointerOver.bind(this));
    this._SocketRef.on('pointerout', this._onPointerOut.bind(this));
    this._SocketRef.on('pointerdown', this._onPointerDown.bind(this));
    this._SocketNameRef.name = 'SocketNameRef';
    this._SocketNameRef.interactive = true;
    this._SocketNameRef.on('pointerover', this._onPointerOver.bind(this));
    this._SocketNameRef.on('pointerout', this._onPointerOut.bind(this));
    this._SocketNameRef.on('pointerdown', this._onPointerDown.bind(this));
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
    // just point to data from last node if there to avoid copying it
    if (this.isInput() && this.hasLink()) {
      return this.links[0].getSource().data;
    }
    return this._data;
  }

  set data(newData: any) {
    this._data = newData;
    // update defaultData only if socket is input
    // and does not have a link
    if (this.isInput() && !this.hasLink()) {
      this._defaultData = newData;
    }
  }

  get defaultData(): any {
    return this.dataType?.getDefaultValue();
  }

  get dataType(): AbstractType {
    // just point to data from last node if there to avoid copying it
    if (this.isInput() && this.hasLink()) {
      return this.links[0].getSource().dataType;
    }
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
    this.getNode().inputSocketArray.map((input) => {
      input.links.map((link) => {
        link.updateConnection();
      });
    });
    this.getNode().outputSocketArray.map((output) => {
      output.links.map((link) => {
        link.updateConnection();
      });
    });
  }

  removeLink(link?: PPLink): void {
    if (link === undefined) {
      this.links = [];
    } else {
      this.links = this.links.filter((item) => item.id !== link.id);
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
    // ignore data for output sockets, input sockets with links
    // and input sockets with pixi data type
    let data;
    if (this.isInput()) {
      if (!this.hasLink() /* && this.dataType !== DATATYPE.PIXI*/) {
        data = this.data;
      }
    }
    return {
      socketType: this.socketType,
      name: this.name,
      dataType: serializeType(this.dataType),
      data,
      visible: this.visible,
      custom: this.custom,
    };
  }

  getDirectDependents(): PPNode[] {
    // only continue with nodes that execute on update
    const nodes = this.links.map((link) => link.getTarget().getNode());
    const filteredNodes = nodes.filter((node) => node.updateBehaviour.update);
    return filteredNodes;
  }

  // SETUP

  _onPointerOver(event: PIXI.InteractionEvent): void {
    // set overInputRef on graph
    if (
      this.socketType === SOCKET_TYPE.IN &&
      event.target.name === 'SocketRef'
    ) {
      this.getGraph().overInputRef = this;
    }

    this.cursor = 'pointer';
    (this._SocketRef as PIXI.Graphics).tint = SOCKET_COLOR_TINT_HEX;
  }

  _onPointerOut(): void {
    // reset overInputRef on graph
    if (this.socketType === SOCKET_TYPE.IN) {
      this.getGraph().overInputRef = null;
    }

    this.getGraph().clickedSocketNameRef = null;
    this.alpha = 1.0;
    this.cursor = 'default';
    (this._SocketRef as PIXI.Graphics).tint = 0xffffff;
  }

  _onPointerDown(event: PIXI.InteractionEvent): void {
    console.log('_onPointerDown');
    if (event.target.name === 'SocketRef') {
      this.getGraph().clickedSocketRef = event.target.parent as Socket;
    } else if (event.target.name === 'SocketNameRef') {
      this.getGraph().clickedSocketNameRef = event.target.parent as Socket;
    }
  }
}

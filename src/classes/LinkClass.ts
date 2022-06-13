import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { SerializedLink } from '../utils/interfaces';
import { CONNECTION_COLOR_HEX } from '../utils/constants';
import Socket from './SocketClass';
import PPNode from './NodeClass';
import PPGraph from './GraphClass';

export default class PPLink extends PIXI.Container {
  id: number;
  source: Socket;
  target: Socket;
  _connectionRef: PIXI.Graphics;
  // _data: any;

  constructor(id: number, source: Socket, target: Socket) {
    super();
    this.id = id;
    this.source = source;
    this.target = target;
    // this._data = null;

    const connection = new PIXI.Graphics();
    this._drawConnection(connection, source, target);
    this._connectionRef = this.addChild(connection);
  }

  serialize(): SerializedLink {
    //create serialization object
    return {
      id: this.id,
      sourceNodeId: (this.source.parent as PPNode).id,
      sourceSocketName: this.source.name,
      targetNodeId: (this.target.parent as PPNode).id,
      targetSocketName: this.target.name,
    };
  }

  updateConnection(): void {
    // redraw background due to node movement
    this._connectionRef.clear();
    this._drawConnection(this._connectionRef, this.source, this.target);
  }

  getSource(): Socket {
    return this.source;
  }

  getTarget(): Socket {
    return this.target;
  }

  updateSource(newSource: Socket): void {
    this.source = newSource;
    this.updateConnection();
  }

  updateTarget(newTarget: Socket): void {
    this.target = newTarget;
    this.updateConnection();
  }

  delete(): void {
    if (this.getTarget()) {
      this.getTarget().removeLink(this);
      this.getTarget().getNode().executeOptimizedChain();
    }
    this.getSource().removeLink(this);
    this.getSource().getGraph().connectionContainer.removeChild(this);
    delete this.getSource().getGraph()._links[this.id];
  }

  _drawConnection(
    connection: PIXI.Graphics,
    source: Socket,
    target: Socket
  ): void {
    const sourcePoint = PPGraph.currentGraph.getSocketCenter(source);
    const targetPoint = PPGraph.currentGraph.getSocketCenter(target);

    // draw curve from 0,0 as PIXI.Graphics sourceates from 0,0
    const toX = targetPoint.x - sourcePoint.x;
    const toY = targetPoint.y - sourcePoint.y;
    const cpX = Math.abs(toX) / 2;
    const cpY = 0;
    const cpX2 = toX - cpX;
    const cpY2 = toY;

    connection.lineStyle(
      2,
      source.dataType.getColor().multiply(0.9).hexNumber(),
      1
    );
    connection.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

    // offset curve to start from source
    connection.x = sourcePoint.x;
    connection.y = sourcePoint.y;
  }
}

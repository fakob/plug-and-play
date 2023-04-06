import * as PIXI from 'pixi.js';
import { SerializedLink, TRgba } from '../utils/interfaces';
import Socket from './SocketClass';
import PPNode from './NodeClass';
import PPGraph from './GraphClass';
import throttle from 'lodash/throttle';

export default class PPLink extends PIXI.Container {
  id: string;
  source: Socket;
  target: Socket;
  _connectionRef: PIXI.Graphics;
  // _data: any;

  lineThickness = 2;

  constructor(id: string, source: Socket, target: Socket) {
    super();
    this.id = id;
    this.source = source;
    this.target = target;
    // this._data = null;

    const connection = new PIXI.Graphics();
    this._connectionRef = this.addChild(connection);
    this._drawConnection(connection);
  }

  serialize(): SerializedLink {
    // create serialization object
    // this prevents being blocked from saving when having orphaned links
    if (this.source.parent && this.target.parent) {
      return {
        id: this.id,
        sourceNodeId: (this.source.parent as PPNode).id,
        sourceSocketName: this.source.name,
        targetNodeId: (this.target.parent as PPNode).id,
        targetSocketName: this.target.name,
      };
    }
  }

  public nodeHoveredOver() {
    this.setLineThickness(4);
  }

  public nodeHoveredOut() {
    this.setLineThickness(2);
  }

  private setLineThickness(thickness: number): void {
    this.lineThickness = thickness;
    this.updateConnection();
  }

  updateConnection(): void {
    // redraw background due to node movement
    this._connectionRef.clear();
    this._drawConnection(this._connectionRef);
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

  // if there is a new connection pending, don't execute inbetween, wait until new connection to execute
  delete(skipExecute = false): void {
    if (this.getTarget()) {
      this.getTarget().removeLink(this);
      if (!skipExecute) {
        this.getTarget().getNode()?.executeOptimizedChain();
      }
    }
    this.getSource().removeLink(this);
    this.getSource().getGraph().connectionContainer.removeChild(this);
  }

  public renderOutlineThrottled = throttle(this.renderOutline, 2000, {
    trailing: false,
    leading: true,
  });

  private renderOutline(iterations = 30, interval = 16.67): void {
    return;
  }

  _drawConnection(
    connection: PIXI.Graphics,
    color = this.source.dataType.getColor().multiply(0.9)
  ): void {
    const sourcePoint = PPGraph.currentGraph.getSocketCenter(this.source);
    const targetPoint = PPGraph.currentGraph.getSocketCenter(this.target);

    // draw curve from 0,0 as PIXI.Graphics sourceates from 0,0
    const toX = targetPoint.x - sourcePoint.x;
    const toY = targetPoint.y - sourcePoint.y;
    const cpX = Math.abs(toX) / 2;
    const cpY = 0;
    const cpX2 = toX - cpX;
    const cpY2 = toY;

    connection.lineStyle(this.lineThickness, color.hexNumber());
    connection.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

    // offset curve to start from source
    connection.x = sourcePoint.x;
    connection.y = sourcePoint.y;
  }
}

import { Viewport } from 'pixi-viewport';
import { SerializedLink } from './interfaces';
import { CONNECTION_COLOR_HEX } from './constants';
import InputSocket from './InputSocketClass';
import OutputSocket from './OutputSocketClass';
import PPNode from './NodeClass';

export default class PPLink extends PIXI.Container {
  id: number;
  type: string;
  source: OutputSocket;
  target: InputSocket;
  viewport: Viewport;
  _connectionRef: PIXI.Graphics;
  // _data: any;

  constructor(
    id: number,
    type: string,
    source: OutputSocket,
    target: InputSocket,
    viewport: Viewport
  ) {
    super();
    this.id = id;
    this.type = type;
    this.source = source;
    this.target = target;
    this.viewport = viewport;
    // this._data = null;

    const connection = new PIXI.Graphics();
    const comment = new PIXI.Text('');
    this._drawConnection(viewport, connection, source, target);
    this._connectionRef = this.addChild(connection);
  }

  serialize(): SerializedLink {
    //create serialization object
    console.log(this.source.parent);
    return {
      id: this.id,
      type: this.type,
      sourceNodeId: (this.source.parent as PPNode).id,
      sourceSocketIndex: this.source.index,
      targetNodeId: (this.target.parent as PPNode).id,
      targetSocketIndex: this.target.index,
    };
  }

  updateConnection(): void {
    // redraw background due to node movement
    this._connectionRef.clear();
    this._drawConnection(
      this.viewport,
      this._connectionRef,
      this.source,
      this.target
    );
  }

  getSource(): OutputSocket {
    return this.source;
  }

  getTarget(): InputSocket {
    return this.target;
  }

  updateSource(newSource: OutputSocket): void {
    this.source = newSource;
    this.updateConnection();
  }

  updateTarget(newTarget: InputSocket): void {
    this.target = newTarget;
    this.updateConnection();
  }

  _drawConnection(
    viewport: Viewport,
    connection: PIXI.Graphics,
    source: OutputSocket,
    target: InputSocket
  ): void {
    // get source position
    const sourceRect = source.children[0].getBounds();
    const sourcePoint = viewport.toWorld(
      new PIXI.Point(
        sourceRect.x + sourceRect.width / 2,
        sourceRect.y + sourceRect.height / 2
      )
    );

    // get target position
    const targetRect = target.children[0].getBounds();
    const targetPoint = viewport.toWorld(
      new PIXI.Point(
        targetRect.x + targetRect.width / 2,
        targetRect.y + targetRect.height / 2
      )
    );

    // draw curve from 0,0 as PIXI.Graphics sourceates from 0,0
    const toX = targetPoint.x - sourcePoint.x;
    const toY = targetPoint.y - sourcePoint.y;
    const cpX = Math.abs(toX) / 2;
    const cpY = 0;
    const cpX2 = toX - cpX;
    const cpY2 = toY;

    connection.lineStyle(2, CONNECTION_COLOR_HEX, 1);
    connection.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

    // offset curve to start from source
    connection.x = sourcePoint.x;
    connection.y = sourcePoint.y;
  }
}

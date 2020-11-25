import { Viewport } from 'pixi-viewport';
import { InputNode, OutputNode, PPNode } from './NodeClass';
import { CONNECTION_COLOR_HEX } from './constants';

export default class PPLink extends PIXI.Container {
  id: number;
  type: string;
  source: OutputNode;
  target: InputNode;
  viewport: Viewport;
  _connectionRef: PIXI.Graphics;

  constructor(
    id: number,
    type: string,
    source: OutputNode,
    target: InputNode,
    viewport: Viewport
  ) {
    super();
    this.id = id;
    this.type = type;
    this.source = source;
    this.target = target;
    this.viewport = viewport;

    const connection = new PIXI.Graphics();
    this._drawConnection(viewport, connection, source, target);
    this._connectionRef = this.addChild(connection);
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

  getSource(): OutputNode {
    return this.source;
  }

  getTarget(): InputNode {
    return this.target;
  }

  _drawConnection(
    viewport: Viewport,
    connection: PIXI.Graphics,
    source: OutputNode,
    target: InputNode
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

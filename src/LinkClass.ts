import { Viewport } from 'pixi-viewport';
import { InputNode, OutputNode } from './NodeClass';

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

    const sourceRect = source.children[0].getBounds();
    const sourcePoint = viewport.toWorld(
      new PIXI.Point(
        sourceRect.x + sourceRect.width / 2,
        sourceRect.y + sourceRect.height / 2
      )
    );

    const targetRect = target.children[0].getBounds();
    const targetPoint = viewport.toWorld(
      new PIXI.Point(
        targetRect.x + targetRect.width / 2,
        targetRect.y + targetRect.height / 2
      )
    );

    const connection = new PIXI.Graphics();
    connection.lineStyle(2, 0x0000ff, 1);
    const sourcePointX = sourcePoint.x;
    const sourcePointY = sourcePoint.y;

    // draw curve from 0,0 as PIXI.Graphics sourceates from 0,0
    const toX = targetPoint.x - sourcePoint.x;
    const toY = targetPoint.y - sourcePoint.y;
    const cpX = Math.abs(toX) / 2;
    const cpY = 0;
    const cpX2 = cpX;
    const cpY2 = toY;
    connection.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

    // offset curve to start from source
    connection.x = sourcePointX;
    connection.y = sourcePointY;

    this._connectionRef = this.addChild(connection);
  }

  updateConnection(): void {
    // redraw background due to node movement
    this._connectionRef.clear();
    const sourceRect = this.source.children[0].getBounds();
    const sourcePoint = this.viewport.toWorld(
      new PIXI.Point(
        sourceRect.x + sourceRect.width / 2,
        sourceRect.y + sourceRect.height / 2
      )
    );

    const targetRect = this.target.children[0].getBounds();
    const targetPoint = this.viewport.toWorld(
      new PIXI.Point(
        targetRect.x + targetRect.width / 2,
        targetRect.y + targetRect.height / 2
      )
    );

    this._connectionRef.lineStyle(2, 0x0000ff, 1);
    const sourcePointX = sourcePoint.x;
    const sourcePointY = sourcePoint.y;

    // draw curve from 0,0 as PIXI.Graphics sourceates from 0,0
    const toX = targetPoint.x - sourcePoint.x;
    const toY = targetPoint.y - sourcePoint.y;
    const cpX = Math.abs(toX) / 2;
    const cpY = 0;
    const cpX2 = cpX;
    const cpY2 = toY;
    this._connectionRef.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);

    // offset curve to start from source
    this._connectionRef.x = sourcePointX;
    this._connectionRef.y = sourcePointY;
  }
}

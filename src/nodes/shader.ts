/* eslint-disable prettier/prettier */
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs } from '../utils/interfaces';
import { NODE_TYPE_COLOR } from '../utils/constants';

export class Shader extends PPNode {
  graphics: PIXI.Graphics;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    const nodeColor = NODE_TYPE_COLOR.DRAW;

    super(name, graph, {
      ...customArgs,
      color: nodeColor,
    });

    this.name = 'Draw shader';
    this.description = 'Draws a shader';

    const canvas = this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container;

    this.graphics = new PIXI.Graphics();
    canvas.addChild(this.graphics);

    this.onExecute = function (input) {
      //const triangle = new PIXI.Mesh(
      //  new PIXI.MeshGeometry(),
      //  new PIXI.MeshMaterial(PIXI.Texture.WHITE)
      //);

      this.graphics.clear();
      this.graphics.beginFill(0x3498db);
      this.graphics.drawCircle(this.x + 300, this.y, 100);
    };

    this.onNodeRemoved = (): void => {
      canvas.removeChild(this.graphics);
    };
  }

  protected shouldExecuteOnMove(): boolean {
    return true;
  }
}

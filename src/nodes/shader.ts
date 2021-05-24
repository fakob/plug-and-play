/* eslint-disable prettier/prettier */
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode, { UpdateBehaviour } from '../classes/NodeClass';
import { CustomArgs } from '../utils/interfaces';
import { NODE_TYPE_COLOR } from '../utils/constants';

export class Shader extends PPNode {
  graphics: PIXI.Mesh;

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

    this.updateBehaviour.update = false;
    this.updateBehaviour.interval = true;
    this.updateBehaviour.intervalFrequency = 1;

    const geometry = new PIXI.Geometry()
      .addAttribute(
        'aVertexPosition', // the attribute name
        [
          -100,
          -50, // x, y
          100,
          -50, // x, y
          0.0,
          100.0,
        ], // x, y
        2
      ) // the size of the attribute

      .addAttribute(
        'aColor', // the attribute name
        [
          1,
          0,
          0, // r, g, b
          0,
          1,
          0, // r, g, b
          0,
          0,
          1,
        ], // r, g, b
        3
      ); // the size of the attribute

    const shader = PIXI.Shader.from(
      `

    precision mediump float;
    attribute vec2 aVertexPosition;
    attribute vec3 aColor;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;
    uniform float time;

    varying vec3 vColor;

    void main() {

        vColor = aColor;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    }`,

      `precision mediump float;
    uniform float time;


    varying vec3 vColor;

    void main() {
        gl_FragColor = vec4(vColor*vec3(abs(sin(time)),abs(cos(time)), 1), 1.0);
    }

`
    );

    this.onExecute = function (input) {
      canvas.removeChild(this.graphics);

      const currentTime = new Date().getTime();

      this.graphics = new PIXI.Mesh(
        geometry,
        new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
          program: shader.program,
          uniforms: { time: (currentTime / 1000) % 1000 },
        })
      );

      this.graphics.position.set(this.x + 400, this.y);
      canvas.addChild(this.graphics);
    };

    this.onNodeRemoved = (): void => {
      canvas.removeChild(this.graphics);
    };
  }

  protected shouldExecuteOnMove(): boolean {
    return true;
  }

  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, false, true, 16);
  }
}

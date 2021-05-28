/* eslint-disable prettier/prettier */
import * as PIXI from 'pixi.js';
import PPGraph from '../classes/GraphClass';
import PPNode, { UpdateBehaviour } from '../classes/NodeClass';
import { CustomArgs } from '../utils/interfaces';
import { DATATYPE, NODE_TYPE_COLOR } from '../utils/constants';

const defaultVertex = `
precision mediump float;
attribute vec2 aVertexPosition;
attribute vec3 aColor;
attribute vec2 vUV;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;
uniform float time;

varying vec2 uv;

void main() {
  uv = vUV;
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}`;

const defaultFragment = `
precision mediump float;
uniform float time;

varying vec2 uv;

void main() {
  gl_FragColor = vec4(0.5,uv*vec2(sin(time),cos(time)),1.0);
}

`;

const errorFragment = `
precision mediump float;
uniform float time;

varying vec2 uv;

void main() {
  gl_FragColor = vec4(1,0,0,1.0);
}
`;
const vertexShaderInputName = 'Vertex Shader';
const fragmentShaderInputName = 'Fragment Shader';
export class Shader extends PPNode {
  graphics: PIXI.Mesh;

  prevVertex: string = defaultVertex;
  prevFragment: string = defaultFragment;

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DEFAULT,
    });

    this.name = 'Draw shader';
    this.description = 'Draws a shader';

    this.addInput(vertexShaderInputName, DATATYPE.STRING, defaultVertex);
    this.addInput(fragmentShaderInputName, DATATYPE.STRING, defaultFragment);

    const canvas = this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container;

    this.updateBehaviour.update = false;
    this.updateBehaviour.interval = true;
    this.updateBehaviour.intervalFrequency = 1;

    //const geometry = new PIXI.QuadUv();

    const geometry = new PIXI.Geometry()
      .addAttribute(
        'aVertexPosition', // the attribute name
        [
          -100,
          100, // x, y
          100,
          100, // x, y
          100,
          -100,
          -100,
          -100,
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
          0,
          1,
          0,
        ], // r, g, b
        3
      )
      .addAttribute('vUV', [0, 0, 1, 0, 1, 1, 0, 1], 2)
      .addIndex([0, 1, 2, 0, 2, 3]); // the size of the attribute

    let shader = PIXI.Shader.from(defaultVertex, defaultFragment);

    this.onExecute = function (input) {
      canvas.removeChild(this.graphics);

      const currentTime = new Date().getTime();

      if (
        input[vertexShaderInputName] !== this.prevVertex ||
        input[fragmentShaderInputName] !== this.prevFragment
      ) {
        // regenerate shader
        try {
          this.prevVertex = input[vertexShaderInputName];
          this.prevFragment = input[fragmentShaderInputName];
          const newShader = PIXI.Shader.from(
            this.prevVertex,
            this.prevFragment
          );
          shader = newShader;
        } catch (error) {
          shader = PIXI.Shader.from(defaultVertex, errorFragment);
          // dont apply shader if its bad
        }
      }

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

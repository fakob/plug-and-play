/* eslint-disable prettier/prettier */
import * as PIXI from 'pixi.js';
import PPGraph from '../../classes/GraphClass';
import PPNode, { UpdateBehaviour } from '../../classes/NodeClass';
import { CustomArgs } from '../../utils/interfaces';
import { DATATYPE, NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import Socket from '../../classes/SocketClass';

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

// designate your input data yourself, it will be automatically fed in here
//uniform float inputData;
varying vec2 uv;

void main() {
  gl_FragColor = vec4(0.5,uv*vec2(sin(time),cos(time)),1.0);
}

`;

const errorFragment = `
precision mediump float;
varying vec2 uv;

void main() {
  gl_FragColor = vec4(1,0,0,1.0);
}
`;
const vertexShaderInputName = 'Vertex Shader';
const fragmentShaderInputName = 'Fragment Shader';
const sizeXInputName = 'Size X';
const sizeYInputName = 'Size Y';
const offsetXInputName = 'Offset X';
const offsetYInputName = 'Offset Y';
const inputDataName = 'Input Data';
export class Shader extends PPNode {
  graphics: PIXI.Mesh;

  prevVertex: string;
  prevFragment: string;

  protected getInitialVertex(): string {
    return defaultVertex;
  }
  protected getInitialFragment(): string {
    return defaultFragment;
  }

  protected getDefaultSize(): number {
    return 200;
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        sizeXInputName,
        DATATYPE.NUMBER,
        this.getDefaultSize()
      ),
      new Socket(
        SOCKET_TYPE.IN,
        sizeYInputName,
        DATATYPE.NUMBER,
        this.getDefaultSize()
      ),
      new Socket(SOCKET_TYPE.IN, offsetYInputName, DATATYPE.NUMBER, 0),
      new Socket(SOCKET_TYPE.IN, offsetXInputName, DATATYPE.NUMBER, 300),
      new Socket(SOCKET_TYPE.IN, inputDataName, DATATYPE.ANY, ''),
      new Socket(
        SOCKET_TYPE.IN,
        vertexShaderInputName,
        DATATYPE.STRING,
        this.getInitialVertex()
      ),
      new Socket(
        SOCKET_TYPE.IN,
        fragmentShaderInputName,
        DATATYPE.STRING,
        this.getInitialFragment()
      ),
    ];
  }

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: NODE_TYPE_COLOR.DEFAULT,
    });

    this.name = 'Draw shader';
    this.description = 'Draws a shader';

    const canvas = this.graph.viewport.getChildByName(
      'backgroundCanvas'
    ) as PIXI.Container;

    this.prevVertex = this.getInitialVertex();
    this.prevFragment = this.getInitialFragment();

    let shader = PIXI.Shader.from(this.prevVertex, this.prevFragment);

    this.onExecute = async function (input) {
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

      const startX = input[offsetXInputName];
      const endX = startX + input[sizeXInputName];

      const startY = input[offsetYInputName];
      const endY = input[offsetYInputName] + input[sizeYInputName];

      const geometry = new PIXI.Geometry()
        .addAttribute(
          'aVertexPosition', // the attribute name
          [
            startX,
            endY, // x, y
            endX,
            endY, // x, y
            endX,
            startY,
            startX,
            startY,
          ], // x, y
          2
        ) // the size of the attribute

        .addAttribute('vUV', [0, 0, 1, 0, 1, 1, 0, 1], 2)
        .addIndex([0, 1, 2, 0, 2, 3]); // the size of the attribute

      this.graphics = new PIXI.Mesh(
        geometry,
        new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
          program: shader.program,
          uniforms: {
            time: (currentTime / 1000) % 1000,
            inputData: input[inputDataName],
          },
        })
      );

      this.graphics.position.set(this.x, this.y);
      canvas.addChild(this.graphics);
    };

    this.onNodeRemoved = (): void => {
      canvas.removeChild(this.graphics);
    };
    return;
  }

  protected shouldExecuteOnMove(): boolean {
    return true;
  }

  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, false, true, 16);
  }
}

const mandelbrotFragment = `
precision mediump float;
uniform float time;
uniform float inputData;
varying vec2 uv;


void main() {
  vec2 current = vec2(0,0);
  int max = int(inputData);
  float deathPoint = 0.;
 
  for (int i = 0; i < 200; i++){
    current = vec2(pow(current.x,2.) - pow(current.y,2.), current.x*current.y*2.) + (uv - vec2(0.5,0.5))*3.;
    if (length(current) > 2.){
        deathPoint = float(i);
        }

  }

  gl_FragColor = vec4(deathPoint/100.0,pow(length(current),2.0),length(current-uv),1);
}
`;

export class Mandelbrot extends Shader {
  protected getInitialFragment(): string {
    return mandelbrotFragment;
  }
  protected getDefaultSize(): number {
    return 20000;
  }

  // dont need to update on interval really
  protected getUpdateBehaviour(): UpdateBehaviour {
    return new UpdateBehaviour(false, true, false, 16);
  }
}

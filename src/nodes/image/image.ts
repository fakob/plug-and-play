/* eslint-disable prettier/prettier */
import * as PIXI from 'pixi.js';
import { fitAndPosition } from 'object-fit-math';
import type { FitMode } from 'object-fit-math/dist/types';
import PPGraph from '../../classes/GraphClass';
import { SerializedNode, TRgba } from '../../utils/interfaces';
import {
  DEFAULT_IMAGE,
  NODE_TYPE_COLOR,
  NODE_MARGIN,
  OBJECT_FIT_OPTIONS,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import Socket from '../../classes/SocketClass';
import { ImageType } from '../datatypes/imageType';
import PPNode from '../../classes/NodeClass';
import { JSONType } from '../datatypes/jsonType';
import { EnumType } from '../datatypes/enumType';
import { TriggerType } from '../datatypes/triggerType';

const imageInputName = 'Image';
const imageObjectFit = 'Object fit';
const imageResetSize = 'Reset size';
const imageOutputName = 'Image';
const imageOutputDetails = 'Details';

export class Image extends PPNode {
  sprite: PIXI.Sprite;
  texture: PIXI.Texture;
  maskRef: PIXI.Graphics;

  public getName(): string {
    return 'Image';
  }

  public getDescription(): string {
    return 'Draws an Image (base64)';
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        imageInputName,
        new ImageType(),
        DEFAULT_IMAGE
      ),
      new Socket(
        SOCKET_TYPE.IN,
        imageObjectFit,
        new EnumType(OBJECT_FIT_OPTIONS),
        'cover',
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        imageResetSize,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'resetNodeSize'),
        0,
        false
      ),
      new Socket(
        SOCKET_TYPE.OUT,
        imageOutputName,
        new ImageType(),
        DEFAULT_IMAGE
      ),
      new Socket(
        SOCKET_TYPE.OUT,
        imageOutputDetails,
        new JSONType(),
        undefined,
        false
      ),
    ];
  }

  public getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  public getOpacity(): number {
    return 0.2;
  }

  public getShrinkOnSocketRemove(): boolean {
    return false;
  }

  public onConfigure = (nodeConfig: SerializedNode) => {
    console.log(nodeConfig.width);
    this.getDefaultNodeWidth = () => {
      return nodeConfig.width;
    };
    this.getDefaultNodeHeight = () => {
      return nodeConfig.height;
    };
    this.resizeAndDraw(nodeConfig.width, nodeConfig.height);
    // this.width = nodeConfig.width;
    // this.height = nodeConfig.height;
    this.executeOptimizedChain();
  };

  public setNodeSizes = () => {
    if (this.texture === undefined) {
      this.executeOptimizedChain();
    }
    const aspectRatio = this.texture.width / this.texture.height;
    this.getMinNodeHeight = () => {
      return this.getMinNodeWidth() / aspectRatio;
    };
  };

  public resetNodeSize = () => {
    this.setNodeSizes();
    this.resizeAndDraw(this.texture.width, this.texture.height);
    PPGraph.currentGraph.selection.drawRectanglesFromSelection();
  };

  public updateTexture = (base64: string): void => {
    this.setInputData(imageOutputName, base64);
    this.setOutputData(imageOutputName, base64);
    this.texture = PIXI.Texture.from(base64);
    this.sprite.texture = this.texture;
    this.sprite.texture.update();
    this.executeOptimizedChain();
  };

  private hasBaseTextureLoaded = (): void => {
    if (this.texture.valid) {
      this.setNodeSizes();
      this.resizeAndDraw(
        this.getDefaultNodeWidth(),
        this.getDefaultNodeHeight()
      );
    }
  };

  public onExecute = async function (input, output) {
    const base64 = input[imageInputName];
    const objectFit = input[imageObjectFit];
    if (base64) {
      const newWidth = this.width;
      const newHeight = this.height;

      this.texture = PIXI.Texture.from(base64);

      // callback when a new texture has been loaded
      this.texture.baseTexture.on('loaded', this.hasBaseTextureLoaded);

      // create image mask
      // only run once if the mask is not yet defined
      if (this.maskRef === undefined) {
        this.maskRef = new PIXI.Graphics();
        this.maskRef.beginFill(0xffffff);
        this.maskRef.drawRect(0, 0, this.width - 2 * NODE_MARGIN, this.height);
        this.maskRef.x = NODE_MARGIN;
        this.maskRef.endFill();
        (this as PIXI.Container).addChild(this.maskRef);
      }
      const prevSprite: PIXI.Sprite = this.sprite;
      this.sprite = new PIXI.Sprite(this.texture);
      this.sprite.mask = this.maskRef;

      console.log(this.width, this.height, newWidth, newHeight);
      this.doFitAndPosition(newWidth, newHeight, objectFit);

      this.addChild(this.sprite);
      // wait with the clear to avoid flashing
      setTimeout(() => this.removeChild(prevSprite), 20);
      // race condition here? dont know why this is needed...
      await new Promise((resolve) => setTimeout(resolve, 1));

      output[imageOutputName] = base64;
      output[imageOutputDetails] = {
        textureWidth: this.texture.width,
        textureHeight: this.texture.height,
        width: Math.round(this.width),
        height: Math.round(this.height),
      };
    }
  };

  public onNodeResize = (newWidth, newHeight) => {
    if (this.sprite !== undefined) {
      const objectFit = this.getInputData(imageObjectFit);
      this.doFitAndPosition(newWidth, newHeight, objectFit);
      this.maskRef.width = newWidth;
      this.maskRef.height = newHeight;
    }
    this.setOutputData(imageOutputDetails, {
      textureWidth: this.texture?.width,
      textureHeight: this.texture?.height,
      width: Math.round(this.width),
      height: Math.round(this.height),
    });
  };

  // scale input if node is scaled
  public onNodeDragOrViewportMove = () => {
    this.drawComment();
  };

  public onNodeRemoved = (): void => {
    this.texture.baseTexture.removeAllListeners('loaded');
  };

  private doFitAndPosition = (
    newWidth: number,
    newHeight: number,
    objectFit: FitMode
  ): void => {
    const parentSize = {
      width: newWidth,
      height: newHeight,
    };
    const childSize = {
      width: this.texture.width,
      height: this.texture.height,
    };
    const rect = fitAndPosition(parentSize, childSize, objectFit, '50%', '50%');
    console.log(rect);
    this.sprite.x = rect.x + NODE_MARGIN;
    this.sprite.y = rect.y;
    this.sprite.width = rect.width + NODE_MARGIN;
    this.sprite.height = rect.height;
  };
}

/* eslint-disable prettier/prettier */
import * as PIXI from 'pixi.js';
import { fitAndPosition } from 'object-fit-math';
import type { FitMode } from 'object-fit-math/dist/types';
import PPGraph from '../../classes/GraphClass';
import { CustomArgs, TRgba } from '../../utils/interfaces';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import {
  DEFAULT_IMAGE,
  NODE_MARGIN,
  OBJECT_FIT_OPTIONS,
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
  updateTexture: (base64: string) => void;
  setMinNodeHeight: (nodeWidth: number) => void;
  resetNodeSize: () => void;

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
        new TriggerType(),
        undefined,
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

  constructor(name: string, graph: PPGraph, customArgs: CustomArgs) {
    super(name, graph, {
      ...customArgs,
      color: TRgba.fromString(NODE_TYPE_COLOR.INPUT),
      colorTransparency: 0.2,
    });
    this.name = 'Draw Image';
    this.description = 'Draws an Image (base64)';

    this.setMinNodeHeight = (nodeWidth: number) => {
      const aspectRatio = this.texture.width / this.texture.height;
      const newNodeHeight = nodeWidth / aspectRatio;
      this.minNodeHeight = newNodeHeight;
    };

    this.resetNodeSize = () => {
      this.setMinNodeHeight(this.minNodeWidth);
      this.resizeNode(this.minNodeWidth, this.minNodeHeight);
      graph.selection.drawRectanglesFromSelection();
    };

    this.updateTexture = (base64: string): void => {
      this.setInputData(imageOutputName, base64);
      this.setOutputData(imageOutputName, base64);
      this.texture = PIXI.Texture.from(base64);
      this.sprite.texture = this.texture;
      this.sprite.texture.update();
      this.execute();
    };

    const hasBaseTextureLoaded = (): void => {
      if (this.texture.valid) {
        this.setMinNodeHeight(this.minNodeWidth);
        this.resizeNode(this.minNodeWidth, this.minNodeHeight);
      }
    };

    const doFitAndPosition = (
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
      const rect = fitAndPosition(
        parentSize,
        childSize,
        objectFit,
        '50%',
        '50%'
      );
      this.sprite.x = rect.x;
      this.sprite.y = rect.y;
      this.sprite.width = rect.width;
      this.sprite.height = rect.height;
    };

    this.onExecute = async function (input, output) {
      const base64 = input[imageInputName];
      const objectFit = input[imageObjectFit];
      if (base64) {
        this.texture = PIXI.Texture.from(base64);

        // callback when a new texture has been loaded
        this.texture.baseTexture.on('loaded', hasBaseTextureLoaded);

        // create image mask
        // only run once if the mask is not yet defined
        if (this.maskRef === undefined) {
          this.maskRef = new PIXI.Graphics();
          this.maskRef.beginFill(0xffffff);
          this.maskRef.drawRect(
            0,
            0,
            this.width - 2 * NODE_MARGIN,
            this.height
          );
          this.maskRef.x = NODE_MARGIN;
          this.maskRef.endFill();
          (this as PIXI.Container).addChild(this.maskRef);
        }

        const prevSprite: PIXI.Sprite = this.sprite;
        this.sprite = new PIXI.Sprite(this.texture);
        this.sprite.mask = this.maskRef;

        doFitAndPosition(this.width, this.height, objectFit);

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

    this.onNodeResize = (newWidth, newHeight) => {
      if (this.sprite !== undefined) {
        const objectFit = this.getInputData(imageObjectFit);
        doFitAndPosition(newWidth + 2 * NODE_MARGIN, newHeight, objectFit);
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
    this.onNodeDragOrViewportMove = () => {
      this.drawComment();
    };

    this.onNodeRemoved = (): void => {
      this.texture.baseTexture.removeAllListeners('loaded');
    };
  }

  trigger(): void {
    this.resetNodeSize();
  }
}

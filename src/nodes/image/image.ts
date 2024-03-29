/* eslint-disable prettier/prettier */
import * as PIXI from 'pixi.js';
import { fitAndPosition } from 'object-fit-math';
import type { FitMode } from 'object-fit-math/dist/types';
import PPGraph from '../../classes/GraphClass';
import { saveBase64AsImage } from '../../utils/utils';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import {
  DEFAULT_IMAGE,
  NODE_TYPE_COLOR,
  NODE_MARGIN,
  NODE_SOURCE,
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
const imageExport = 'Save image';
const imageOutputName = 'Image';
const imageOutputDetails = 'Details';
const imageOutputExif = 'Exif';

const IMPORT_NAME = 'exifreader';

export class Image extends PPNode {
  sprite: PIXI.Sprite;
  texture: PIXI.Texture;
  maskRef: PIXI.Graphics;

  public getName(): string {
    return 'Image';
  }

  public getDescription(): string {
    return 'Draws an Image. To import an image, just drag the file onto the playground';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  public getDynamicImports(): string[] {
    return [IMPORT_NAME];
  }

  protected getDefaultIO(): Socket[] {
    return [
      new Socket(
        SOCKET_TYPE.IN,
        imageInputName,
        new ImageType(),
        DEFAULT_IMAGE,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        imageObjectFit,
        new EnumType(OBJECT_FIT_OPTIONS),
        'cover',
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        imageResetSize,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'resetNodeSize'),
        0,
        false,
      ),
      new Socket(
        SOCKET_TYPE.IN,
        imageExport,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'saveImage'),
        0,
        false,
      ),
      new Socket(
        SOCKET_TYPE.OUT,
        imageOutputName,
        new ImageType(),
        DEFAULT_IMAGE,
      ),
      new Socket(
        SOCKET_TYPE.OUT,
        imageOutputDetails,
        new JSONType(),
        undefined,
        false,
      ),
      new Socket(
        SOCKET_TYPE.OUT,
        imageOutputExif,
        new JSONType(),
        undefined,
        false,
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

  public getDefaultNodeWidth() {
    return !this.texture ? super.getDefaultNodeWidth() : this.texture.width;
  }

  public getDefaultNodeHeight() {
    return !this.texture ? super.getDefaultNodeHeight() : this.texture.height;
  }

  public async onNodeAdded(source: TNodeSource): Promise<void> {
    await super.onNodeAdded(source);
    this.sprite = new PIXI.Sprite();
    this._ForegroundRef.addChild(this.sprite);

    this.maskRef = new PIXI.Graphics();
    this._ForegroundRef.addChild(this.maskRef);
    this.sprite.mask = this.maskRef;

    let texture;
    try {
      texture = await PIXI.Assets.load(this.getInputData('Image'));
    } catch (error) {
      texture = await PIXI.Assets.load(DEFAULT_IMAGE);
    }
    this.texture = new PIXI.Texture(texture);
    this.sprite.texture = this.texture;
    this.sprite.texture.update();

    this.maskRef.beginFill(0xffffff);
    this.maskRef.drawRect(0, 0, this.texture.width, this.texture.height);
    this.maskRef.x = NODE_MARGIN;
    this.maskRef.endFill();

    // set width and height to texture size
    if (source !== NODE_SOURCE.SERIALIZED) {
      this.setInitialNodeSize();
    } else {
      super.resizeAndDraw();
    }
  }

  setInitialNodeSize = () => {
    if (this.texture !== undefined) {
      this.setMinNodeHeight();
      this.resizeAndDraw(
        this.getMinNodeWidth() * 2,
        this.getMinNodeHeight() * 2,
      );
      PPGraph.currentGraph.selection.drawRectanglesFromSelection();
    }
  };

  resetNodeSize = () => {
    if (this.texture !== undefined) {
      this.setMinNodeHeight();
      this.resizeAndDraw(this.texture.width, this.texture.height);
      PPGraph.currentGraph.selection.drawRectanglesFromSelection();
    }
  };

  setMinNodeHeight = () => {
    const aspectRatio = this.texture.width / this.texture.height;
    this.getMinNodeHeight = () => {
      return this.getMinNodeWidth() / aspectRatio;
    };
  };

  onNodeResize = (newWidth, newHeight) => {
    // make sure node has been added
    if (this.maskRef && this.texture) {
      const objectFit = this.getInputData(imageObjectFit);
      this.doFitAndPosition(newWidth, newHeight, objectFit);
      this.maskRef.width = newWidth;
      this.maskRef.height = newHeight;
      this.setOutputData(imageOutputDetails, {
        textureWidth: this.texture.width,
        textureHeight: this.texture.height,
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    }
  };

  doFitAndPosition = (
    newWidth: number,
    newHeight: number,
    objectFit: FitMode,
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
    this.sprite.x = rect.x + NODE_MARGIN;
    this.sprite.y = rect.y;
    this.sprite.width = rect.width;
    this.sprite.height = rect.height;
  };

  updateTexture = async (base64: string): Promise<void> => {
    if (this.sprite) {
      this.setInputData(imageOutputName, base64);
      const texture = await PIXI.Assets.load(base64);

      // this.texture.baseTexture.destroy();
      // need to find a way to check if a baseTexture is used elsewhere
      // until then baseTextures are kept

      this.texture = new PIXI.Texture(texture);
      this.sprite.texture = this.texture;
      this.sprite.texture.update();

      const arrayBuffer = await fetch(base64).then((b) => b.arrayBuffer());
      const tags = PPGraph.currentGraph.dynamicImports[IMPORT_NAME].load(
        arrayBuffer,
        { expanded: true },
      );

      this.setOutputData(imageOutputName, base64);
      this.setOutputData(imageOutputDetails, {
        textureWidth: this.texture.width,
        textureHeight: this.texture.height,
        width: Math.round(this.maskRef.width),
        height: Math.round(this.maskRef.height),
      });
      this.setOutputData(imageOutputExif, JSON.stringify(tags));
    }
  };

  updateAndExecute = async (base64: string): Promise<void> => {
    await this.updateTexture(base64);
    this.executeChildren();
  };

  onExecute = async function (input) {
    const base64 = input[imageInputName];
    await this.updateTexture(base64);
  };

  saveImage = async () => {
    const base64 = this.getInputData(imageOutputName);
    await saveBase64AsImage(base64, this.name);
  };
}

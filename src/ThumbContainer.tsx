import * as PIXI from 'pixi.js';
import { HTMLText } from '@pixi/text-html';
import { TextStyle } from '@pixi/text';

// Can use the TextStyle class found in @pixi/text
const style = new TextStyle({ fontSize: 20 });

export default class ThumbContainer extends PIXI.Container {
  _spriteRef: PIXI.DisplayObject;

  _thumbInfoRef: PIXI.DisplayObject;

  _SelectionRef: PIXI.DisplayObject;

  _selected: boolean;

  dragging: boolean;

  relativeClickPosition: PIXI.Point | null;

  clickPosition: PIXI.Point | null;

  interactionData: PIXI.InteractionData | null;

  constructor(x = 0, y = 0, width = 160, aspectRatio = 16 / 9, name = 'thumb') {
    super();
    this.x = x;
    this.y = y;
    this.name = name;
    // const thumbInfo = new PIXI.Text(`x:${Math.round(x)}, y:${Math.round(y)}`, {
    //   fontFamily: 'Arial',
    //   fontSize: 12,
    //   fill: 0xffffff,
    //   // align: 'center',
    // });
    // Make a new HTMLText object
    const thumbInfo = new HTMLText('Hello World', style);
    // thumbInfo.resolution = TEXT_RESOLUTION; // so one can zoom in closer and it keeps a decent resolution

    const frameSprite = new PIXI.Graphics();
    frameSprite.beginFill(0xde3249);
    frameSprite.drawRect(0, 0, 320, 240);
    frameSprite.endFill();

    // const frameSprite2 = new PIXI.Graphics();
    // frameSprite2.beginFill(0xffffff);
    // frameSprite2.drawRect(0, 0, 10, 10);
    // frameSprite2.endFill();

    frameSprite.width = width;
    frameSprite.height = width / aspectRatio;

    const selection = new PIXI.Graphics();

    // Rectangle
    selection.lineStyle(4, 0xffbd01, 1, 0);
    selection.drawRect(0, 0, frameSprite.width, frameSprite.height);
    selection.alpha = 0;

    this._spriteRef = this.addChild(frameSprite);
    this._thumbInfoRef = this.addChild(thumbInfo);
    // this._thumbInfoRef = this.addChild(frameSprite2);
    this._SelectionRef = this.addChild(selection);

    this.interactive = true;
    this.interactionData = null;
    this.relativeClickPosition = null;
    this.clickPosition = null;
    this.dragging = false;
    this._selected = false;

    this._addListeners();
  }

  // GETTERS & SETTERS

  get spriteRef(): PIXI.DisplayObject {
    return this._spriteRef;
  }

  get thumbInfoRef(): PIXI.DisplayObject {
    return this._thumbInfoRef;
  }

  get selected(): boolean {
    return this._selected;
  }

  // SETUP

  _addListeners(): void {
    this.on('pointerdown', this._onDragStart.bind(this));
    this.on('pointerup', this._onDragEnd.bind(this));
    this.on('pointerupoutside', this._onDragEnd.bind(this));
    this.on('pointermove', this._onDragMove.bind(this));
    this.on('pointerover', this._onSpriteOver.bind(this));
    this.on('pointerout', this._onSpriteOut.bind(this));
    // this.on('click', this._onClick.bind(this));
  }

  _onDragStart(event: any): void {
    this.interactionData = event.data;
    this.clickPosition = new PIXI.Point(
      event.data.originalEvent.screenX,
      event.data.originalEvent.screenY
    );
    this.cursor = 'grabbing';
    if (this._selected) {
      this.alpha = 0.5;
      this.dragging = true;
      const localPositionX = this.position.x;
      const localPositionY = this.position.y;
      const localClickPosition = this.interactionData.getLocalPosition(
        this.parent
      );
      const localClickPositionX = localClickPosition.x;
      const localClickPositionY = localClickPosition.y;
      const deltaX = localClickPositionX - localPositionX;
      const deltaY = localClickPositionY - localPositionY;
      this.relativeClickPosition = new PIXI.Point(deltaX, deltaY);
    }
  }

  _onDragEnd(event: any): void {
    const evData = event.data.originalEvent;
    // if real dragend
    if (this.clickPosition !== null) {
      if (
        Math.abs(this.clickPosition.x - evData.screenX) < 2 ||
        Math.abs(this.clickPosition.y - evData.screenY) < 2
      ) {
        this._onClick();
      } else {
        event.stopPropagation();
      }
    }

    this.alpha = 1;
    this.dragging = false;
    // set the interactionData to null
    this.interactionData = null;
  }

  _onDragMove(): void {
    if (
      this.dragging &&
      this.interactionData !== null &&
      this.relativeClickPosition !== null
    ) {
      const newPosition = this.interactionData.getLocalPosition(this.parent);
      this.x = newPosition.x - this.relativeClickPosition.x;
      this.y = newPosition.y - this.relativeClickPosition.y;
    }
  }

  _onSpriteOver(): void {
    if (this._selected) {
      this.cursor = 'move';
    } else {
      this.cursor = 'grab';
    }
  }

  _onSpriteOut(): void {
    if (!this.dragging) {
      this.alpha = 1.0;
      this.cursor = 'default';
    }
  }

  _onClick(): void {
    if (this._selected) {
      // this.alpha = 1;
      this._selected = false;
      this._SelectionRef.alpha = 0;
      this.cursor = 'pointer';
    } else {
      this._selected = true;
      this._SelectionRef.alpha = 1;
      this.cursor = 'move';
    }
  }
}
